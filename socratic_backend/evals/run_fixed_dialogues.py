"""Run the fixed dialogue regression set against the local LangGraph tutor.

This runner deliberately bypasses the HTTP/authentication and persistence layers.
It calls the compiled graph with isolated state, so an evaluation run never writes
student memory, learning records, or Supabase data.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv


EVAL_DIR = Path(__file__).resolve().parent
BACKEND_DIR = EVAL_DIR.parent
DATASET_PATH = EVAL_DIR / "fixed_dialogues.json"
DEFAULT_RESULTS_DIR = EVAL_DIR / "results"

TASK_CONTEXTS = {
    "qb-first-variable": "Store the text Python in a variable named language, then print it.",
    "qb-update-variable": "score starts at 5. Add 2, store it back in score, and print 7.",
    "qb-integer-input": "Read an integer age and print the age plus one.",
    "qb-first-comparison": "Read two integers and print whether the first is greater than the second.",
    "qb-first-if": "Read an integer. If it is positive, print Positive; otherwise print nothing.",
    "qb-range-count": "Use range() and a for loop to print 1 through 5, one per line.",
    "qb-first-while-loop": "Use a while loop to print 1, 2, and 3 and update it so it stops.",
    "qb-number-converter": "Read two whole numbers, convert them to integers, and print their sum.",
    "qb-string-formatter": "Print the exact text Hello, Python! with matching punctuation.",
    "qb-even-odd-counter": "Read one integer and print Even or Odd using the remainder operator.",
    "qb-loop-sum": "Read n and use a loop and accumulator to print the sum from 1 through n.",
    "qb-find-maximum": "Read a list of integers and keep track of and print the largest value.",
}

IMPROVEMENT_AREAS = {
    "language": {
        "locations": ["server.py:_resolve_response_language", "agent_services.py:run_reflection_summary_agent", "prompts.py:REFLECTION_SUMMARY_PROMPT"],
        "action": "检查最新学生消息的语言识别，以及反思总结 Agent 的最终回答语言约束。",
    },
    "question_count": {
        "locations": ["socratic_dialogue_graph.py:validate_question_node", "socratic_dialogue_graph.py:generate_socratic_question_node"],
        "action": "在最终回答生成处强化“一次最多一个学生问题”，并在输出后增加问题数量校验。",
    },
    "solution_leak": {
        "locations": ["socratic_dialogue_graph.py:validate_question_node", "socratic_dialogue_graph.py:generate_socratic_question_node", "graph_nodes.py:socratic_dialogue_agent"],
        "action": "加强完整代码泄露限制，并根据 hint_level 只允许逐级增加提示。",
    },
    "required_content": {
        "locations": ["graph_nodes.py:code_diagnosis_agent", "graph_nodes.py:student_answer_evaluator", "socratic_dialogue_graph.py:generate_socratic_question_node"],
        "action": "确认当前代码、运行错误和题目上下文被传入分析节点，并要求回答引用可见证据。",
    },
    "state_progression": {
        "locations": ["graph_nodes.py:student_answer_evaluator", "agent_services.py:evaluate_tutor_answer", "graph_state.py:TutorState"],
        "action": "检查 answer_quality、resolved concepts 和 currentFocus 的更新规则，答对后应推进焦点。",
    },
    "strategy": {
        "locations": ["graph_nodes.py:learning_state_monitor", "graph_nodes.py:socratic_dialogue_agent", "agent_services.py:run_learning_state_monitor_agent"],
        "action": "检查教学策略选择和 hint_level 升级；连续困惑时应从提问升级为示例或伪代码。",
    },
    "repetition": {
        "locations": ["graph_nodes.py:_was_question_already_asked", "graph_nodes.py:socratic_dialogue_agent"],
        "action": "检查历史问题语义去重；相同意图重复时切换教学策略，而不只是换一种说法。",
    },
    "plan_progression": {
        "locations": ["graph_nodes.py:problem_understanding_agent", "agent_services.py:run_problem_understanding_agent", "agent_services.py:analyze_plan_steps"],
        "action": "检查计划完整度、missing_steps 和 can_enter_coding，避免完整计划仍被基础追问。",
    },
    "runtime": {
        "locations": ["llm_base.py:base_llm_call", "tutor_graph.py:graph", "graph_nodes.py"],
        "action": "检查模型环境变量、依赖、超时及报告中的具体异常堆栈。",
    },
}

CATEGORY_GUIDANCE = {
    "understanding": ["graph_nodes.py:student_answer_evaluator", "agent_services.py:evaluate_tutor_answer"],
    "language": ["server.py:_resolve_response_language", "agent_services.py:run_reflection_summary_agent"],
    "planning": ["graph_nodes.py:problem_understanding_agent", "agent_services.py:run_problem_understanding_agent"],
    "coding": ["graph_nodes.py:student_answer_evaluator", "graph_nodes.py:socratic_dialogue_agent"],
    "debugging": ["graph_nodes.py:code_diagnosis_agent", "socratic_dialogue_graph.py:generate_socratic_question_node"],
    "evaluation": ["graph_nodes.py:code_diagnosis_agent", "agent_services.py:run_code_diagnosis_agent"],
    "hinting": ["graph_nodes.py:learning_state_monitor", "graph_nodes.py:socratic_dialogue_agent"],
    "repetition": ["graph_nodes.py:_was_question_already_asked", "graph_nodes.py:socratic_dialogue_agent"],
    "safety_pedagogy": ["socratic_dialogue_graph.py:validate_question_node", "socratic_dialogue_graph.py:generate_socratic_question_node"],
    "state_progression": ["graph_nodes.py:student_answer_evaluator", "graph_state.py:TutorState"],
    "reflection": ["graph_nodes.py:reflection_summary_agent", "agent_services.py:run_reflection_summary_agent"],
    "memory": ["memory/manager.py:MemoryManager", "server.py:get_tutor_content", "agent_services.py:evaluate_tutor_answer"],
}


def load_dataset() -> dict[str, Any]:
    return json.loads(DATASET_PATH.read_text(encoding="utf-8"))


def infer_action(stage: str) -> str:
    return {
        "plan": "review_plan",
        "debug": "debug",
        "reflect": "generate_reflection_summary",
    }.get(stage, "message")


def resolve_response_language(item: dict[str, Any]) -> str:
    """Mirror server._resolve_response_language without importing persistence."""
    source = str(item.get("student_message") or "").strip()
    if not source:
        source = next(
            (
                str(message.get("content") or "").strip()
                for message in reversed(item.get("conversation", []))
                if message.get("role") == "student" and str(message.get("content") or "").strip()
            ),
            "",
        )
    if re.search(r"[\u3400-\u9fff]", source):
        return "zh"
    if re.search(r"[A-Za-z]", source):
        return "en"
    return "zh" if item.get("ui_language") == "zh" else "en"


def build_initial_state(case: dict[str, Any]) -> dict[str, Any]:
    item = case["input"]
    conversation = item.get("conversation", [])
    previous_state = next(
        (m.get("learnerState", {}) for m in reversed(conversation) if m.get("learnerState")),
        {},
    )
    current_focus = item.get("current_focus")
    if current_focus:
        previous_state = {**previous_state, "currentFocus": current_focus}
    latest_question = next(
        (m.get("content", "") for m in reversed(conversation) if m.get("role") == "tutor"),
        "",
    )
    run = item.get("latest_run_result") or {}
    run_error = run.get("error") or {}
    run_error_type = run_error.get("type") or run.get("error_type")
    run_error_message = run_error.get("message") or run.get("stderr")
    response_language = resolve_response_language(item)
    profile = item.get("user_profile") or {}

    return {
        "response_language": response_language,
        "task_id": case["task_id"],
        "problem_content": TASK_CONTEXTS.get(case["task_id"], case["title"]),
        "action": item.get("action") or infer_action(item["stage"]),
        "stage": item["stage"],
        "entry_path": item.get("entry_path", "understand"),
        "mode": item.get("mode", "step_by_step"),
        "plan_form": item.get("planning_data", {"status": "", "approach": "", "steps": []}),
        "student_answer": item.get("student_message", ""),
        "student_code": item.get("current_code", ""),
        "code_prediction": item.get("latest_prediction", ""),
        "latest_run_status": run.get("status"),
        "latest_run_id": run.get("id"),
        "latest_run_stdout": run.get("stdout"),
        "latest_run_stderr": run.get("stderr"),
        "latest_run_duration_ms": run.get("elapsedMs"),
        "latest_run_tests": run.get("tests", []),
        "latest_error_type": run_error_type,
        "latest_error_message": run_error_message,
        "execution_result": json.dumps(run, ensure_ascii=False) if run else "",
        "student_reflection": item.get("student_message", ""),
        "messages": conversation,
        "learner_state": previous_state,
        "latest_tutor_question": latest_question,
        "prior_learning_focus": current_focus,
        "task_memory": item.get("task_memory", {}),
        "memory_loaded": bool(item.get("task_memory")),
        "short_term_memory": [],
        "short_term_memory_loaded": False,
        "user_profile_summary": profile.get("profile_summary", ""),
        "profile_memory_loaded": bool(profile),
        "profile_memory_used_by": [],
        "hint_level": item.get("hint_level", 0),
        "idle_duration_ms": item.get("idle_duration_ms", 0),
        "confusion_level": 0,
        "is_stuck": False,
        "code_error_type": run_error_type or "No Error",
        "issue_type": current_focus or "logical_error",
        "diagnosis_evidence": item.get("diagnosis_evidence", ""),
        "agent_trace": [],
    }


def count_questions(text: str) -> int:
    prose = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    return len(re.findall(r"[?？]", prose))


def detected_language(text: str) -> str:
    han = len(re.findall(r"[\u3400-\u9fff]", text))
    latin_words = len(re.findall(r"\b[A-Za-z]{2,}\b", text))
    if han >= 3 and han >= latin_words:
        return "zh"
    return "en"


def contains_any(text: str, values: list[str]) -> bool:
    lowered = text.casefold()
    return any(value.casefold() in lowered for value in values)


def get_focus(state: dict[str, Any]) -> str | None:
    learner = state.get("learner_state") or {}
    return learner.get("currentFocus") or learner.get("current_focus")


def evaluate(case: dict[str, Any], state: dict[str, Any]) -> dict[str, Any]:
    expected = case["expected"]
    text = str(state.get("tutor_message") or "").strip()
    checks: list[dict[str, Any]] = []
    review_items: list[str] = []

    def check(name: str, passed: bool, area: str, detail: str) -> None:
        checks.append({"name": name, "passed": passed, "area": area, "detail": detail})

    actual_language = detected_language(text)
    check(
        "response_language",
        actual_language == expected["response_language"],
        "language",
        f"expected={expected['response_language']}, actual={actual_language}",
    )
    actual_questions = count_questions(text)
    check(
        "max_questions",
        actual_questions <= expected["max_questions"],
        "question_count",
        f"allowed<={expected['max_questions']}, actual={actual_questions}",
    )

    forbidden = expected.get("must_not_contain", []) + expected.get("must_not_repeat", [])
    for value in forbidden:
        check(
            f"forbidden:{value[:40]}",
            value.casefold() not in text.casefold(),
            "solution_leak" if expected.get("must_not_reveal_solution") else "repetition",
            f"response must not contain: {value}",
        )
    for value in expected.get("must_preserve_terms", []):
        check(
            f"preserve:{value}",
            value in text,
            "required_content",
            f"response must preserve: {value}",
        )
    if expected.get("must_include_any"):
        values = expected["must_include_any"]
        check(
            "must_include_any",
            contains_any(text, values),
            "required_content",
            "expected at least one of: " + ", ".join(values),
        )

    focus = get_focus(state)
    old_focus = case["input"].get("current_focus")
    if "focus_must_change" in expected:
        wanted = expected["focus_must_change"]
        check(
            "focus_progression",
            (focus != old_focus) == wanted,
            "state_progression",
            f"before={old_focus}, after={focus}, must_change={wanted}",
        )
    if expected.get("expected_focus"):
        check(
            "expected_focus",
            focus == expected["expected_focus"],
            "state_progression",
            f"expected={expected['expected_focus']}, actual={focus}",
        )
    if expected.get("allowed_next_focus") and focus:
        check(
            "allowed_next_focus",
            focus in expected["allowed_next_focus"],
            "state_progression",
            f"allowed={expected['allowed_next_focus']}, actual={focus}",
        )
    if "can_enter_coding" in expected:
        actual = bool(state.get("can_enter_coding"))
        check(
            "can_enter_coding",
            actual == expected["can_enter_coding"],
            "plan_progression",
            f"expected={expected['can_enter_coding']}, actual={actual}",
        )
    if expected.get("allowed_strategies"):
        strategy = state.get("selected_action") or state.get("pedagogical_action")
        if strategy:
            check(
                "teaching_strategy",
                strategy in expected["allowed_strategies"],
                "strategy",
                f"allowed={expected['allowed_strategies']}, actual={strategy}",
            )
        else:
            review_items.append("模型未返回可机器检查的教学策略，需要人工检查回答是否符合允许策略。")

    subjective_keys = {
        "answer_quality", "hint_specificity", "must_acknowledge_intent",
        "must_change_question_intent", "must_reference_current_code",
        "current_evidence_has_priority", "must_ignore_unrelated_memory",
        "resolved_concepts_must_include", "response_mode", "must_not_repeat_basic_concepts",
        "must_follow_latest_message", "must_not_reveal_solution", "must_use_error_evidence",
    }
    if subjective_keys.intersection(expected):
        review_items.append(
            "需人工复核教学语义：" + ", ".join(sorted(subjective_keys.intersection(expected)))
        )

    failed = [item for item in checks if not item["passed"]]
    status = "fail" if failed else ("review" if review_items else "pass")
    return {
        "status": status,
        "response": text,
        "actual_language": actual_language,
        "question_count": actual_questions,
        "focus_before": old_focus,
        "focus_after": focus,
        "strategy": state.get("selected_action") or state.get("pedagogical_action"),
        "checks": checks,
        "review_items": review_items,
        "state_snapshot": {
            "can_enter_coding": state.get("can_enter_coding"),
            "hint_level": state.get("hint_level"),
            "question_type": state.get("question_type"),
            "diagnosis_evidence": state.get("diagnosis_evidence", ""),
            "learner_state": state.get("learner_state"),
            "agent_trace": state.get("agent_trace", []),
        },
    }


def run_case(graph: Any, case: dict[str, Any]) -> dict[str, Any]:
    started = time.perf_counter()
    try:
        state = graph.invoke(build_initial_state(case))
        result = evaluate(case, state)
        result["error"] = None
    except Exception as exc:  # Report one failure without losing the remaining suite.
        result = {
            "status": "error",
            "response": "",
            "checks": [],
            "review_items": [],
            "error": f"{type(exc).__name__}: {exc}",
        }
    result.update({
        "id": case["id"],
        "title": case["title"],
        "category": case["category"],
        "task_id": case["task_id"],
        "duration_ms": round((time.perf_counter() - started) * 1000),
    })
    return result


def load_previous(path: str | None) -> dict[str, str]:
    if not path:
        return {}
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    return {item["id"]: item["status"] for item in payload.get("results", [])}


def build_summary(results: list[dict[str, Any]], previous: dict[str, str]) -> dict[str, Any]:
    status_counts = Counter(item["status"] for item in results)
    categories: dict[str, Counter] = defaultdict(Counter)
    failed_areas: Counter = Counter()
    for item in results:
        categories[item["category"]][item["status"]] += 1
        for check in item.get("checks", []):
            if not check["passed"]:
                failed_areas[check["area"]] += 1
        if item["status"] == "error":
            failed_areas["runtime"] += 1
    regressions = [
        item["id"] for item in results
        if previous.get(item["id"]) in {"pass", "review"} and item["status"] in {"fail", "error"}
    ]
    improvements = [
        item["id"] for item in results
        if previous.get(item["id"]) in {"fail", "error"} and item["status"] in {"pass", "review"}
    ]
    return {
        "total": len(results),
        "statuses": dict(status_counts),
        "categories": {name: dict(counts) for name, counts in sorted(categories.items())},
        "failed_areas": dict(failed_areas.most_common()),
        "improvement_suggestions": [
            {
                "area": area,
                "failures": count,
                "locations": IMPROVEMENT_AREAS[area]["locations"],
                "action": IMPROVEMENT_AREAS[area]["action"],
            }
            for area, count in failed_areas.most_common()
        ],
        "regressions": regressions,
        "improvements": improvements,
    }


def markdown_report(report: dict[str, Any]) -> str:
    summary = report["summary"]
    statuses = summary["statuses"]
    lines = [
        "# AI Tutor 固定对话回归报告",
        "",
        f"- 运行时间：{report['metadata']['created_at']}",
        f"- 模型：{report['metadata']['model_name']}",
        f"- 总数：{summary['total']}",
        f"- 自动通过：{statuses.get('pass', 0)}",
        f"- 需要人工复核：{statuses.get('review', 0)}",
        f"- 自动失败：{statuses.get('fail', 0)}",
        f"- 运行错误：{statuses.get('error', 0)}",
        "",
        "## 分类结果",
        "",
        "| 分类 | 通过 | 复核 | 失败 | 错误 |",
        "|---|---:|---:|---:|---:|",
    ]
    for category, counts in summary["categories"].items():
        lines.append(
            f"| {category} | {counts.get('pass', 0)} | {counts.get('review', 0)} | "
            f"{counts.get('fail', 0)} | {counts.get('error', 0)} |"
        )
    lines += ["", "## 优先改进方向", ""]
    if summary["improvement_suggestions"]:
        for item in summary["improvement_suggestions"]:
            lines.append(f"### {item['area']}（{item['failures']} 个失败）")
            lines.append("")
            lines.append(f"建议：{item['action']}")
            lines.append("")
            lines.append("优先检查：")
            lines.append("")
            lines.extend(f"- `{location}`" for location in item["locations"])
            lines.append("")
    else:
        lines.append("- 没有确定性规则失败；继续人工复核教学语义。")
    if report.get("compared_with"):
        lines += [
            "", "## 与上次结果对比", "",
            f"- 新增通过：{', '.join(summary['improvements']) or '无'}",
            f"- 回归失败：{', '.join(summary['regressions']) or '无'}",
        ]
    lines += ["", "## 逐条结果", ""]
    for item in report["results"]:
        icon = {"pass": "✅", "review": "🟡", "fail": "❌", "error": "💥"}[item["status"]]
        lines += [f"### {icon} {item['id']}", "", f"分类：`{item['category']}`  ", f"耗时：{item['duration_ms']} ms", ""]
        if item.get("error"):
            lines += [f"错误：`{item['error']}`", ""]
        else:
            lines += ["AI 回答：", "", f"> {item['response'].replace(chr(10), chr(10) + '> ')}", ""]
        failures = [check for check in item.get("checks", []) if not check["passed"]]
        if failures:
            lines.append("失败原因：")
            lines.append("")
            lines.extend(f"- `{check['name']}`：{check['detail']}" for check in failures)
            lines.append("")
            areas = list(dict.fromkeys(check["area"] for check in failures))
            lines.append("建议修改位置：")
            lines.append("")
            locations = []
            for area in areas:
                locations.extend(IMPROVEMENT_AREAS[area]["locations"])
            lines.extend(f"- `{location}`" for location in dict.fromkeys(locations))
            lines.append("")
        if item.get("review_items"):
            lines.append("人工复核：")
            lines.append("")
            lines.extend(f"- {value}" for value in item["review_items"])
            lines.append("- 建议人工复核位置：" + "、".join(
                f"`{location}`" for location in CATEGORY_GUIDANCE.get(item["category"], [])
            ))
            lines.append("")
    return "\n".join(lines) + "\n"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run fixed AI Tutor dialogue regressions.")
    parser.add_argument("--case", action="append", help="Run one case ID; may be repeated.")
    parser.add_argument("--category", action="append", help="Run one category; may be repeated.")
    parser.add_argument("--limit", type=int, help="Run only the first N selected cases.")
    parser.add_argument("--compare", help="Previous JSON report used to identify improvements/regressions.")
    parser.add_argument("--output-dir", default=str(DEFAULT_RESULTS_DIR))
    parser.add_argument("--fail-on-regression", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    dataset = load_dataset()
    cases = dataset["cases"]
    if args.case:
        wanted = set(args.case)
        cases = [case for case in cases if case["id"] in wanted]
    if args.category:
        categories = set(args.category)
        cases = [case for case in cases if case["category"] in categories]
    if args.limit is not None:
        cases = cases[: max(args.limit, 0)]
    if not cases:
        print("No cases selected.", file=sys.stderr)
        return 2

    # server.py normally performs this step. The eval runner bypasses server.py,
    # so load the same backend environment before llm_base creates its client.
    load_dotenv(BACKEND_DIR / ".env")
    if not os.getenv("OPENAI_API_KEY"):
        print(
            "OPENAI_API_KEY is not configured. Set it in socratic_backend/.env "
            "or in the current environment before running model evaluations.",
            file=sys.stderr,
        )
        return 2
    sys.path.insert(0, str(BACKEND_DIR))
    from tutor_graph import graph  # Imported late so --help does not initialize the model.

    results = []
    for index, case in enumerate(cases, 1):
        print(f"[{index}/{len(cases)}] {case['id']} ...", flush=True)
        result = run_case(graph, case)
        results.append(result)
        print(f"  {result['status']} ({result['duration_ms']} ms)", flush=True)

    previous = load_previous(args.compare)
    now = datetime.now(timezone.utc)
    report = {
        "schema_version": 1,
        "metadata": {
            "created_at": now.isoformat(),
            "dataset": DATASET_PATH.name,
            "model_name": os.getenv("MODEL_NAME", "not-set"),
            "prompt_version": os.getenv("TUTOR_PROMPT_VERSION", "socratic-tutor-v1"),
            "persistence_bypassed": True,
        },
        "compared_with": args.compare,
        "summary": build_summary(results, previous),
        "results": results,
    }
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = now.strftime("%Y%m%dT%H%M%SZ")
    json_path = output_dir / f"fixed-dialogues-{stamp}.json"
    md_path = output_dir / f"fixed-dialogues-{stamp}.md"
    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(markdown_report(report), encoding="utf-8")

    statuses = report["summary"]["statuses"]
    print("\nResults")
    print(f"  pass={statuses.get('pass', 0)} review={statuses.get('review', 0)} "
          f"fail={statuses.get('fail', 0)} error={statuses.get('error', 0)}")
    print(f"  json={json_path}")
    print(f"  markdown={md_path}")
    if args.fail_on_regression and report["summary"]["regressions"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

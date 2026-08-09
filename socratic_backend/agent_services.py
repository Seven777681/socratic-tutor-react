import json
import re

from llm_base import base_llm_call
from prompts import AGENT1_PROMPT, AGENT2_PROMPT, AGENT3_PROMPT, AGENT4_PROMPT, AGENT5_PROMPT

def _field_value(line: str):
    return line.split(":", 1)[1].strip()

AGENT1_REACT_SYSTEM = """
You are Agent1, the Problem Understanding Agent, using ReAct.

You may call exactly one tool per turn from this whitelist:
- parse_problem_requirements
- analyze_student_state
- evaluate_learning_state_semantically

Use this format when you need a tool:
Thought: [brief private reasoning about what to inspect next]
Action: [tool name]
Action Input: [valid JSON object]

When you are done, use this format:
Final Answer:
{"reasoning_summary":"...","current_state":{"problem_understanding":true/false,"input_output_understanding":true/false,"algorithm_idea":true/false,"plan_complete":true/false},"action":"ACTION_NAME","message":"Message shown to student"}

Rules:
- Do not give a correct plan or model answer.
- Available actions: ASK_PROBLEM_GOAL, ASK_INPUT_OUTPUT, ASK_ALGORITHM, REQUEST_PLAN, REVIEW_PLAN, ALLOW_CODING.
- Prefer evaluate_learning_state_semantically when judging the student's natural-language answer.
- Choose ALLOW_CODING only when plan_complete is true.
- Conversation answers may demonstrate understanding, but they never count as a submitted Plan.
- plan_complete requires a non-empty Plan approach and at least two written Plan steps.
- During the Planning stage, do not ask edge-case questions. Edge cases belong to coding/debug/testing after the initial plan is ready.
- If the student has a reasonable plan, allow coding instead of adding extra checks.
- Ask only one meaningful question at a time.
"""

def _contains_any(text: str, keywords: list[str]):
    return any(word in text for word in keywords)

def parse_problem_requirements(problem: str):
    text = problem.lower()
    concept_keywords = {
        "loop": ["loop", "list", "array", "each", "maximum", "minimum", "sum", "count"],
        "condition": ["if", "condition", "range", "greater", "less", "compare"],
        "input_output": ["input", "read", "print", "output", "return"],
    }
    core_concepts = [
        concept
        for concept, keywords in concept_keywords.items()
        if _contains_any(text, keywords)
    ]
    if "maximum" in text or "largest" in text or "max" in text:
        goal = "find the largest value"
    elif "minimum" in text or "smallest" in text or "min" in text:
        goal = "find the smallest value"
    elif "sum" in text or "total" in text:
        goal = "calculate a total"
    elif "average" in text:
        goal = "calculate an average"
    else:
        goal = "produce the required output"
    return {
        "goal": goal,
        "core_concepts": core_concepts or ["problem decomposition"],
    }

def analyze_plan_steps(approach: str, steps: str, student_answer: str = ""):
    text = f"{approach}\n{steps}\n{student_answer}".lower()
    has_approach = len(approach.strip().split()) >= 5
    has_input = _contains_any(text, ["input", "read", "get", "split", "value", "number", "data", "list", "first"])
    has_logic = _contains_any(text, ["loop", "for", "while", "compare", "if", "condition", "calculate", "sum", "max", "min", "count", "update", "bigger", "larger", "largest"])
    has_output = _contains_any(text, ["print", "output", "return", "display", "answer", "result", "show"])
    written_steps = [line.strip() for line in steps.splitlines() if line.strip()]
    has_submitted_plan = len(approach.strip()) >= 5 and len(written_steps) >= 2
    missing_steps = []
    if not has_input:
        missing_steps.append("input/setup")
    if not has_logic:
        missing_steps.append("core logic")
    if not has_output:
        missing_steps.append("output/result")
    return {
        "has_approach": has_approach,
        "has_input": has_input,
        "has_logic": has_logic,
        "has_output": has_output,
        "has_submitted_plan": has_submitted_plan,
        "missing_steps": missing_steps,
    }

def analyze_student_state(problem: str, approach: str, steps: str, student_answer: str = ""):
    requirements = parse_problem_requirements(problem)
    plan_analysis = analyze_plan_steps(approach, steps, student_answer)
    text = f"{approach}\n{steps}\n{student_answer}".lower()
    problem_understanding = _contains_any(
        text,
        ["goal", "find", "largest", "maximum", "smallest", "minimum", "sum", "average", "produce", "output"],
    ) or plan_analysis["has_logic"]
    input_output_understanding = plan_analysis["has_input"] and plan_analysis["has_output"]
    algorithm_idea = plan_analysis["has_logic"]
    plan_complete = (
        problem_understanding
        and input_output_understanding
        and algorithm_idea
        and plan_analysis["has_submitted_plan"]
    )
    return {
        "requirements": requirements,
        "plan_analysis": plan_analysis,
        "current_state": {
            "problem_understanding": problem_understanding,
            "input_output_understanding": input_output_understanding,
            "algorithm_idea": algorithm_idea,
            "plan_complete": plan_complete,
        },
        "has_edge_reasoning": False,
        "requires_edge_case_check": False,
    }

def evaluate_learning_state_semantically(problem: str, approach: str, steps: str, student_answer: str = "", allow_llm: bool = True):
    fallback = analyze_student_state(problem, approach, steps, student_answer)
    if not allow_llm:
        return fallback
    prompt = """
Evaluate the student's Planning-stage cognitive state semantically.

Return only valid JSON with this shape:
{
  "current_state": {
    "problem_understanding": true/false,
    "input_output_understanding": true/false,
    "algorithm_idea": true/false,
    "plan_complete": true/false
  },
  "evidence": {
    "problem_understanding": "...",
    "input_output_understanding": "...",
    "algorithm_idea": "...",
    "plan_complete": "..."
  }
}

Rules:
- Interpret meaning, not just keywords.
- If the student says the program receives "the list" and should "produce the maximum", input_output_understanding is true.
- Judge understanding only from what the student explicitly wrote or answered. Do not infer that the student understands something merely because it appears in the problem statement.
- plan_complete is true only when all three understanding states are true AND the Plan form contains a real approach plus at least two written steps.
- Chat answers can improve the first three states, but cannot make plan_complete true without a submitted Plan.
- Do not require edge-case reasoning during the Planning stage.
"""
    user_input = (
        f"Problem: {problem}\n"
        f"Approach: {approach}\n"
        f"Steps: {steps}\n"
        f"Student answer: {student_answer}"
    )
    response_text = base_llm_call(prompt, user_input)
    json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if not json_match:
        return fallback
    try:
        parsed = json.loads(json_match.group(0))
    except json.JSONDecodeError:
        return fallback
    if not isinstance(parsed, dict) or "current_state" not in parsed:
        return fallback
    current_state = {
        key: bool(parsed.get("current_state", {}).get(key, False))
        and bool(fallback["current_state"][key])
        for key in ("problem_understanding", "input_output_understanding", "algorithm_idea")
    }
    current_state["plan_complete"] = bool(
        current_state["problem_understanding"]
        and current_state["input_output_understanding"]
        and current_state["algorithm_idea"]
        and fallback["plan_analysis"]["has_submitted_plan"]
    )
    return {
        **fallback,
        "current_state": current_state,
        "semantic_evidence": parsed.get("evidence", {}),
    }

def score_understanding(requirements: dict, plan_analysis: dict):
    score = 3
    score += int(plan_analysis["has_approach"])
    score += int(plan_analysis["has_input"])
    score += int(plan_analysis["has_logic"]) * 2
    score += int(plan_analysis["has_output"]) * 2
    if requirements["goal"] != "produce the required output" and plan_analysis["has_logic"]:
        score += 1
    return max(0, min(10, score))

def _agent1_tool_score_understanding(requirements: dict, plan_analysis: dict):
    score = score_understanding(requirements, plan_analysis)
    return {
        "understanding_score": score,
        "can_enter_coding": score >= 7,
    }

def create_agent1_trace(requirements: dict, plan_analysis: dict, score: int):
    return [
        {
            "thought": "Understand the programming problem before judging the student's plan.",
            "action": "parse_problem_requirements",
            "observation": f"goal={requirements['goal']}; concepts={', '.join(requirements['core_concepts'])}",
        },
        {
            "thought": "Check whether the student's plan covers input/setup, core logic, and output/result.",
            "action": "analyze_plan_steps",
            "observation": (
                f"missing_steps={', '.join(plan_analysis['missing_steps']) if plan_analysis['missing_steps'] else 'none'}"
            ),
        },
        {
            "thought": "Convert the observations into an understanding score and coding decision.",
            "action": "score_understanding",
            "observation": f"understanding_score={score}",
        },
    ]

AGENT1_TOOLS = {
    "parse_problem_requirements": lambda args: parse_problem_requirements(args.get("problem", "")),
    "analyze_student_state": lambda args: analyze_student_state(
        args.get("problem", ""),
        args.get("approach", ""),
        args.get("steps", ""),
        args.get("student_answer", ""),
    ),
    "evaluate_learning_state_semantically": lambda args: evaluate_learning_state_semantically(
        args.get("problem", ""),
        args.get("approach", ""),
        args.get("steps", ""),
        args.get("student_answer", ""),
    ),
}

def _parse_react_action(text: str):
    action_match = re.search(r"^Action:\s*(.+)$", text, re.MULTILINE)
    input_match = re.search(r"^Action Input:\s*(\{.*\})\s*$", text, re.MULTILINE | re.DOTALL)
    if not action_match or not input_match:
        return None
    action = action_match.group(1).strip()
    try:
        action_input = json.loads(input_match.group(1).strip())
    except json.JSONDecodeError:
        return None
    return action, action_input

def _parse_agent1_final(text: str):
    if "Final Answer:" not in text:
        return None
    final_text = text.split("Final Answer:", 1)[1]
    json_match = re.search(r"\{.*\}", final_text, re.DOTALL)
    if not json_match:
        return None
    try:
        parsed = json.loads(json_match.group(0))
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None

def _choose_agent1_action(state_info: dict):
    state = state_info["current_state"]
    if state["plan_complete"]:
        return "ALLOW_CODING", "Your plan shows enough understanding to start coding."
    if not state["problem_understanding"]:
        return "ASK_PROBLEM_GOAL", "What do you think this problem is asking your program to achieve?"
    if not state["input_output_understanding"]:
        return "ASK_INPUT_OUTPUT", "What information does your program need, and what should it produce?"
    if not state["algorithm_idea"]:
        return "ASK_ALGORITHM", "What process could help you solve this problem step by step?"
    return "REQUEST_PLAN", "Please describe your approach and possible steps before coding."

def _agent1_json_to_legacy(result: dict, state_info: dict | None = None):
    state = (
        dict(state_info.get("current_state", {}))
        if state_info
        else dict(result.get("current_state", {}))
    )
    plan_complete = bool(state.get("plan_complete", False))
    missing_steps = []
    if state_info:
        missing_steps = state_info.get("plan_analysis", {}).get("missing_steps", [])
    score = 0
    score += 2 if state.get("problem_understanding") else 0
    score += 2 if state.get("input_output_understanding") else 0
    score += 2 if state.get("algorithm_idea") else 0
    score += 4 if plan_complete else 0
    action, message = _choose_agent1_action({"current_state": state})

    return {
        **result,
        "understanding_score": score,
        "missing_steps": missing_steps,
        "current_state": state,
        "action": action,
        "message": message,
        "can_enter_coding": plan_complete or action == "ALLOW_CODING",
        "guide_question": message,
    }

def _state_info_from_react_trace(trace: list[dict]):
    for step in reversed(trace):
        if step.get("action") != "evaluate_learning_state_semantically":
            continue
        try:
            observation = json.loads(step.get("observation", "{}"))
        except json.JSONDecodeError:
            continue
        if isinstance(observation, dict) and "current_state" in observation:
            return observation
    return None

def _run_agent1_react_loop(problem: str, approach: str, steps: str, student_answer: str = "", max_turns: int = 4):
    scratchpad = ""
    trace = []
    prompt_input = (
        f"Problem: {problem}\n"
        f"Approach: {approach}\n"
        f"Steps: {steps}\n"
        f"Student follow-up answer: {student_answer}\n"
    )

    for _ in range(max_turns):
        response_text = base_llm_call(
            AGENT1_REACT_SYSTEM,
            f"{prompt_input}\nPrevious ReAct steps:\n{scratchpad}".strip(),
        )
        final = _parse_agent1_final(response_text)
        if final:
            state_info = _state_info_from_react_trace(trace) or evaluate_learning_state_semantically(
                problem,
                approach,
                steps,
                student_answer,
            )
            final["react_trace"] = trace
            return _agent1_json_to_legacy(final, state_info)

        parsed = _parse_react_action(response_text)
        if not parsed:
            break
        action, action_input = parsed
        if action not in AGENT1_TOOLS:
            break

        observation = AGENT1_TOOLS[action](action_input)
        thought_match = re.search(r"^Thought:\s*(.+)$", response_text, re.MULTILINE)
        thought = thought_match.group(1).strip() if thought_match else "Choose and execute the next tool."
        trace.append({
            "thought": thought,
            "action": action,
            "observation": json.dumps(observation, ensure_ascii=False),
        })
        scratchpad = (
            f"{scratchpad}\n"
            f"Thought: {thought}\n"
            f"Action: {action}\n"
            f"Action Input: {json.dumps(action_input, ensure_ascii=False)}\n"
            f"Observation: {json.dumps(observation, ensure_ascii=False)}\n"
        ).strip()

    return None

def _infer_agent1_fallback(problem: str, approach: str, steps: str, student_answer: str = ""):
    requirements = parse_problem_requirements(problem)
    plan_analysis = analyze_plan_steps(approach, steps, student_answer)
    state_info = evaluate_learning_state_semantically(problem, approach, steps, student_answer)
    score = score_understanding(requirements, plan_analysis)
    missing_steps = plan_analysis["missing_steps"]
    action, message = _choose_agent1_action(state_info)
    agent_json = {
        "reasoning_summary": "Updated the student's planning-stage learning state and selected the next pedagogical action.",
        "current_state": state_info["current_state"],
        "action": action,
        "message": message,
    }
    return {
        **agent_json,
        "understanding_score": score,
        "missing_steps": missing_steps,
        "can_enter_coding": action == "ALLOW_CODING",
        "react_trace": create_agent1_trace(requirements, plan_analysis, score),
        "guide_question": message,
    }

def run_agent1(problem: str, approach: str, steps: str, student_answer: str = ""):
    react_result = _run_agent1_react_loop(problem, approach, steps, student_answer)
    if react_result:
        fallback = _infer_agent1_fallback(problem, approach, steps, student_answer)
        result = {**fallback, **react_result}
        result["can_enter_coding"] = result.get("action") == "ALLOW_CODING" or result.get("can_enter_coding", False)
        if result["can_enter_coding"]:
            result["guide_question"] = result.get("message", "Your plan shows enough understanding to start coding.")
        return result

    return _infer_agent1_fallback(problem, approach, steps, student_answer)

def run_agent1_personalized(
    problem: str,
    approach: str,
    steps: str,
    accumulated_answers: str,
    latest_answer: str,
    previous_learner_state: dict | None = None,
):
    previous_learner_state = previous_learner_state or {}
    fallback = analyze_student_state(problem, approach, steps, accumulated_answers)
    prompt = """
You are Agent 1, the Problem Understanding Agent. Diagnose the student's explicit
evidence during Planning. Do not teach, ask a question, or provide a solution.

Return only valid JSON:
{
  "concepts": {
    "problem_goal": {"status":"missing|partial|understood","confidence":0.0,"evidence":"..."},
    "input": {"status":"missing|partial|understood","confidence":0.0,"evidence":"..."},
    "output": {"status":"missing|partial|understood","confidence":0.0,"evidence":"..."},
    "algorithm": {"status":"missing|partial|understood","confidence":0.0,"evidence":"..."}
  },
  "latestAnswer": {
    "quality":"correct|partial|off_target|uncertain",
    "focusResolved": true,
    "resolvedConcepts":["problem_goal|input|output|algorithm"],
    "recognizedIdeas":["..."],
    "missingIdeas":["..."],
    "misconception":"... or empty"
  }
}

Rules:
- Judge only what the student explicitly wrote in answers or the Plan form.
- Evaluate the latest answer against the current question/focus represented by the
  previous learner state.
- Set focusResolved=true when the latest answer semantically answers the current
  focus, regardless of its length or exact wording.
- resolvedConcepts must include every concept explicitly demonstrated by the latest
  answer. One answer may resolve several concepts at once.
- Use partial when an answer contains a useful idea but does not resolve the focus.
- Use off_target when it answers a different concept.
- Evidence must quote or closely paraphrase student evidence, not the problem text.
- Do not infer mastery merely because the problem statement contains the idea.
- Do not output chain-of-thought.
"""
    user_input = (
        f"Problem: {problem}\n"
        f"Plan approach: {approach or '(empty)'}\n"
        f"Plan steps: {steps or '(empty)'}\n"
        f"All student answers:\n{accumulated_answers or '(none)'}\n"
        f"Latest answer: {latest_answer or '(none)'}\n"
        f"Previous learner state: {json.dumps(previous_learner_state, ensure_ascii=False)}"
    )
    response_text = base_llm_call(prompt, user_input)
    match = re.search(r"\{.*\}", response_text, re.DOTALL)
    parsed = {}
    if match:
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            parsed = {}

    fallback_state = fallback["current_state"]
    fallback_concepts = {
        "problem_goal": fallback_state["problem_understanding"],
        "input": fallback["plan_analysis"]["has_input"],
        "output": fallback["plan_analysis"]["has_output"],
        "algorithm": fallback_state["algorithm_idea"],
    }
    previous_concepts = previous_learner_state.get("concepts", {})
    latest_diagnosis = parsed.get("latestAnswer", {})
    resolved_concepts = {
        str(item)
        for item in latest_diagnosis.get("resolvedConcepts", [])
        if str(item) in {"problem_goal", "input", "output", "algorithm"}
    }
    previous_focus = previous_learner_state.get("currentFocus", "")
    if latest_diagnosis.get("focusResolved") is True and previous_focus in {
        "problem_goal", "input", "output", "algorithm"
    }:
        resolved_concepts.add(previous_focus)
    status_rank = {"missing": 0, "partial": 1, "understood": 2}
    concepts = {}
    for key, fallback_understood in fallback_concepts.items():
        candidate = parsed.get("concepts", {}).get(key, {})
        status = candidate.get("status")
        if status not in status_rank:
            status = "understood" if fallback_understood else "missing"
        # Explicit evidence found in the submitted plan is a deterministic floor.
        # The LLM may add nuance, but it must not repeatedly downgrade a concrete
        # goal, input description, or algorithm step that is visibly present.
        if fallback_understood:
            status = "understood"
        previous_status = previous_concepts.get(key, {}).get("status", "missing")
        if (
            status == "understood"
            and not fallback_understood
            and previous_status != "understood"
            and key not in resolved_concepts
        ):
            status = "partial"
        if previous_status in status_rank and status_rank[previous_status] > status_rank[status]:
            status = previous_status
        try:
            confidence = max(0.0, min(1.0, float(candidate.get("confidence", 0.7 if status != "missing" else 0.5))))
        except (TypeError, ValueError):
            confidence = 0.5
        concepts[key] = {
            "status": status,
            "confidence": confidence,
            "evidence": str(candidate.get("evidence") or previous_concepts.get(key, {}).get("evidence") or "No explicit evidence yet")[:240],
        }

    latest = latest_diagnosis
    quality = latest.get("quality")
    if quality not in {"correct", "partial", "off_target", "uncertain"}:
        quality = "uncertain" if not latest_answer.strip() else "partial"

    focus_order = ["problem_goal", "input", "output", "algorithm"]
    short_answer = latest_answer.strip().lower()
    short_answer_terms = {
        "problem_goal": ("maximum", "largest", "minimum", "smallest", "sum", "total", "average", "find"),
        "input": ("number", "numbers", "list", "array", "values", "data", "integer", "integers", "string"),
        "output": ("maximum", "largest", "minimum", "smallest", "sum", "total", "average", "result", "answer"),
        "algorithm": ("loop", "compare", "iterate", "track", "update", "check"),
    }
    semantically_supported_focus_answer = (
        previous_focus in short_answer_terms
        and bool(short_answer)
        and quality in {"correct", "partial"}
        and any(term in short_answer for term in short_answer_terms[previous_focus])
    )
    evidence_supported_answer = (
        previous_focus in concepts
        and fallback_concepts.get(previous_focus, False)
        and quality == "correct"
    )
    if previous_focus in concepts and (
        previous_focus in resolved_concepts
        or semantically_supported_focus_answer
        or evidence_supported_answer
    ):
        concepts[previous_focus] = {
            "status": "understood",
            "confidence": max(0.85, concepts[previous_focus]["confidence"]),
            "evidence": latest_answer.strip(),
        }
        quality = "correct"

    # A single natural-language response can demonstrate more than the current
    # focus. Preserve those explicit semantic findings so the tutor does not ask
    # the student to repeat knowledge they already expressed.
    for resolved_key in resolved_concepts:
        concepts[resolved_key] = {
            "status": "understood",
            "confidence": max(0.85, concepts[resolved_key]["confidence"]),
            "evidence": latest_answer.strip() or concepts[resolved_key]["evidence"],
        }

    current_focus = next(
        (key for key in focus_order if concepts[key]["status"] != "understood"),
        "plan_submission",
    )
    plan_analysis = analyze_plan_steps(approach, steps, accumulated_answers)
    has_submitted_plan = plan_analysis["has_submitted_plan"]
    concept_score = sum(
        {"missing": 0, "partial": 1, "understood": 2}[concepts[key]["status"]]
        for key in focus_order
    )
    # A concrete submitted plan is evidence that the learner can organize their
    # reasoning. Once the combined score reaches 7, leave smaller omissions for
    # coding/debugging instead of prolonging the Planning conversation.
    score = min(10, concept_score + (2 if has_submitted_plan else 0))
    can_enter_coding = has_submitted_plan and score >= 7
    if can_enter_coding:
        current_focus = "plan_complete"

    if previous_focus in concepts and concepts[previous_focus]["status"] == "understood":
        quality = "correct"
    previous_attempts = int(previous_learner_state.get("attemptsOnFocus", 0) or 0)
    attempts = previous_attempts + 1 if current_focus == previous_focus and latest_answer.strip() else 0
    previous_off_target = int(previous_learner_state.get("consecutiveOffTarget", 0) or 0)
    consecutive_off_target = previous_off_target + 1 if quality == "off_target" else 0

    action_by_focus = {
        "problem_goal": "ASK_PROBLEM_GOAL",
        "input": "ASK_INPUT_OUTPUT",
        "output": "ASK_INPUT_OUTPUT",
        "algorithm": "ASK_ALGORITHM",
        "plan_submission": "REQUEST_PLAN",
        "plan_complete": "ALLOW_CODING",
    }
    learner_state = {
        "currentFocus": current_focus,
        "hintLevel": int(previous_learner_state.get("hintLevel", 0) or 0),
        "attemptsOnFocus": attempts,
        "consecutiveOffTarget": consecutive_off_target,
        "studentState": "understanding" if current_focus in {"plan_submission", "plan_complete"} else "beginner",
        "concepts": concepts,
        "latestAnswer": {
            "quality": quality,
            "focusResolved": previous_focus in resolved_concepts or (
                previous_focus in concepts
                and concepts[previous_focus]["status"] == "understood"
            ),
            "resolvedConcepts": sorted(resolved_concepts),
            "recognizedIdeas": (
                [str(item)[:160] for item in latest.get("recognizedIdeas", [])[:4]]
                or ([latest_answer.strip()[:160]] if quality == "correct" and latest_answer.strip() else [])
            ),
            "missingIdeas": [str(item)[:160] for item in latest.get("missingIdeas", [])[:4]],
            "misconception": str(latest.get("misconception") or "")[:240],
        },
    }
    current_state = {
        "problem_understanding": concepts["problem_goal"]["status"] == "understood",
        "input_output_understanding": concepts["input"]["status"] == "understood" and concepts["output"]["status"] == "understood",
        "algorithm_idea": concepts["algorithm"]["status"] == "understood",
        "plan_complete": can_enter_coding,
    }
    return {
        "reasoning_summary": (
            "The submitted plan reached the readiness threshold; smaller omissions can be addressed during coding."
            if can_enter_coding
            else "Updated evidence-based Planning state and selected the next learning focus."
        ),
        "current_state": current_state,
        "learner_state": learner_state,
        "action": action_by_focus[current_focus],
        "message": (
            "Your plan shows enough understanding to start coding."
            if can_enter_coding
            else ""
        ),
        "understanding_score": score,
        "missing_steps": plan_analysis["missing_steps"],
        "can_enter_coding": can_enter_coding,
    }

def run_agent2(problem: str, code: str, error_type: str, confusion_level: int, is_stuck: bool, hint_level: int, chat_history: str):
    user_input = f"Problem: {problem}\nCode: {code}\nError Type: {error_type}\nConfusion Level: {confusion_level}\nIs Stuck: {is_stuck}\nHint Level: {hint_level}\nChat History: {chat_history}"
    response_text = base_llm_call(AGENT2_PROMPT, user_input)
    return {"question": response_text.split("question:")[-1].strip()}

def run_agent3(problem: str, code: str, predict_output: str):
    user_input = f"Problem: {problem}\nCode: {code}\nPredicted Output: {predict_output}"
    response_text = base_llm_call(AGENT3_PROMPT, user_input)
    return {"error_type": response_text.split("error_type:")[-1].strip()}

def run_agent3_diagnosis(problem: str, code: str, execution_result: str):
    prompt = """
You are Agent 3, the Code Analysis Agent. Analyze the student's code and execution
result for other agents. Do not address the student and do not fix the code.

Return only valid JSON:
{
  "issue_type": "syntax_error|logical_error|conceptual_error|algorithm_error|no_error",
  "misconception": "brief neutral description",
  "evidence": "brief internal diagnostic signal without corrected code"
}

Classify invalid syntax as syntax_error, a wrong runtime assumption or condition as
logical_error, misunderstanding of a language/programming concept as conceptual_error,
and an unsuitable overall procedure as algorithm_error. Do not output chain-of-thought.
"""
    response_text = base_llm_call(
        prompt,
        f"Problem: {problem}\nCode:\n{code}\nExecution result:\n{execution_result}",
    )
    match = re.search(r"\{.*\}", response_text, re.DOTALL)
    parsed = {}
    if match:
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            parsed = {}

    valid_types = {
        "syntax_error", "logical_error", "conceptual_error", "algorithm_error", "no_error"
    }
    issue_type = parsed.get("issue_type")
    execution_lower = execution_result.lower()
    if "syntaxerror" in execution_lower or "indentationerror" in execution_lower:
        issue_type = "syntax_error"
    elif any(token in execution_lower for token in ("nameerror", "typeerror", "attributeerror")):
        issue_type = "conceptual_error"
    elif issue_type not in valid_types:
        issue_type = (
            "logical_error"
            if any(token in execution_lower for token in ("failed", "wrong", "error"))
            else "no_error"
        )

    return {
        "issue_type": issue_type,
        "misconception": str(parsed.get("misconception") or "unclear reasoning about the current code behavior")[:180],
        "evidence": str(parsed.get("evidence") or "execution result and code behavior do not align")[:180],
    }

def run_agent4(chat_history: str, error_records: list, idle_over_1min: bool):
    user_input = f"Chat History: {chat_history}\nError Records: {', '.join(error_records)}\nIdle Over 1min: {idle_over_1min}"
    response_text = base_llm_call(AGENT4_PROMPT, user_input)
    result = {}
    for line in response_text.splitlines():
        if line.startswith("confusion_level:"):
            result["confusion_level"] = int(_field_value(line))
        if line.startswith("is_stuck:"):
            result["is_stuck"] = _field_value(line).lower() == "true"
    return result

def run_agent4_monitor(
    chat_history: str,
    issue_type: str,
    current_hint_level: int,
    latest_run_status: str = "",
    attempts_on_focus: int = 0,
    consecutive_off_target: int = 0,
    latest_answer_quality: str = "uncertain",
    latest_student_answer: str = "",
):
    prompt = """
You are Agent 4, the Metacognitive Monitoring Agent. Assess learner struggle from
conversation memory and the latest diagnostic signal. Do not speak to the student.

Return only valid JSON:
{
  "student_state": "beginner|confused|understanding",
  "is_stuck": true,
  "confusion_level": 0
}

Set is_stuck true only when there is evidence such as repeated failed reasoning,
repeated similar errors, repeated requests for an answer, or explicit inability to
continue. One new error alone is not enough. confusion_level must be 0-3. Do not
output chain-of-thought.
"""
    response_text = base_llm_call(
        prompt,
        (
            f"Conversation:\n{chat_history}\n"
            f"Latest issue type: {issue_type}\n"
            f"Latest run status: {latest_run_status}\n"
            f"Current hint level: {current_hint_level}"
            f"\nAttempts on current focus: {attempts_on_focus}"
            f"\nConsecutive off-target answers: {consecutive_off_target}"
            f"\nLatest answer quality: {latest_answer_quality}"
            f"\nLatest student answer: {latest_student_answer}"
        ),
    )
    match = re.search(r"\{.*\}", response_text, re.DOTALL)
    parsed = {}
    if match:
        try:
            parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
            parsed = {}

    student_state = parsed.get("student_state")
    if student_state not in {"beginner", "confused", "understanding"}:
        lower_history = chat_history.lower()
        student_state = (
            "confused"
            if any(token in lower_history for token in ("don't know", "stuck", "help me", "不知道"))
            else "beginner"
        )
    lower_latest_answer = latest_student_answer.lower()
    explicit_stuck = any(
        token in lower_latest_answer
        for token in ("don't know", "do not know", "i'm stuck", "i am stuck", "不知道", "不会")
    )
    is_stuck = (
        bool(parsed.get("is_stuck", False))
        or explicit_stuck
        or attempts_on_focus >= 2
        or consecutive_off_target >= 2
    )
    try:
        confusion_level = max(0, min(3, int(parsed.get("confusion_level", 0))))
    except (TypeError, ValueError):
        confusion_level = 0
    current_hint_level = max(0, min(3, int(current_hint_level)))
    hint_level = min(3, current_hint_level + 1) if is_stuck else current_hint_level
    return {
        "student_state": student_state,
        "is_stuck": is_stuck,
        "confusion_level": confusion_level,
        "hint_level": hint_level,
    }

def run_agent5(problem: str, code: str, error_records: list, chat_history: str, reflection_text: str):
    user_input = f"Problem: {problem}\nCode: {code}\nError Records: {', '.join(error_records)}\nChat History: {chat_history}\nReflection: {reflection_text}"
    response_text = base_llm_call(AGENT5_PROMPT, user_input)
    return {"summary": response_text.split("summary:")[-1].strip()}

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
- plan_complete is true only when the student understands the goal, input/output, and a general algorithm idea.
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
        key: bool(parsed.get("current_state", {}).get(key, fallback["current_state"][key]))
        for key in fallback["current_state"]
    }
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
    state = result.get("current_state", {}) if isinstance(result, dict) else {}
    plan_complete = bool(state.get("plan_complete", False))
    missing_steps = []
    if state_info:
        missing_steps = state_info.get("plan_analysis", {}).get("missing_steps", [])
    score = 0
    score += 2 if state.get("problem_understanding") else 0
    score += 2 if state.get("input_output_understanding") else 0
    score += 2 if state.get("algorithm_idea") else 0
    score += 4 if plan_complete else 0
    action = result.get("action")
    message = result.get("message", "What is your next thought about the plan?")
    if action == "ASK_EDGE_CASE":
        if (
            state.get("problem_understanding")
            and state.get("input_output_understanding")
            and state.get("algorithm_idea")
        ):
            action = "ALLOW_CODING"
            message = "Your plan shows enough understanding to start coding."
            plan_complete = True
            state["plan_complete"] = True
        else:
            action = "REQUEST_PLAN"
            message = "Please describe your approach and possible steps before coding."

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

def run_agent2(problem: str, code: str, error_type: str, confusion_level: int, is_stuck: bool, hint_level: int, chat_history: str):
    user_input = f"Problem: {problem}\nCode: {code}\nError Type: {error_type}\nConfusion Level: {confusion_level}\nIs Stuck: {is_stuck}\nHint Level: {hint_level}\nChat History: {chat_history}"
    response_text = base_llm_call(AGENT2_PROMPT, user_input)
    return {"question": response_text.split("question:")[-1].strip()}

def run_agent3(problem: str, code: str, predict_output: str):
    user_input = f"Problem: {problem}\nCode: {code}\nPredicted Output: {predict_output}"
    response_text = base_llm_call(AGENT3_PROMPT, user_input)
    return {"error_type": response_text.split("error_type:")[-1].strip()}

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

def run_agent5(problem: str, code: str, error_records: list, chat_history: str, reflection_text: str):
    user_input = f"Problem: {problem}\nCode: {code}\nError Records: {', '.join(error_records)}\nChat History: {chat_history}\nReflection: {reflection_text}"
    response_text = base_llm_call(AGENT5_PROMPT, user_input)
    return {"summary": response_text.split("summary:")[-1].strip()}

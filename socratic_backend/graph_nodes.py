from graph_state import TutorState
from agent_services import run_agent1, run_agent2, run_agent3, run_agent4, run_agent5


def _append_trace(state: TutorState, agent: str, label: str, summary: str):
    state.setdefault("agent_trace", []).append({
        "agent": agent,
        "label": label,
        "summary": summary,
    })


def plan_agent(state: TutorState) -> TutorState:
    plan_form = state.get("plan_form", {})
    steps = plan_form.get("steps", [])
    result = run_agent1(
        problem=state.get("problem_content", ""),
        approach=plan_form.get("approach", "") or "",
        steps="\n".join(steps) if isinstance(steps, list) else str(steps or ""),
        student_answer=state.get("student_answer", "") or "",
    )

    can_enter_coding = bool(result.get("can_enter_coding", False))
    message = (
        result.get("message")
        or result.get("guide_question")
        or "What is your next thought about the plan?"
    )

    state["understanding_score"] = result.get("understanding_score", 0)
    state["missing_steps"] = result.get("missing_steps", [])
    state["can_enter_coding"] = can_enter_coding
    state["current_state"] = result.get("current_state", {})
    state["selected_action"] = result.get("action")
    state["reasoning_summary"] = result.get("reasoning_summary")
    state["tutor_message"] = message
    state["question_type"] = "understanding"

    _append_trace(
        state,
        "Agent 1",
        "Problem understanding",
        f"action={result.get('action', 'unknown')}, plan_complete={result.get('current_state', {}).get('plan_complete', False)}",
    )
    for step in result.get("react_trace", []):
        _append_trace(
            state,
            "Agent 1",
            step.get("action", "ReAct step"),
            step.get("observation", ""),
        )

    return state


def code_analysis_agent(state: TutorState) -> TutorState:
    if not state.get("student_code", "").strip():
        state["code_error_type"] = "No Error"
        return state

    result = run_agent3(
        problem=state.get("problem_content", ""),
        code=state.get("student_code", ""),
        predict_output=state.get("code_prediction", "") or "",
    )
    state["code_error_type"] = result.get("error_type", "No Error")
    _append_trace(
        state,
        "Agent 3",
        "Code analysis",
        f"error_type={state['code_error_type']}",
    )
    return state


def monitor_agent(state: TutorState) -> TutorState:
    error_type = state.get("code_error_type", "No Error")
    error_records = [error_type] if error_type != "No Error" else []
    chat_history = "\n".join(
        f"{message.get('role', 'unknown')}: {message.get('content', '')}"
        for message in state.get("messages", [])
    ) or "(no messages yet)"
    result = run_agent4(chat_history, error_records, idle_over_1min=False)
    state["confusion_level"] = result.get("confusion_level", 0)
    state["is_stuck"] = result.get("is_stuck", False)
    if state["is_stuck"] and state.get("hint_level", 0) < 3:
        state["hint_level"] = state.get("hint_level", 0) + 1
    _append_trace(
        state,
        "Agent 4",
        "Learning monitor",
        f"confusion_level={state['confusion_level']}, is_stuck={state['is_stuck']}",
    )
    return state


def socratic_agent(state: TutorState) -> TutorState:
    chat_history = "\n".join(
        f"{message.get('role', 'unknown')}: {message.get('content', '')}"
        for message in state.get("messages", [])
    ) or "(no messages yet)"
    result = run_agent2(
        problem=state.get("problem_content", ""),
        code=state.get("student_code", ""),
        error_type=state.get("code_error_type", "No Error"),
        confusion_level=state.get("confusion_level", 0),
        is_stuck=state.get("is_stuck", False),
        hint_level=state.get("hint_level", 0),
        chat_history=chat_history,
    )
    state["tutor_message"] = result.get("question", "")
    state["question_type"] = (
        "debugging"
        if state.get("code_error_type", "No Error") != "No Error"
        else "understanding"
    )
    _append_trace(
        state,
        "Agent 2",
        "Socratic dialogue",
        f"hint_level={state.get('hint_level', 0)}",
    )
    return state


def assessment_agent(state: TutorState) -> TutorState:
    chat_history = "\n".join(
        f"{message.get('role', 'unknown')}: {message.get('content', '')}"
        for message in state.get("messages", [])
    ) or "(no messages yet)"
    result = run_agent5(
        problem=state.get("problem_content", ""),
        code=state.get("student_code", ""),
        error_records=[],
        chat_history=chat_history,
        reflection_text=state.get("student_reflection", ""),
    )
    state["learning_summary"] = result.get("summary", "")
    state["tutor_message"] = state["learning_summary"]
    state["question_type"] = "reflection"
    _append_trace(
        state,
        "Agent 5",
        "Reflection assessment",
        "Generated learning summary.",
    )
    return state

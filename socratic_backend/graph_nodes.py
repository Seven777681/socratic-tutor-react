from graph_state import TutorState
from agent_services import (
    run_agent1_personalized,
    run_agent3_diagnosis,
    run_agent4_monitor,
    run_agent5,
)
from agent2_graph import agent2_graph


def _append_trace(state: TutorState, agent: str, label: str, summary: str):
    state.setdefault("agent_trace", []).append({
        "agent": agent,
        "label": label,
        "summary": summary,
    })


def plan_agent(state: TutorState) -> TutorState:
    plan_form = state.get("plan_form", {})
    steps = plan_form.get("steps", [])
    previous_answers = [
        message.get("content", "")
        for message in state.get("messages", [])
        if message.get("role") == "student"
    ]
    latest_answer = state.get("student_answer", "") or ""
    if latest_answer.strip() and (
        not previous_answers or previous_answers[-1].strip() != latest_answer.strip()
    ):
        previous_answers.append(latest_answer)
    accumulated_answers = "\n".join(answer for answer in previous_answers if answer.strip())

    result = run_agent1_personalized(
        problem=state.get("problem_content", ""),
        approach=plan_form.get("approach", "") or "",
        steps="\n".join(steps) if isinstance(steps, list) else str(steps or ""),
        accumulated_answers=accumulated_answers,
        latest_answer=latest_answer,
        previous_learner_state=state.get("learner_state", {}),
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
    state["learner_state"] = result.get("learner_state", {})
    state["issue_type"] = result.get("action", "plan_understanding")
    latest_diagnosis = state["learner_state"].get("latestAnswer", {})
    state["misconception"] = (
        latest_diagnosis.get("misconception")
        or "; ".join(latest_diagnosis.get("missingIdeas", []))
        or f"Needs support with {state['learner_state'].get('currentFocus', 'planning')}"
    )
    state["student_state"] = state["learner_state"].get("studentState", "beginner")
    state["tutor_message"] = message
    state["question_type"] = "understanding"

    _append_trace(
        state,
        "Agent 1",
        "Problem understanding",
        f"action={result.get('action', 'unknown')}, plan_complete={result.get('current_state', {}).get('plan_complete', False)}",
    )
    return state


def code_analysis_agent(state: TutorState) -> TutorState:
    if not state.get("student_code", "").strip():
        state["code_error_type"] = "no_error"
        state["issue_type"] = "no_error"
        return state

    result = run_agent3_diagnosis(
        problem=state.get("problem_content", ""),
        code=state.get("student_code", ""),
        execution_result=state.get("execution_result", ""),
    )
    state["code_error_type"] = result.get("issue_type", "logical_error")
    state["issue_type"] = state["code_error_type"]
    state["misconception"] = result.get("misconception", "")
    _append_trace(
        state,
        "Agent 3",
        "Code analysis",
        f"issue_type={state['code_error_type']}",
    )
    return state


def monitor_agent(state: TutorState) -> TutorState:
    chat_history = "\n".join(
        f"{message.get('role', 'unknown')}: {message.get('content', '')}"
        for message in state.get("messages", [])
    ) or "(no messages yet)"
    learner_state = state.get("learner_state", {})
    latest_answer = learner_state.get("latestAnswer", {})
    result = run_agent4_monitor(
        chat_history=chat_history,
        issue_type=state.get("issue_type", "no_error"),
        current_hint_level=state.get("hint_level", 0),
        latest_run_status=state.get("latest_run_status", "") or "",
        attempts_on_focus=int(learner_state.get("attemptsOnFocus", 0) or 0),
        consecutive_off_target=int(learner_state.get("consecutiveOffTarget", 0) or 0),
        latest_answer_quality=latest_answer.get("quality", "uncertain"),
        latest_student_answer=state.get("student_answer", "") or "",
    )
    state["student_state"] = result.get("student_state", "beginner")
    state["confusion_level"] = result.get("confusion_level", 0)
    state["is_stuck"] = result.get("is_stuck", False)
    state["hint_level"] = result.get("hint_level", state.get("hint_level", 0))
    if learner_state:
        learner_state["hintLevel"] = state["hint_level"]
        learner_state["studentState"] = state["student_state"]
        state["learner_state"] = learner_state
    _append_trace(
        state,
        "Agent 4",
        "Learning monitor",
        f"student_state={state['student_state']}, is_stuck={state['is_stuck']}, hint_level={state['hint_level']}",
    )
    return state


def socratic_agent(state: TutorState) -> TutorState:
    learner_state = dict(state.get("learner_state", {}))
    if state.get("stage") == "debug":
        diagnostic_focus = state.get("issue_type", "logical_error")
        previous_focus = learner_state.get("currentFocus")
        learner_state["currentFocus"] = diagnostic_focus
        learner_state["attemptsOnFocus"] = (
            int(learner_state.get("attemptsOnFocus", 0) or 0) + 1
            if previous_focus == diagnostic_focus
            else 0
        )
        learner_state["latestAnswer"] = {
            "quality": "uncertain",
            "recognizedIdeas": [],
            "missingIdeas": [state.get("misconception", "")],
            "misconception": state.get("misconception", ""),
        }
        state["learner_state"] = learner_state
    elif (
        state.get("stage") in {"code", "coding"}
        and learner_state.get("currentFocus") in {"plan_submission", "plan_complete"}
    ):
        learner_state["currentFocus"] = "coding_progress"
        learner_state["attemptsOnFocus"] = 0
        state["learner_state"] = learner_state

    result = agent2_graph.invoke({
        "problem": state.get("problem_content", ""),
        "student_code": state.get("student_code", ""),
        "conversation_history": state.get("messages", []),
        "stage": state.get("stage", "coding"),
        "issue_type": state.get("issue_type", "no_error"),
        "misconception": state.get("misconception", ""),
        "student_state": state.get("student_state", "beginner"),
        "hint_level": state.get("hint_level", 0),
        "learner_state": learner_state,
    })
    state["pedagogical_action"] = result.get("action", "ASK_METACOGNITIVE")
    state["final_question"] = result.get("final_question", "")
    state["question_validation"] = result.get("validation", {})
    state["tutor_message"] = state["final_question"]
    state["question_type"] = "debugging" if state.get("stage") == "debug" else "understanding"
    _append_trace(
        state,
        "Agent 2",
        "Socratic dialogue",
        f"stage={state['stage']}, action={state['pedagogical_action']}, hint_level={state['hint_level']}, validated={state['question_validation'].get('valid', False)}",
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

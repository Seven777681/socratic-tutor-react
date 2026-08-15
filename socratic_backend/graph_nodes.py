from graph_state import TutorState
from agent_services import (
    evaluate_tutor_answer,
    run_agent1_personalized,
    run_agent3_diagnosis,
    run_agent4_monitor,
    run_agent5,
)
from agent2_graph import agent2_graph
from user_study_config import get_intervention


def _normalize_question(text: str) -> str:
    return " ".join((text or "").strip().lower().split())


def _was_question_already_asked(question: str, messages: list[dict]) -> bool:
    normalized = _normalize_question(question)
    if not normalized:
        return False
    return any(
        message.get("role") == "tutor"
        and _normalize_question(str(message.get("content", ""))) == normalized
        for message in messages
    )


def _is_python_implementation_request(answer: str) -> bool:
    text = (answer or "").lower()
    implementation_terms = ("python", "\u4ee3\u7801", "code")
    setup_terms = (
        "\u600e\u4e48",
        "how",
        "set",
        "\u8bbe",
        "\u8d4b\u503c",
        "first",
        "\u7b2c\u4e00\u4e2a",
    )
    return any(term in text for term in implementation_terms) and any(
        term in text for term in setup_terms
    )


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
        or "关于这份计划，你接下来准备补充什么？"
    )

    state["understanding_score"] = result.get("understanding_score", 0)
    state["missing_steps"] = result.get("missing_steps", [])
    state["can_enter_coding"] = can_enter_coding
    state["current_state"] = result.get("current_state", {})
    state["planning_state"] = result.get("planning_state", {})
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
    diagnostic_prefix = "failed diagnostic tags:"
    for line in state.get("execution_result", "").splitlines():
        if line.lower().startswith(diagnostic_prefix):
            first_tag = line.split(":", 1)[1].split(",", 1)[0].strip()
            if first_tag:
                state["misconception"] = first_tag
            break
    _append_trace(
        state,
        "Agent 3",
        "Code analysis",
        f"issue_type={state['code_error_type']}",
    )
    return state


def answer_evaluation_agent(state: TutorState) -> TutorState:
    latest_answer = state.get("student_answer", "") or ""
    if not latest_answer.strip():
        return state

    learner_state = evaluate_tutor_answer(
        problem=state.get("problem_content", ""),
        code=state.get("student_code", ""),
        stage=state.get("stage", "code"),
        latest_question=state.get("latest_tutor_question", ""),
        latest_answer=latest_answer,
        previous_learner_state=state.get("learner_state", {}),
    )
    state["learner_state"] = learner_state
    diagnosis = learner_state.get("latestAnswer", {})
    state["misconception"] = diagnosis.get("misconception", "")
    _append_trace(
        state,
        "Answer Evaluator",
        "Learner answer evaluation",
        f"quality={diagnosis.get('quality', 'uncertain')}, focus_resolved={diagnosis.get('focusResolved', False)}",
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
    monitored_hint_level = result.get("hint_level", state.get("hint_level", 0))
    state["hint_level"] = (
        min(3, int(state.get("hint_level", 0) or 0) + 1)
        if state.get("action") == "smaller_hint"
        else monitored_hint_level
    )
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
        diagnostic_focus = state.get("issue_type") or learner_state.get("currentFocus") or "logical_error"
        previous_focus = learner_state.get("currentFocus")
        learner_state["currentFocus"] = diagnostic_focus
        learner_state["attemptsOnFocus"] = (
            int(learner_state.get("attemptsOnFocus", 0) or 0) + 1
            if previous_focus == diagnostic_focus
            else 0
        )
        if not state.get("student_answer", "").strip():
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
    elif state.get("stage") == "reflect":
        learner_state["currentFocus"] = "reflection_learning"
        state["learner_state"] = learner_state

    previous_socratic = dict(learner_state.get("socraticState", {}))
    current_misconception = state.get("misconception", "") or state.get("issue_type", "")
    same_issue = previous_socratic.get("current_misconception") == current_misconception
    question_rounds = int(previous_socratic.get("question_rounds_for_current_issue", 0) or 0) if same_issue else 0
    misconception_id, intervention = get_intervention(state.get("task_id", ""), current_misconception)
    intervention_guidance = {}
    if intervention:
        level = max(0, min(3, int(state.get("hint_level", 0) or 0)))
        intervention_guidance = {
            "misconception_id": misconception_id,
            "teaching_goal": intervention.get(
                "coding_goal" if state.get("stage") in {"code", "coding", "debug"} else "planning_goal",
                "",
            ),
            "hint_level": level,
            "instruction": "Infer a suitable hint from the teaching goal, code, error evidence, and student's latest meaning.",
        }

    if _is_python_implementation_request(state.get("student_answer", "")):
        intervention_guidance = {
            **intervention_guidance,
            "student_intent": "The student wants to express initialization from the first list item in Python.",
            "instruction": "Respond to the Python implementation request directly with a small conceptual hint, then ask one focused question.",
        }

    result = agent2_graph.invoke({
        "problem": state.get("problem_content", ""),
        "student_code": state.get("student_code", ""),
        "conversation_history": state.get("messages", []),
        "stage": state.get("stage", "coding"),
        "issue_type": state.get("issue_type", "no_error"),
        "misconception": state.get("misconception", ""),
        "student_state": state.get("student_state", "beginner"),
        "hint_level": state.get("hint_level", 0),
        "requested_action": state.get("action", "message"),
        "intervention_guidance": intervention_guidance,
        "learner_state": learner_state,
        "student_answer": state.get("student_answer", ""),
    })
    state["pedagogical_action"] = result.get("action", "ASK_METACOGNITIVE")
    state["intervention_path"] = result.get("intervention_path", "A")
    state["final_question"] = result.get("final_question", "")
    state["question_validation"] = result.get("validation", {})
    previous_questions = list(previous_socratic.get("previous_questions", []))
    if state["final_question"]:
        previous_questions.append(state["final_question"])
    previous_answers = list(previous_socratic.get("previous_student_answers", []))
    if state.get("student_answer", "").strip():
        previous_answers.append(state["student_answer"])
    state["socratic_state"] = {
        "current_misconception": misconception_id or current_misconception or None,
        "hint_level": state.get("hint_level", 0),
        "previous_questions": previous_questions[-8:],
        "previous_student_answers": previous_answers[-8:],
        "failed_attempts": int(learner_state.get("attemptsOnFocus", 0) or 0),
        "question_rounds_for_current_issue": question_rounds + 1,
        "issue_resolved": bool(learner_state.get("latestAnswer", {}).get("focusResolved", False)),
    }
    learner_state["socraticState"] = state["socratic_state"]
    state["learner_state"] = learner_state
    state["tutor_message"] = state["final_question"]
    state["question_type"] = (
        "debugging"
        if state.get("stage") == "debug"
        else "reflection"
        if state.get("stage") == "reflect"
        else "understanding"
    )
    _append_trace(
        state,
        "Agent 2",
        "Socratic dialogue",
        f"stage={state['stage']}, path={state['intervention_path']}, action={state['pedagogical_action']}, hint_level={state['hint_level']}, validated={state['question_validation'].get('valid', False)}",
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

from typing import Any, Dict, List, Optional, TypedDict


class TutorState(TypedDict, total=False):
    problem_content: str
    action: str
    stage: str
    mode: str

    plan_form: Dict[str, Any]
    student_answer: str
    student_code: str
    execution_result: str
    code_prediction: str
    latest_run_status: Optional[str]
    latest_error_message: Optional[str]
    student_reflection: str
    messages: List[Dict[str, str]]
    learner_state: Dict[str, Any]
    latest_tutor_question: str

    understanding_score: int
    missing_steps: List[str]
    can_enter_coding: bool
    current_state: Dict[str, bool]
    selected_action: Optional[str]
    reasoning_summary: Optional[str]

    code_error_type: str
    confusion_level: int
    is_stuck: bool
    hint_level: int
    student_state: str
    issue_type: str
    misconception: str
    pedagogical_action: str
    final_question: str
    question_validation: Dict[str, Any]

    tutor_message: str
    question_type: str
    learning_summary: str
    agent_trace: List[Dict[str, str]]
    route: str

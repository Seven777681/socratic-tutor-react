from typing import Any, Dict, List, Optional, TypedDict


class TutorState(TypedDict, total=False):
    problem_content: str
    task_id: str
    action: str
    stage: str
    mode: str
    response_language: str

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
    prior_learning_focus: Optional[str]
    task_memory: Dict[str, Any]
    memory_loaded: bool
    short_term_memory: List[Dict[str, Any]]
    short_term_memory_loaded: bool
    short_term_memory_context_count: int
    short_term_memory_used_by: List[str]
    user_profile_summary: str
    profile_memory_loaded: bool
    profile_memory_used_by: List[str]

    understanding_score: int
    missing_steps: List[str]
    can_enter_coding: bool
    current_state: Dict[str, bool]
    planning_state: Dict[str, Any]
    socratic_state: Dict[str, Any]
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
    intervention_path: str
    final_question: str
    question_validation: Dict[str, Any]

    tutor_message: str
    question_type: str
    learning_summary: str
    agent_trace: List[Dict[str, str]]
    route: str

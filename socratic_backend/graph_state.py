from typing import TypedDict, List, Optional
from langchain_core.messages import BaseMessage

class TutorState(TypedDict):
    # 题目基础信息
    problem_content: str
    difficulty: str

    # 学生输入内容
    plan_form: dict
    student_code: str
    code_prediction: str
    student_reflection: str

    # 对话记忆
    messages: List[BaseMessage]

    # Agent输出缓存
    understanding_score: Optional[int]
    confusion_level: int
    code_error_type: Optional[str]
    socratic_question: str
    hint_level: int
    learning_summary: str

    # 流程控制标记
    current_phase: str
    is_stuck: bool
    task_finished: bool
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class TaskMemory:
    account_id: str
    task_id: str
    current_focus: str | None
    active_misconception: str | None
    hint_level: int
    attempts_on_focus: int
    conversation_summary: str | None
    last_student_message: str | None
    last_tutor_message: str | None


@dataclass(frozen=True)
class MemoryEvent:
    account_id: str
    task_id: str | None
    memory_type: str
    event_name: str
    evidence: dict[str, Any]

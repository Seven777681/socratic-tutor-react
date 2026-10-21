import uuid
from datetime import datetime, timezone

from database import database
from .schemas import MemoryEvent, TaskMemory


class MemoryRepository:
    def get_task_memory(self, account_id: str, task_id: str) -> dict | None:
        rows = (
            database.table("task_memories")
            .select("*")
            .eq("account_id", account_id)
            .eq("task_id", task_id)
            .limit(1)
            .execute()
            .data
        )
        return rows[0] if rows else None

    def upsert_task_memory(self, memory: TaskMemory) -> None:
        existing = self.get_task_memory(memory.account_id, memory.task_id)
        now = datetime.now(timezone.utc).isoformat()
        database.table("task_memories").upsert({
            "id": existing["id"] if existing else str(uuid.uuid4()),
            "account_id": memory.account_id,
            "task_id": memory.task_id,
            "current_focus": memory.current_focus,
            "active_misconception": memory.active_misconception,
            "hint_level": memory.hint_level,
            "attempts_on_focus": memory.attempts_on_focus,
            "conversation_summary": memory.conversation_summary,
            "last_student_message": memory.last_student_message,
            "last_tutor_message": memory.last_tutor_message,
            "updated_at": now,
        }).execute()

    def append_event(self, event: MemoryEvent) -> None:
        database.table("memory_events").insert({
            "id": str(uuid.uuid4()),
            "account_id": event.account_id,
            "task_id": event.task_id,
            "memory_type": event.memory_type,
            "event_name": event.event_name,
            "evidence": event.evidence,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

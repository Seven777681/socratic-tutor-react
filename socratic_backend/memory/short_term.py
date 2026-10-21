import uuid
from datetime import datetime, timezone
from typing import Any

from database import database


class MySqlShortTermMemory:
    """A bounded, replaceable conversation store backed by MySQL."""

    def __init__(self, max_messages: int = 12):
        self.max_messages = max_messages

    def sync_recent_messages(
        self,
        *,
        account_id: str,
        task_id: str,
        conversation_id: str,
        messages: list[dict[str, Any]],
        fallback_stage: str | None = None,
    ) -> list[dict]:
        recent = [message for message in messages if message.get("role") in {"student", "tutor"}]
        recent = recent[-self.max_messages :]
        now = datetime.now(timezone.utc).isoformat()
        keep_source_ids: set[str] = set()

        for sequence_number, message in enumerate(recent, start=1):
            source_id = str(message.get("id") or f"position-{sequence_number}-{message['role']}")
            keep_source_ids.add(source_id)
            database.table("conversation_messages").upsert({
                "id": str(uuid.uuid4()),
                "account_id": account_id,
                "task_id": task_id,
                "conversation_id": conversation_id,
                "source_message_id": source_id,
                "role": message["role"],
                "content": str(message.get("content") or ""),
                "stage": message.get("stage") or fallback_stage,
                "sequence_number": sequence_number,
                "created_at": message.get("timestamp") or now,
            }).execute()

        stored = self._get_conversation_rows(account_id, task_id, conversation_id)
        for row in stored:
            if row["source_message_id"] not in keep_source_ids:
                (
                    database.table("conversation_messages")
                    .delete()
                    .eq("id", row["id"])
                    .eq("account_id", account_id)
                    .execute()
                )
        return self.get_recent_messages(
            account_id=account_id,
            task_id=task_id,
            conversation_id=conversation_id,
        )

    def get_recent_messages(
        self,
        *,
        account_id: str,
        task_id: str,
        conversation_id: str,
    ) -> list[dict]:
        return self._get_conversation_rows(account_id, task_id, conversation_id)[-self.max_messages :]

    @staticmethod
    def _get_conversation_rows(account_id: str, task_id: str, conversation_id: str) -> list[dict]:
        return (
            database.table("conversation_messages")
            .select("*")
            .eq("account_id", account_id)
            .eq("task_id", task_id)
            .eq("conversation_id", conversation_id)
            .order("sequence_number")
            .execute()
            .data
        )

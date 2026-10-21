from typing import Any

from .repository import MemoryRepository
from .schemas import MemoryEvent, TaskMemory
from .short_term import MySqlShortTermMemory
from .long_term import MySqlProfileMemory


class MemoryManager:
    """Coordinates task memory and bounded conversation memory."""

    def __init__(
        self,
        repository: MemoryRepository | None = None,
        short_term: MySqlShortTermMemory | None = None,
        profile_memory: MySqlProfileMemory | None = None,
    ):
        self.repository = repository or MemoryRepository()
        self.short_term = short_term or MySqlShortTermMemory(max_messages=12)
        self.profile_memory = profile_memory or MySqlProfileMemory()

    def load_task_memory(self, account_id: str, task_id: str) -> dict | None:
        return self.repository.get_task_memory(account_id, task_id)

    def load_user_profile(self, account_id: str) -> dict | None:
        return self.profile_memory.get_profile(account_id)

    def sync_short_term_conversation(
        self,
        *,
        account_id: str,
        task_id: str,
        conversation_id: str,
        messages: list[dict[str, Any]],
        stage: str | None,
    ) -> list[dict]:
        recent = self.short_term.sync_recent_messages(
            account_id=account_id,
            task_id=task_id,
            conversation_id=conversation_id,
            messages=messages,
            fallback_stage=stage,
        )
        self.repository.append_event(MemoryEvent(
            account_id=account_id,
            task_id=task_id,
            memory_type="short_term_memory",
            event_name="short_term_messages_synced",
            evidence={
                "conversation_id": conversation_id,
                "message_count": len(recent),
                "max_messages": self.short_term.max_messages,
                "shadow_mode": False,
                "usage_mode": "answer_evaluator_only",
            },
        ))
        return recent

    def load_recent_messages(
        self, account_id: str, task_id: str, conversation_id: str
    ) -> list[dict]:
        return self.short_term.get_recent_messages(
            account_id=account_id,
            task_id=task_id,
            conversation_id=conversation_id,
        )

    def record_profile_observation(
        self,
        *,
        account_id: str,
        task_id: str,
        conversation_id: str,
        source_message_id: str,
        state: dict[str, Any],
    ) -> None:
        profile = self.profile_memory.observe(
            account_id=account_id,
            task_id=task_id,
            conversation_id=conversation_id,
            source_message_id=source_message_id,
            learner_state=state.get("learner_state") or {},
            evaluated_focus=state.get("prior_learning_focus"),
        )
        if profile:
            self.repository.append_event(MemoryEvent(
                account_id=account_id,
                task_id=task_id,
                memory_type="profile_memory",
                event_name="profile_candidates_processed",
                evidence={
                    "conversation_id": conversation_id,
                    "source_message_id": source_message_id,
                    "evidence_count": profile.get("evidence_count", 0),
                    "known_concepts": profile.get("known_concepts", []),
                    "struggling_concepts": profile.get("struggling_concepts", []),
                    "programming_level": profile.get("programming_level"),
                    "score_thresholds": self.profile_memory.thresholds,
                    "update_mode": "incremental_exponential",
                    "shadow_mode": True,
                },
            ))

    def record_tutor_turn(
        self,
        *,
        account_id: str,
        task_id: str,
        state: dict[str, Any],
        tutor_message: str,
    ) -> None:
        learner_state = state.get("learner_state") or {}
        latest_answer = learner_state.get("latestAnswer") or {}
        current_focus = learner_state.get("currentFocus") or state.get("issue_type")
        misconception = (
            latest_answer.get("misconception")
            or state.get("misconception")
            or None
        )
        previous = self.repository.get_task_memory(account_id, task_id)
        memory = TaskMemory(
            account_id=account_id,
            task_id=task_id,
            current_focus=current_focus,
            active_misconception=misconception,
            hint_level=max(0, min(3, int(state.get("hint_level", 0) or 0))),
            attempts_on_focus=max(0, int(learner_state.get("attemptsOnFocus", 0) or 0)),
            conversation_summary=previous.get("conversation_summary") if previous else None,
            last_student_message=(state.get("student_answer") or None),
            last_tutor_message=tutor_message,
        )
        self.repository.upsert_task_memory(memory)
        changed_fields = [
            field
            for field in ("current_focus", "active_misconception", "hint_level", "attempts_on_focus")
            if not previous or previous.get(field) != getattr(memory, field)
        ]
        self.repository.append_event(MemoryEvent(
            account_id=account_id,
            task_id=task_id,
            memory_type="task_memory",
            event_name="task_memory_created" if not previous else "task_memory_updated",
            evidence={
                "changed_fields": changed_fields,
                "stage": state.get("stage"),
                "question_type": state.get("question_type"),
                "agent_trace": state.get("agent_trace") or [],
                "memory_loaded": bool(state.get("memory_loaded", False)),
                "loaded_memory_id": (state.get("task_memory") or {}).get("id"),
                "short_term_memory_loaded": bool(
                    state.get("short_term_memory_loaded", False)
                ),
                "short_term_memory_count": len(
                    state.get("short_term_memory") or []
                ),
                "short_term_memory_context_count": int(
                    state.get("short_term_memory_context_count", 0) or 0
                ),
                "short_term_memory_used_by": state.get(
                    "short_term_memory_used_by", []
                ),
                "short_term_memory_usage_mode": "answer_evaluator_only",
                "short_term_memory_shadow_mode": False,
                "profile_memory_loaded": bool(
                    state.get("profile_memory_loaded", False)
                ),
                "profile_memory_used_by": state.get(
                    "profile_memory_used_by", []
                ),
                "profile_memory_summary_length": len(
                    state.get("user_profile_summary") or ""
                ),
                "profile_memory_usage_mode": "answer_evaluator_only",
                "profile_memory_shadow_mode": False,
                "shadow_mode": True,
            },
        ))

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Float,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)


metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("user_code", String(32), nullable=False, unique=True),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
)

accounts = Table(
    "accounts",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("username", String(255), nullable=False, unique=True),
    Column("username_type", String(16), nullable=False),
    Column("display_name", String(100), nullable=False),
    Column("password_hash", String(255), nullable=False),
    Column("role", String(32), nullable=False, server_default="student"),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
)

auth_sessions = Table(
    "auth_sessions",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("token_hash", String(64), nullable=False, unique=True),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    Column("expires_at", DateTime(timezone=True), nullable=False),
    Column("last_used_at", DateTime(timezone=True)),
)

task_memories = Table(
    "task_memories",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("task_id", String(120), nullable=False),
    Column("current_focus", String(255)),
    Column("active_misconception", String(255)),
    Column("hint_level", Integer, nullable=False, default=0),
    Column("attempts_on_focus", Integer, nullable=False, default=0),
    Column("conversation_summary", Text),
    Column("last_student_message", Text),
    Column("last_tutor_message", Text),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("account_id", "task_id", name="uq_task_memory_account_task"),
)

memory_events = Table(
    "memory_events",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("task_id", String(120)),
    Column("memory_type", String(64), nullable=False),
    Column("event_name", String(100), nullable=False),
    Column("evidence", JSON),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

conversation_messages = Table(
    "conversation_messages",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("task_id", String(120), nullable=False),
    Column("conversation_id", String(180), nullable=False),
    Column("source_message_id", String(180), nullable=False),
    Column("role", String(20), nullable=False),
    Column("content", Text, nullable=False),
    Column("stage", String(32)),
    Column("sequence_number", Integer, nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint(
        "account_id",
        "conversation_id",
        "source_message_id",
        name="uq_conversation_message_source",
    ),
)

user_profiles = Table(
    "user_profiles",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, unique=True),
    Column("programming_level", String(32)),
    Column("preferred_language", String(32), nullable=False, server_default="python"),
    Column("preferred_explanation_style", String(64)),
    Column("known_concepts", JSON, nullable=False),
    Column("struggling_concepts", JSON, nullable=False),
    Column("profile_summary", Text),
    Column("evidence_count", Integer, nullable=False, default=0),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    Column("updated_at", DateTime(timezone=True), nullable=False),
)

profile_observations = Table(
    "profile_observations",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("task_id", String(120), nullable=False),
    Column("conversation_id", String(180), nullable=False),
    Column("source_message_id", String(180), nullable=False),
    Column("observation_key", String(64), nullable=False, unique=True),
    Column("observation_type", String(32), nullable=False),
    Column("concept", String(120)),
    Column("value", String(120), nullable=False),
    Column("confidence", Float, nullable=False),
    Column("evidence", Text, nullable=False),
    Column("status", String(32), nullable=False, server_default="candidate"),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

concept_masteries = Table(
    "concept_masteries",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("concept", String(120), nullable=False),
    Column("mastery_score", Float, nullable=False),
    Column("status", String(32), nullable=False),
    Column("positive_evidence_count", Integer, nullable=False, default=0),
    Column("negative_evidence_count", Integer, nullable=False, default=0),
    Column("total_evidence_count", Integer, nullable=False, default=0),
    Column("last_observed_at", DateTime(timezone=True), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    Column("updated_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("account_id", "concept", name="uq_concept_mastery_account_concept"),
)

profile_score_events = Table(
    "profile_score_events",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("account_id", String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False),
    Column("concept", String(120), nullable=False),
    Column("observation_key", String(64), nullable=False, unique=True),
    Column("evidence_type", String(32), nullable=False),
    Column("confidence", Float, nullable=False),
    Column("score_before", Float, nullable=False),
    Column("score_delta", Float, nullable=False),
    Column("score_after", Float, nullable=False),
    Column("status_before", String(32), nullable=False),
    Column("status_after", String(32), nullable=False),
    Column("created_at", DateTime(timezone=True), nullable=False),
)

study_sessions = Table(
    "study_sessions",
    metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("user_id", Uuid(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("status", String(32), nullable=False, index=True),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("completed_at", DateTime(timezone=True)),
    Column("client_version", String(100)),
)

task_attempts = Table(
    "task_attempts",
    metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("session_id", Uuid(as_uuid=False), ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False),
    Column("task_id", String(120), nullable=False),
    Column("entry_path", String(32)),
    Column("current_stage", String(32)),
    Column("status", String(32), nullable=False),
    Column("student_plan", JSON, nullable=False),
    Column("final_code", Text, nullable=False),
    Column("planning_revision_count", Integer, nullable=False, default=0),
    Column("code_attempt_count", Integer, nullable=False, default=0),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("completed_at", DateTime(timezone=True)),
    UniqueConstraint("session_id", "task_id", name="uq_task_attempt_session_task"),
)

tutor_messages = Table(
    "tutor_messages",
    metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("attempt_id", Uuid(as_uuid=False), ForeignKey("task_attempts.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", Uuid(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL")),
    Column("user_code", String(32)),
    Column("sequence_number", Integer, nullable=False),
    Column("role", String(32), nullable=False),
    Column("content", Text, nullable=False),
    Column("stage", String(32)),
    Column("action_type", String(100)),
    Column("hint_level", Integer),
    Column("intervention_path", String(120)),
    Column("current_focus", String(255)),
    Column("answer_quality", String(64)),
    Column("question_type", String(100)),
    Column("learner_state_evidence", JSON),
    Column("plan_review_result", JSON),
    Column("model_provider", String(100)),
    Column("model_name", String(120)),
    Column("model_version", String(100)),
    Column("prompt_version", String(100)),
    Column("response_latency_ms", Integer),
    Column("created_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("attempt_id", "sequence_number", name="uq_tutor_message_attempt_sequence"),
)

interaction_events = Table(
    "interaction_events",
    metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("attempt_id", Uuid(as_uuid=False), ForeignKey("task_attempts.id", ondelete="CASCADE"), nullable=False),
    Column("sequence_number", Integer, nullable=False),
    Column("event_name", String(120), nullable=False),
    Column("stage", String(32)),
    Column("hint_level", Integer),
    Column("intervention_path", String(120)),
    Column("current_focus", String(255)),
    Column("metadata", JSON),
    Column("occurred_at", DateTime(timezone=True), nullable=False),
)

code_runs = Table(
    "code_runs",
    metadata,
    Column("id", Uuid(as_uuid=False), primary_key=True),
    Column("attempt_id", Uuid(as_uuid=False), ForeignKey("task_attempts.id", ondelete="CASCADE"), nullable=False),
    Column("run_number", Integer, nullable=False),
    Column("code_snapshot", Text, nullable=False),
    Column("status", String(32)),
    Column("stdout", Text),
    Column("stderr", Text),
    Column("error_type", String(100)),
    Column("passed_tests", Integer, nullable=False, default=0),
    Column("total_tests", Integer, nullable=False, default=0),
    Column("test_results", JSON),
    Column("duration_ms", Integer),
    Column("created_at", DateTime(timezone=True), nullable=False),
    UniqueConstraint("attempt_id", "run_number", name="uq_code_run_attempt_number"),
)

Index("ix_tutor_messages_user_code_created_at", tutor_messages.c.user_code, tutor_messages.c.created_at)
Index("ix_tutor_messages_attempt_question_type", tutor_messages.c.attempt_id, tutor_messages.c.question_type)
Index(
    "ix_conversation_messages_recent",
    conversation_messages.c.account_id,
    conversation_messages.c.task_id,
    conversation_messages.c.conversation_id,
    conversation_messages.c.sequence_number,
)


TABLES = {
    table.name: table
    for table in (
        accounts,
        auth_sessions,
        task_memories,
        memory_events,
        conversation_messages,
        user_profiles,
        profile_observations,
        concept_masteries,
        profile_score_events,
        users,
        study_sessions,
        task_attempts,
        tutor_messages,
        interaction_events,
        code_runs,
    )
}

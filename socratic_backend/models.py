from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    func,
)


metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", String(36), primary_key=True),
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

study_sessions = Table(
    "study_sessions",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("status", String(32), nullable=False, index=True),
    Column("started_at", DateTime(timezone=True), nullable=False),
    Column("completed_at", DateTime(timezone=True)),
    Column("client_version", String(100)),
)

task_attempts = Table(
    "task_attempts",
    metadata,
    Column("id", String(36), primary_key=True),
    Column("session_id", String(36), ForeignKey("study_sessions.id", ondelete="CASCADE"), nullable=False),
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
    Column("id", String(36), primary_key=True),
    Column("attempt_id", String(36), ForeignKey("task_attempts.id", ondelete="CASCADE"), nullable=False),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="SET NULL")),
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
    Column("id", String(36), primary_key=True),
    Column("attempt_id", String(36), ForeignKey("task_attempts.id", ondelete="CASCADE"), nullable=False),
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
    Column("id", String(36), primary_key=True),
    Column("attempt_id", String(36), ForeignKey("task_attempts.id", ondelete="CASCADE"), nullable=False),
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


TABLES = {
    table.name: table
    for table in (
        accounts,
        users,
        study_sessions,
        task_attempts,
        tutor_messages,
        interaction_events,
        code_runs,
    )
}

import os
import sys
import uuid
from datetime import datetime, timezone

from database import database

_UUID_NAMESPACE = uuid.UUID("a57f741c-1ed5-45d2-80a4-502b416f50a9")
_STUDY_SESSION_ID = None


def _stable_uuid(*parts: object) -> str:
    return str(uuid.uuid5(_UUID_NAMESPACE, "|".join(str(part) for part in parts)))


def _get_database():
    return database


def _get_study_session_id(explicit_session_id: str | None = None) -> str:
    global _STUDY_SESSION_ID
    if explicit_session_id:
        return explicit_session_id
    configured = os.getenv("SOCRATIC_STUDY_SESSION_ID")
    if configured:
        return configured
    if _STUDY_SESSION_ID is None:
        response = (_get_database().table("study_sessions").select("id")
                    .eq("status", "active").order("started_at", desc=True).limit(1).execute())
        if not response.data:
            raise RuntimeError("No active study session exists")
        _STUDY_SESSION_ID = response.data[0]["id"]
    return _STUDY_SESSION_ID


def _get_attempt_id(client, study_session_id: str, task_id: str) -> str:
    existing = (client.table("task_attempts").select("id")
                .eq("session_id", study_session_id).eq("task_id", task_id)
                .limit(1).execute().data)
    if existing:
        return existing[0]["id"]
    return _stable_uuid("study-attempt", study_session_id, task_id)


def _get_user_identity(client, study_session_id: str) -> dict:
    """Resolve the anonymous participant identity for export-friendly rows."""
    sessions = (client.table("study_sessions").select("user_id")
                .eq("id", study_session_id).limit(1).execute().data)
    if not sessions or not sessions[0].get("user_id"):
        return {}
    user_id = sessions[0]["user_id"]
    users = (client.table("users").select("user_code")
             .eq("id", user_id).limit(1).execute().data)
    return {
        "user_id": user_id,
        "user_code": users[0].get("user_code") if users else None,
    }


def _message_row(*, attempt_id: str, sequence: int, message: dict, fallback_stage: str) -> dict:
    source_id = message.get("id") or f"sequence-{sequence}"
    learner_state = message.get("learnerState") or {}
    return {
        "id": _stable_uuid("message", attempt_id, source_id),
        "attempt_id": attempt_id,
        "sequence_number": sequence,
        "role": message.get("role", "tutor"),
        "content": message.get("content", ""),
        "stage": message.get("stage") or fallback_stage,
        "action_type": message.get("actionType"),
        "hint_level": message.get("hintLevel"),
        "intervention_path": message.get("interventionPath"),
        "current_focus": learner_state.get("currentFocus"),
        "answer_quality": learner_state.get("answerQuality") or (learner_state.get("latestAnswer") or {}).get("quality"),
        "question_type": message.get("questionType"),
        "learner_state_evidence": message.get("learnerStateEvidence") or learner_state or None,
        "plan_review_result": message.get("planReviewResult"),
        "model_provider": message.get("modelProvider"),
        "model_name": message.get("modelName"),
        "model_version": message.get("modelVersion"),
        "prompt_version": message.get("promptVersion"),
        "response_latency_ms": message.get("responseLatencyMs"),
        "created_at": message.get("timestamp") or datetime.now(timezone.utc).isoformat(),
    }


_OPTIONAL_TUTOR_MESSAGE_COLUMNS = {
    "question_type", "learner_state_evidence", "plan_review_result",
    "model_provider", "model_name", "model_version", "prompt_version",
    "response_latency_ms", "user_id", "user_code",
}


def _core_tutor_message_row(row: dict) -> dict:
    return {
        key: value for key, value in row.items()
        if key not in _OPTIONAL_TUTOR_MESSAGE_COLUMNS
    }


def _upsert_tutor_messages_compatibly(client, rows: list[dict]):
    try:
        client.table("tutor_messages").upsert(rows).execute()
    except Exception as error:
        fallback_rows = [_core_tutor_message_row(row) for row in rows]
        client.table("tutor_messages").upsert(fallback_rows).execute()
        print(
            f"Tutor analytics columns unavailable; saved core message fields only: {error}",
            file=sys.stderr,
        )


def _upsert_interaction_event_compatibly(client, row: dict):
    """Support schemas both before and after removal of duplicate event_id."""
    try:
        client.table("interaction_events").upsert(row).execute()
    except Exception:
        client.table("interaction_events").upsert({**row, "event_id": row["id"]}).execute()


def _upsert_code_run_compatibly(client, row: dict):
    """Keep logging runs before and after the test_results migration."""
    try:
        client.table("code_runs").upsert(row).execute()
    except Exception as error:
        legacy_row = {key: value for key, value in row.items() if key != "test_results"}
        client.table("code_runs").upsert(legacy_row).execute()
        print(
            f"code_runs.test_results unavailable; saved aggregate test fields only: {error}",
            file=sys.stderr,
        )


def _write_to_database(*, session_id: str, task_id: str, state: dict, tutor_question: str, record: dict, study_session_id: str | None = None):
    client = _get_database()
    resolved_study_session_id = _get_study_session_id(study_session_id)
    attempt_id = _get_attempt_id(client, resolved_study_session_id, task_id)
    existing_attempts = (
        client.table("task_attempts")
        .select("planning_revision_count,code_attempt_count,started_at")
        .eq("id", attempt_id)
        .limit(1)
        .execute()
        .data
    )
    existing_attempt = existing_attempts[0] if existing_attempts else {}
    planning_revision_count = int(existing_attempt.get("planning_revision_count") or 0)
    code_attempt_count = int(existing_attempt.get("code_attempt_count") or 0)
    now = record["timestamp"]
    stage = record["stage"] or "plan"
    client.table("task_attempts").upsert({
        "id": attempt_id,
        "session_id": resolved_study_session_id,
        "task_id": task_id,
        "entry_path": state.get("entry_path"),
        "current_stage": stage,
        "status": "completed" if stage == "reflect" and state.get("latest_run_status") == "success" else "active",
        "student_plan": record["student_plan"],
        "final_code": record["student_code"],
        "planning_revision_count": planning_revision_count,
        "code_attempt_count": code_attempt_count,
        "started_at": existing_attempt.get("started_at") or now,
    }).execute()

    messages = list(state.get("messages") or [])
    rows = [_message_row(attempt_id=attempt_id, sequence=index + 1, message=message, fallback_stage=stage)
            for index, message in enumerate(messages) if message.get("role") in {"student", "tutor"}]
    tutor_message = {
        "id": _stable_uuid("tutor-response", session_id, task_id, len(messages), tutor_question),
        "role": "tutor", "content": tutor_question, "timestamp": now, "stage": stage,
        "actionType": state.get("action"), "hintLevel": record["hint_level"],
        "interventionPath": record["intervention_path"], "learnerState": state.get("learner_state") or {},
        "questionType": state.get("question_type"),
        "learnerStateEvidence": state.get("learner_state_evidence"),
        "planReviewResult": state.get("plan_review_result"),
        "modelProvider": state.get("model_provider"),
        "modelName": state.get("model_name"),
        "modelVersion": state.get("model_version"),
        "promptVersion": state.get("prompt_version"),
        "responseLatencyMs": state.get("response_latency_ms"),
    }
    rows.append(_message_row(attempt_id=attempt_id, sequence=len(rows) + 1,
                             message=tutor_message, fallback_stage=stage))
    user_identity = _get_user_identity(client, resolved_study_session_id)
    rows = [{**row, **user_identity} for row in rows]
    _upsert_tutor_messages_compatibly(client, rows)

    event_id = _stable_uuid("event", attempt_id, len(messages), tutor_question)
    _upsert_interaction_event_compatibly(client, {
        "id": event_id, "attempt_id": attempt_id,
        "sequence_number": len(messages) + 1,
        "event_name": record["pedagogical_action"] or state.get("action") or "tutor_response",
        "stage": stage, "hint_level": record["hint_level"],
        "intervention_path": record["intervention_path"],
        "current_focus": (state.get("learner_state") or {}).get("currentFocus"),
        "metadata": {
            "detected_misconception": record["detected_misconception"],
            "agent": record["agent"],
            "conversation_id": session_id,
            "agent_trace": state.get("agent_trace") or [],
            "trace_version": "langgraph-agent-trace-v1",
            "trace_capture_mode": "server_runtime",
            "trace_captured_at": now,
        },
        "occurred_at": now,
    })

    if state.get("latest_run_status"):
        tests = state.get("latest_run_tests") or []
        run_source_id = state.get("latest_run_id") or f'{code_attempt_count}:{record["student_code"]}'
        _upsert_code_run_compatibly(client, {
            "id": _stable_uuid("code-run", attempt_id, run_source_id), "attempt_id": attempt_id,
            "run_number": code_attempt_count, "code_snapshot": record["student_code"],
            "status": state.get("latest_run_status"), "stdout": state.get("latest_run_stdout") or "",
            "stderr": state.get("latest_run_stderr") or "", "error_type": state.get("latest_error_type"),
            "passed_tests": sum(1 for test in tests if test.get("passed")), "total_tests": len(tests),
            "test_results": tests,
            "duration_ms": state.get("latest_run_duration_ms"), "created_at": now,
        })


def save_assessment_score(*, task_id: str, plan: dict, code: str, runs: list, score: dict, study_session_id: str | None = None):
    """Store a blind pre/post assessment score with its full audit evidence."""
    client = _get_database()
    study_session_id = _get_study_session_id(study_session_id)
    attempt_id = _get_attempt_id(client, study_session_id, task_id)
    now = datetime.now(timezone.utc).isoformat()
    existing = client.table("task_attempts").select("code_attempt_count,started_at").eq("id", attempt_id).limit(1).execute().data
    code_attempt_count = existing[0].get("code_attempt_count") or 0 if existing else len(runs)
    started_at = existing[0].get("started_at") if existing else plan.get("lockedAt") or now
    client.table("task_attempts").upsert({
        "id": attempt_id,
        "session_id": study_session_id,
        "task_id": task_id,
        "entry_path": "plan",
        "current_stage": "reflect",
        "status": "completed",
        "student_plan": plan,
        "final_code": code,
        "planning_revision_count": 1,
        "code_attempt_count": code_attempt_count,
        "started_at": started_at,
        "completed_at": now,
    }).execute()

    event_id = _stable_uuid("ct-score", attempt_id, score.get("rubric_version"))
    _upsert_interaction_event_compatibly(client, {
        "id": event_id, "attempt_id": attempt_id,
        "sequence_number": len(runs) + 1, "event_name": "computational_thinking_score",
        "stage": "reflect", "metadata": score, "occurred_at": now,
    })
    if task_id == "task_4_minimum":
        client.table("study_sessions").update({
            "status": "completed", "completed_at": now,
        }).eq("id", study_session_id).execute()


def save_assessment_plan(*, task_id: str, plan: dict, study_session_id: str):
    client = _get_database()
    attempt_id = _get_attempt_id(client, study_session_id, task_id)
    now = datetime.now(timezone.utc).isoformat()
    locked_plan = {**plan, "lockedAt": now}
    existing = client.table("task_attempts").select("final_code,code_attempt_count,started_at").eq("id", attempt_id).limit(1).execute().data
    client.table("task_attempts").upsert({
        "id": attempt_id,
        "session_id": study_session_id,
        "task_id": task_id,
        "entry_path": "plan",
        "current_stage": "code",
        "status": "active",
        "student_plan": locked_plan,
        "final_code": existing[0].get("final_code") or "" if existing else "",
        "planning_revision_count": 1,
        "code_attempt_count": existing[0].get("code_attempt_count") or 0 if existing else 0,
        "started_at": existing[0].get("started_at") or now if existing else now,
    }).execute()
    return locked_plan


def save_task_draft(*, task_id: str, plan: dict, code: str, entry_path: str | None,
                    current_stage: str, study_session_id: str):
    """Persist the latest in-progress artifacts when a participant leaves a task."""
    client = _get_database()
    attempt_id = _get_attempt_id(client, study_session_id, task_id)
    now = datetime.now(timezone.utc).isoformat()
    existing = (client.table("task_attempts")
                .select("id,status,started_at,planning_revision_count,code_attempt_count")
                .eq("id", attempt_id).limit(1).execute().data)
    if existing:
        current = existing[0]
        update = {
            "entry_path": entry_path,
            "current_stage": current_stage,
            "student_plan": plan,
            "final_code": code,
        }
        if current.get("status") != "completed":
            update["status"] = "active"
        client.table("task_attempts").update(update).eq("id", attempt_id).execute()
    else:
        client.table("task_attempts").insert({
            "id": attempt_id,
            "session_id": study_session_id,
            "task_id": task_id,
            "entry_path": entry_path,
            "current_stage": current_stage,
            "status": "active",
            "student_plan": plan,
            "final_code": code,
            "planning_revision_count": 0,
            "code_attempt_count": 0,
            "started_at": now,
        }).execute()


def complete_study_task(*, task_id: str, plan: dict, code: str,
                        entry_path: str | None, study_session_id: str):
    """Persist final artifacts and complete a regular tutor-supported task."""
    save_task_draft(
        task_id=task_id,
        plan=plan,
        code=code,
        entry_path=entry_path,
        current_stage="reflect",
        study_session_id=study_session_id,
    )
    client = _get_database()
    attempt_id = _get_attempt_id(client, study_session_id, task_id)
    client.table("task_attempts").update({
        "status": "completed",
        "current_stage": "reflect",
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", attempt_id).execute()


def save_tutor_conversation_snapshot(*, task_id: str, messages: list[dict],
                                     stage: str, entry_path: str | None,
                                     study_session_id: str):
    """Backfill the browser's durable conversation snapshot into MySQL."""
    client = _get_database()
    attempt_id = _get_attempt_id(client, study_session_id, task_id)
    existing = (client.table("task_attempts").select("id,entry_path")
                .eq("id", attempt_id).limit(1).execute().data)
    if not existing:
        now = datetime.now(timezone.utc).isoformat()
        client.table("task_attempts").insert({
            "id": attempt_id, "session_id": study_session_id, "task_id": task_id,
            "entry_path": entry_path, "current_stage": stage, "status": "active",
            "student_plan": {}, "final_code": "", "planning_revision_count": 0,
            "code_attempt_count": 0, "started_at": now,
        }).execute()
    elif not existing[0].get("entry_path") and entry_path:
        client.table("task_attempts").update({"entry_path": entry_path}).eq("id", attempt_id).execute()

    conversation_messages = [
        message for message in messages if message.get("role") in {"student", "tutor"}
    ]
    user_identity = _get_user_identity(client, study_session_id)
    for sequence, message in enumerate(conversation_messages, start=1):
        row = {**_message_row(
            attempt_id=attempt_id,
            sequence=sequence,
            message=message,
            fallback_stage=stage,
        ), **user_identity}
        # Do not replace richer server-side analytics with null snapshot values.
        compact_row = {key: value for key, value in row.items() if value is not None}
        existing_message = (
            client.table("tutor_messages").select("id")
            .eq("attempt_id", attempt_id)
            .eq("sequence_number", sequence)
            .limit(1).execute().data
        )
        if existing_message:
            update = {
                key: value
                for key, value in compact_row.items()
                if key not in {"id", "attempt_id", "sequence_number"}
            }
            try:
                client.table("tutor_messages").update(update).eq(
                    "id", existing_message[0]["id"]
                ).execute()
            except Exception:
                client.table("tutor_messages").update(
                    _core_tutor_message_row(update)
                ).eq("id", existing_message[0]["id"]).execute()
        else:
            try:
                client.table("tutor_messages").insert(compact_row).execute()
            except Exception:
                client.table("tutor_messages").insert(
                    _core_tutor_message_row(compact_row)
                ).execute()

        agent_trace = message.get("agentTrace") or []
        if message.get("role") == "tutor" and agent_trace:
            trace_event_id = _stable_uuid(
                "agent-trace-snapshot", attempt_id, message.get("id") or sequence
            )
            captured_at = message.get("timestamp") or datetime.now(timezone.utc).isoformat()
            _upsert_interaction_event_compatibly(client, {
                "id": trace_event_id,
                "attempt_id": attempt_id,
                "sequence_number": sequence,
                "event_name": "agent_trace_snapshot",
                "stage": message.get("stage") or stage,
                "hint_level": message.get("hintLevel"),
                "intervention_path": message.get("interventionPath"),
                "current_focus": (message.get("learnerState") or {}).get("currentFocus"),
                "metadata": {
                    "message_id": message.get("id"),
                    "agent_trace": agent_trace,
                    "trace_version": "langgraph-agent-trace-v1",
                    "trace_capture_mode": "client_snapshot",
                    "trace_captured_at": captured_at,
                },
                "occurred_at": captured_at,
            })


def save_code_run(*, task_id: str, code: str, result: dict, study_session_id: str):
    client = _get_database()
    attempt_id = _get_attempt_id(client, study_session_id, task_id)
    now = result.get("createdAt") or datetime.now(timezone.utc).isoformat()
    existing = client.table("task_attempts").select("id,code_attempt_count").eq("id", attempt_id).limit(1).execute().data
    latest_runs = client.table("code_runs").select("run_number").eq("attempt_id", attempt_id).order("run_number", desc=True).limit(1).execute().data
    next_run = (latest_runs[0].get("run_number") or 0) + 1 if latest_runs else 1
    if existing:
        client.table("task_attempts").update({
            "final_code": code, "code_attempt_count": next_run, "current_stage": "code",
        }).eq("id", attempt_id).execute()
    else:
        client.table("task_attempts").insert({
            "id": attempt_id, "session_id": study_session_id, "task_id": task_id,
            "entry_path": "plan" if task_id in {"task_1_maximum", "task_4_minimum"} else None,
            "current_stage": "code", "status": "active",
            "student_plan": {}, "final_code": code, "planning_revision_count": 0,
            "code_attempt_count": next_run, "started_at": now,
        }).execute()
    tests = result.get("tests") or []
    _upsert_code_run_compatibly(client, {
        "id": _stable_uuid("run", attempt_id, result.get("id")), "attempt_id": attempt_id,
        "run_number": next_run, "code_snapshot": code, "status": result.get("status"),
        "stdout": result.get("stdout") or "", "stderr": result.get("stderr") or "",
        "error_type": (result.get("error") or {}).get("type"),
        "passed_tests": sum(1 for test in tests if test.get("passed")), "total_tests": len(tests),
        "test_results": tests,
        "duration_ms": result.get("elapsedMs"), "created_at": now,
    })


def log_intervention(*, session_id: str, task_id: str, state: dict, tutor_question: str, study_session_id: str | None = None):
    """Persist structured study data without recording model chain-of-thought."""
    record = {
        "participant_or_session_id": session_id, "task_id": task_id,
        "timestamp": datetime.now(timezone.utc).isoformat(), "stage": state.get("stage", ""),
        "student_plan": state.get("plan_form", {}), "student_code": state.get("student_code", ""),
        "execution_result": state.get("execution_result", ""),
        "detected_misconception": state.get("misconception", ""),
        "agent": "Agent 1" if state.get("stage") == "plan" else "Agent 2",
        "hint_level": state.get("hint_level"), "intervention_path": state.get("intervention_path"),
        "tutor_question": tutor_question, "student_response": state.get("student_answer", ""),
        "pedagogical_action": state.get("pedagogical_action") or state.get("selected_action"),
    }
    try:
        _write_to_database(session_id=session_id, task_id=task_id, state=state,
                           tutor_question=tutor_question, record=record,
                           study_session_id=study_session_id)
        print(
            f"STUDY_INTERVENTION_SAVED task_id={task_id} stage={record['stage']}",
            flush=True,
        )
    except Exception as error:
        print(f"Study database logging failed: {error}", file=sys.stderr)

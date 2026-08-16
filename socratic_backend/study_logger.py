import json
import os
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path

_LOCK = threading.Lock()
_COUNTERS = {}
_LOG_PATH = Path(os.getenv("SOCRATIC_STUDY_LOG", Path(__file__).parent / "logs" / "user-study.jsonl"))
_UUID_NAMESPACE = uuid.UUID("a57f741c-1ed5-45d2-80a4-502b416f50a9")
_SUPABASE = None
_STUDY_SESSION_ID = None


def _stable_uuid(*parts: object) -> str:
    return str(uuid.uuid5(_UUID_NAMESPACE, "|".join(str(part) for part in parts)))


def _get_supabase():
    global _SUPABASE
    if _SUPABASE is None:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            raise RuntimeError("Supabase study logging is not configured")
        _SUPABASE = create_client(url, key)
    return _SUPABASE


def _get_study_session_id(explicit_session_id: str | None = None) -> str:
    global _STUDY_SESSION_ID
    if explicit_session_id:
        return explicit_session_id
    configured = os.getenv("SOCRATIC_STUDY_SESSION_ID")
    if configured:
        return configured
    if _STUDY_SESSION_ID is None:
        response = (_get_supabase().table("study_sessions").select("id")
                    .eq("status", "active").order("started_at", desc=True).limit(1).execute())
        if not response.data:
            raise RuntimeError("No active study session exists")
        _STUDY_SESSION_ID = response.data[0]["id"]
    return _STUDY_SESSION_ID


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
        "answer_quality": learner_state.get("answerQuality"),
        "created_at": message.get("timestamp") or datetime.now(timezone.utc).isoformat(),
    }


def _write_to_supabase(*, session_id: str, task_id: str, state: dict, tutor_question: str, record: dict, study_session_id: str | None = None):
    client = _get_supabase()
    resolved_study_session_id = _get_study_session_id(study_session_id)
    attempt_id = _stable_uuid("study-attempt", resolved_study_session_id, task_id)
    now = record["timestamp"]
    stage = record["stage"] or "plan"
    client.table("task_attempts").upsert({
        "id": attempt_id,
        "session_id": resolved_study_session_id,
        "task_id": task_id,
        "entry_path": state.get("mode") or "socratic_tutor",
        "current_stage": stage,
        "status": "completed" if stage == "reflect" and state.get("latest_run_status") == "success" else "active",
        "student_plan": record["student_plan"],
        "final_code": record["student_code"],
        "planning_revision_count": record["planning_revision_count"],
        "code_attempt_count": record["code_attempt_count"],
        "started_at": now,
    }).execute()

    messages = list(state.get("messages") or [])
    rows = [_message_row(attempt_id=attempt_id, sequence=index + 1, message=message, fallback_stage=stage)
            for index, message in enumerate(messages) if message.get("role") in {"student", "tutor"}]
    tutor_message = {
        "id": _stable_uuid("tutor-response", session_id, task_id, len(messages), tutor_question),
        "role": "tutor", "content": tutor_question, "timestamp": now, "stage": stage,
        "actionType": state.get("action"), "hintLevel": record["hint_level"],
        "interventionPath": record["intervention_path"], "learnerState": state.get("learner_state") or {},
    }
    rows.append(_message_row(attempt_id=attempt_id, sequence=len(rows) + 1,
                             message=tutor_message, fallback_stage=stage))
    client.table("tutor_messages").upsert(rows).execute()

    event_id = _stable_uuid("event", attempt_id, len(messages), tutor_question)
    client.table("interaction_events").upsert({
        "id": event_id, "attempt_id": attempt_id, "event_id": event_id,
        "sequence_number": len(messages) + 1,
        "event_name": record["pedagogical_action"] or state.get("action") or "tutor_response",
        "stage": stage, "hint_level": record["hint_level"],
        "intervention_path": record["intervention_path"],
        "current_focus": (state.get("learner_state") or {}).get("currentFocus"),
        "metadata": {"detected_misconception": record["detected_misconception"],
                     "agent": record["agent"], "conversation_id": session_id},
        "occurred_at": now,
    }).execute()

    if state.get("latest_run_status"):
        tests = state.get("latest_run_tests") or []
        run_source_id = state.get("latest_run_id") or f'{record["code_attempt_count"]}:{record["student_code"]}'
        client.table("code_runs").upsert({
            "id": _stable_uuid("code-run", attempt_id, run_source_id), "attempt_id": attempt_id,
            "run_number": record["code_attempt_count"], "code_snapshot": record["student_code"],
            "status": state.get("latest_run_status"), "stdout": state.get("latest_run_stdout") or "",
            "stderr": state.get("latest_run_stderr") or "", "error_type": state.get("latest_error_type"),
            "passed_tests": sum(1 for test in tests if test.get("passed")), "total_tests": len(tests),
            "duration_ms": state.get("latest_run_duration_ms"), "created_at": now,
        }).execute()


def save_assessment_score(*, task_id: str, plan: dict, code: str, runs: list, score: dict, study_session_id: str | None = None):
    """Store a blind pre/post assessment score with its full audit evidence."""
    client = _get_supabase()
    study_session_id = _get_study_session_id(study_session_id)
    attempt_id = _stable_uuid("study-attempt", study_session_id, task_id)
    now = datetime.now(timezone.utc).isoformat()
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
        "code_attempt_count": len(runs),
        "started_at": plan.get("lockedAt") or now,
        "completed_at": now,
    }).execute()

    for index, run in enumerate(reversed(runs), start=1):
        tests = run.get("tests") or []
        client.table("code_runs").upsert({
            "id": _stable_uuid("assessment-run", attempt_id, run.get("id") or index),
            "attempt_id": attempt_id, "run_number": index,
            "code_snapshot": run.get("codeSnapshot") or code,
            "status": run.get("status"), "stdout": run.get("stdout") or "",
            "stderr": run.get("stderr") or "", "error_type": (run.get("error") or {}).get("type"),
            "passed_tests": sum(1 for test in tests if test.get("passed")),
            "total_tests": len(tests), "duration_ms": run.get("elapsedMs"),
            "created_at": run.get("createdAt") or now,
        }).execute()

    event_id = _stable_uuid("ct-score", attempt_id, score.get("rubric_version"))
    client.table("interaction_events").upsert({
        "id": event_id, "attempt_id": attempt_id, "event_id": event_id,
        "sequence_number": len(runs) + 1, "event_name": "computational_thinking_score",
        "stage": "reflect", "metadata": score, "occurred_at": now,
    }).execute()
    if task_id == "task_5_below_limit":
        client.table("study_sessions").update({
            "status": "completed", "completed_at": now,
        }).eq("id", study_session_id).execute()


def save_assessment_plan(*, task_id: str, plan: dict, study_session_id: str):
    client = _get_supabase()
    attempt_id = _stable_uuid("study-attempt", study_session_id, task_id)
    now = datetime.now(timezone.utc).isoformat()
    locked_plan = {**plan, "lockedAt": now}
    client.table("task_attempts").upsert({
        "id": attempt_id,
        "session_id": study_session_id,
        "task_id": task_id,
        "entry_path": "plan",
        "current_stage": "code",
        "status": "active",
        "student_plan": locked_plan,
        "final_code": "",
        "planning_revision_count": 1,
        "code_attempt_count": 0,
        "started_at": now,
    }).execute()
    return locked_plan


def save_code_run(*, task_id: str, code: str, result: dict, study_session_id: str):
    client = _get_supabase()
    attempt_id = _stable_uuid("study-attempt", study_session_id, task_id)
    now = result.get("createdAt") or datetime.now(timezone.utc).isoformat()
    existing = client.table("task_attempts").select("id,code_attempt_count").eq("id", attempt_id).limit(1).execute().data
    next_run = (existing[0].get("code_attempt_count") or 0) + 1 if existing else 1
    if existing:
        client.table("task_attempts").update({
            "final_code": code, "code_attempt_count": next_run, "current_stage": "code",
        }).eq("id", attempt_id).execute()
    else:
        client.table("task_attempts").insert({
            "id": attempt_id, "session_id": study_session_id, "task_id": task_id,
            "entry_path": "code", "current_stage": "code", "status": "active",
            "student_plan": {}, "final_code": code, "planning_revision_count": 0,
            "code_attempt_count": next_run, "started_at": now,
        }).execute()
    tests = result.get("tests") or []
    client.table("code_runs").upsert({
        "id": _stable_uuid("run", attempt_id, result.get("id")), "attempt_id": attempt_id,
        "run_number": next_run, "code_snapshot": code, "status": result.get("status"),
        "stdout": result.get("stdout") or "", "stderr": result.get("stderr") or "",
        "error_type": (result.get("error") or {}).get("type"),
        "passed_tests": sum(1 for test in tests if test.get("passed")), "total_tests": len(tests),
        "duration_ms": result.get("elapsedMs"), "created_at": now,
    }).execute()


def log_intervention(*, session_id: str, task_id: str, state: dict, tutor_question: str, study_session_id: str | None = None):
    """Persist structured study data without recording model chain-of-thought."""
    key = (session_id, task_id)
    with _LOCK:
        counters = _COUNTERS.setdefault(key, {"planning": 0, "code": 0})
        if state.get("stage") == "plan" and state.get("student_answer", "").strip():
            counters["planning"] += 1
        if state.get("latest_run_status"):
            counters["code"] += 1
        record = {
            "participant_or_session_id": session_id, "task_id": task_id,
            "timestamp": datetime.now(timezone.utc).isoformat(), "stage": state.get("stage", ""),
            "student_plan": state.get("plan_form", {}), "student_code": state.get("student_code", ""),
            "execution_result": state.get("execution_result", ""),
            "detected_misconception": state.get("misconception", ""),
            "agent": "Agent 1" if state.get("stage") == "plan" else "Agent 2",
            "hint_level": state.get("hint_level"), "intervention_path": state.get("intervention_path"),
            "tutor_question": tutor_question, "student_response": state.get("student_answer", ""),
            "planning_revision_count": counters["planning"], "code_attempt_count": counters["code"],
            "pedagogical_action": state.get("pedagogical_action") or state.get("selected_action"),
        }
        _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with _LOG_PATH.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(record, ensure_ascii=False) + "\n")
        try:
            _write_to_supabase(session_id=session_id, task_id=task_id, state=state,
                               tutor_question=tutor_question, record=record,
                               study_session_id=study_session_id)
        except Exception as error:
            print(f"Study database logging failed: {error}", file=sys.stderr)

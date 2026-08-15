import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

_LOCK = threading.Lock()
_COUNTERS = {}
_LOG_PATH = Path(os.getenv("SOCRATIC_STUDY_LOG", Path(__file__).parent / "logs" / "user-study.jsonl"))


def log_intervention(*, session_id: str, task_id: str, state: dict, tutor_question: str):
    """Append structured study data only; never records model chain-of-thought."""
    key = (session_id, task_id)
    with _LOCK:
        counters = _COUNTERS.setdefault(key, {"planning": 0, "code": 0})
        if state.get("stage") == "plan" and state.get("student_answer", "").strip():
            counters["planning"] += 1
        if state.get("latest_run_status"):
            counters["code"] += 1
        record = {
            "participant_or_session_id": session_id,
            "task_id": task_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "stage": state.get("stage", ""),
            "student_plan": state.get("plan_form", {}),
            "student_code": state.get("student_code", ""),
            "execution_result": state.get("execution_result", ""),
            "detected_misconception": state.get("misconception", ""),
            "agent": "Agent 1" if state.get("stage") == "plan" else "Agent 2",
            "hint_level": state.get("hint_level"),
            "intervention_path": state.get("intervention_path"),
            "tutor_question": tutor_question,
            "student_response": state.get("student_answer", ""),
            "planning_revision_count": counters["planning"],
            "code_attempt_count": counters["code"],
            "pedagogical_action": state.get("pedagogical_action") or state.get("selected_action"),
        }
        _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with _LOG_PATH.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(record, ensure_ascii=False) + "\n")

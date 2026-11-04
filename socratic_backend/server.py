"""
FastAPI HTTP layer exposing the Socratic tutor agents to the Next.js frontend.

Run locally with:
    cd socratic_backend
    uvicorn server:app --reload --port 8001

The Next.js API route (app/api/tutor/message/route.ts) proxies requests to
this service. Request/response field names intentionally mirror
`types/tutor.ts` on the frontend (camelCase) so no field remapping is needed.
"""

import os
import base64
import hashlib
import hmac
import random
import re
import json
import sys
import time
import uuid
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from study_logger import complete_study_task, log_intervention, save_assessment_plan, save_assessment_score, save_code_run, save_task_draft, save_tutor_conversation_snapshot
from llm_base import base_llm_call, model as scoring_model

from tutor_graph import graph

from database import check_database, database
from memory import MemoryManager
from auth_verification import (
    VerificationError,
    consume_registration_code,
    normalize_email,
    send_registration_code,
    verify_registration_code,
)

app = FastAPI(title="Socratic Tutor Backend")
memory_manager = MemoryManager()

# Server-to-server call from the Next.js API route doesn't need CORS, but we
# allow the local dev origin too in case this is hit directly while testing.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request models (mirrors types/tutor.ts::TutorRequest) ----------

class RunResultError(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    message: Optional[str] = None
    hint: Optional[str] = None


class LatestRunResult(BaseModel):
    id: Optional[str] = None
    status: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    elapsedMs: Optional[int] = None
    error: Optional[RunResultError] = None
    tests: List[dict] = []


class PlanningData(BaseModel):
    status: Optional[str] = None
    approach: Optional[str] = None
    steps: Optional[List[str]] = None


class ConversationMessage(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    timestamp: Optional[str] = None
    hintLevel: Optional[int] = None
    learnerState: Optional[dict] = None


class TutorRequest(BaseModel):
    uiLanguage: str = "en"
    taskId: str
    taskTitle: Optional[str] = None
    taskDescription: Optional[str] = None
    taskPedagogy: Optional[dict] = None
    studentMessage: str = ""
    currentCode: str = ""
    latestRunResult: Optional[LatestRunResult] = None
    planningData: Optional[PlanningData] = None
    latestPrediction: Optional[str] = None
    hintLevel: Optional[int] = 0
    idleDurationMs: Optional[int] = 0
    conversationId: str
    stage: str
    entryPath: str
    mode: str
    conversation: List[ConversationMessage] = []
    action: str
    studySessionId: Optional[str] = None


# ---------- Response models (mirrors types/tutor.ts::TutorResponse) ----------

class TutorMessage(BaseModel):
    id: str
    role: str = "tutor"
    content: str
    timestamp: str
    stage: str
    actionType: str
    mode: str
    questionType: Optional[str] = None
    hintLevel: int = 0
    learnerState: Optional[dict] = None
    agentTrace: List[dict] = []
    planReview: Optional[dict] = None
    planInteraction: Optional[dict] = None


class TutorResponse(BaseModel):
    message: TutorMessage


class AssessmentScoreRequest(BaseModel):
    taskId: str
    taskTitle: str
    taskDescription: List[str] = []
    plan: dict
    code: str
    runs: List[dict] = []
    reflection: dict = {}
    studySessionId: Optional[str] = None


class AssessmentScoreResponse(BaseModel):
    submitted: bool
    total: Optional[int] = None
    scoringStatus: str


class QuestionSetTaskDefinition(BaseModel):
    id: str
    title: str
    description: str = ""
    planningRequirement: str = "optional"


class QuestionSetScoreRequest(BaseModel):
    questionSetId: str
    questionSetTitle: str
    taskIds: List[str]
    tasks: List[QuestionSetTaskDefinition] = []
    studySessionId: str


class AssessmentPlanRequest(BaseModel):
    taskId: str
    studySessionId: str
    plan: dict


class StudySessionStartRequest(BaseModel):
    userCode: str


class StudySessionStartResponse(BaseModel):
    userId: str
    userCode: str
    studySessionId: str
    resumed: bool = False


class AuthLoginRequest(BaseModel):
    username: str
    password: str


class AuthRegisterRequest(BaseModel):
    username: str
    verificationCode: str
    password: str


class AuthVerificationCodeRequest(BaseModel):
    username: str
    uiLanguage: str = "en"


class AuthDisplayNameRequest(BaseModel):
    displayName: str


class StudyRunRecordRequest(BaseModel):
    taskId: str
    studySessionId: str
    code: str
    result: dict


class StudyDraftRequest(BaseModel):
    taskId: str
    studySessionId: str
    plan: dict
    code: str = ""
    entryPath: Optional[str] = None
    currentStage: str = "plan"


class StudyConversationRequest(BaseModel):
    taskId: str
    studySessionId: str
    messages: List[dict] = []
    stage: str = "plan"
    entryPath: Optional[str] = None


class StudyTaskCompleteRequest(BaseModel):
    taskId: str
    studySessionId: str
    plan: dict
    code: str = ""
    entryPath: Optional[str] = None


# ---------- Code execution models (mirrors types/code-run.ts) ----------

class CodeRunTestCaseInput(BaseModel):
    id: str
    name: Optional[str] = None
    input: Optional[str] = ""
    expectedOutput: Optional[str] = None
    visibility: str = "public"
    misconceptionTag: Optional[str] = None


class CodeRunRequest(BaseModel):
    taskId: str
    code: str
    stdin: str = ""
    testCases: List[CodeRunTestCaseInput] = []
    studySessionId: Optional[str] = None


class TestCaseResultOut(BaseModel):
    id: str
    name: str
    visibility: str = "public"
    input: Optional[str] = None
    expectedOutput: Optional[str] = None
    actualOutput: Optional[str] = None
    passed: bool
    feedback: str
    diagnosticTag: Optional[str] = None


class CodeErrorOut(BaseModel):
    type: str
    title: str
    message: str
    lineNumber: Optional[int] = None
    hint: Optional[str] = None


class CodeRunResponse(BaseModel):
    id: str
    taskId: str
    status: str
    scenario: str
    stdin: str
    stdout: str
    stderr: str
    elapsedMs: int
    createdAt: str
    summary: str
    tests: List[TestCaseResultOut] = []
    error: Optional[CodeErrorOut] = None



# ---------- Agent orchestration ----------

def _build_chat_history(conversation: List[ConversationMessage]) -> str:
    return "\n".join(f"{m.role}: {m.content}" for m in conversation) or "(no messages yet)"


def _is_dialogue_reset_request(message: str) -> bool:
    text = (message or "").lower()
    return any(
        term in text
        for term in (
            "\u91cd\u65b0\u5bf9\u8bdd",
            "\u91cd\u65b0\u8fdb\u884c\u5bf9\u8bdd",
            "\u91cd\u65b0\u5f00\u59cb",
            "\u6362\u4e2a\u95ee\u6cd5",
            "\u522b\u4e00\u76f4",
            "\u4e0d\u8981\u4e00\u76f4",
            "start over",
            "restart",
            "reset",
            "rephrase",
        )
    )


def _resolve_response_language(req: TutorRequest) -> str:
    """Follow the student's latest written language; use the UI as fallback."""
    language_source = req.studentMessage.strip()
    if not language_source:
        language_source = next(
            (
                message.content.strip()
                for message in reversed(req.conversation)
                if message.role == "student" and message.content.strip()
            ),
            "",
        )
    if re.search(r"[\u3400-\u9fff]", language_source):
        return "zh"
    if re.search(r"[A-Za-z]", language_source):
        return "en"
    return "zh" if req.uiLanguage == "zh" else "en"


def get_tutor_content(req: TutorRequest, account_id: str):
    request_started = time.perf_counter()
    task_memory = memory_manager.load_task_memory(account_id, req.taskId)
    try:
        short_term_memory = memory_manager.load_recent_messages(
            account_id,
            req.taskId,
            req.conversationId,
        )
    except Exception as error:
        print(f"Shadow short-term memory read failed: {error}", file=sys.stderr)
        short_term_memory = []
    try:
        user_profile = memory_manager.load_user_profile(account_id)
    except Exception as error:
        print(f"Profile memory read failed: {error}", file=sys.stderr)
        user_profile = None
    has_stable_profile = bool(
        user_profile
        and (
            user_profile.get("programming_level")
            or user_profile.get("known_concepts")
            or user_profile.get("struggling_concepts")
        )
    )
    user_profile_summary = (
        str(user_profile.get("profile_summary") or "")[:500]
        if has_stable_profile
        else ""
    )
    problem = req.taskDescription or req.taskTitle or "the current problem"
    if req.taskPedagogy:
        pedagogy = req.taskPedagogy
        problem = (
            f"{problem}\n\nInternal teaching guide (not student evidence):\n"
            f"Primary concept: {pedagogy.get('primaryConcept', '')}\n"
            f"Secondary concepts: {pedagogy.get('secondaryConcepts', [])}\n"
            f"Expected plan elements: {pedagogy.get('expectedPlanElements', [])}\n"
            f"Common misconceptions: {pedagogy.get('commonMisconceptions', [])}"
        )
    plan_form = {
        "status": req.planningData.status if req.planningData else "",
        "approach": req.planningData.approach if req.planningData else "",
        "steps": req.planningData.steps if req.planningData else [],
    }
    previous_learner_state = next(
        (
            message.learnerState
            for message in reversed(req.conversation)
            if message.learnerState
        ),
        {},
    )
    latest_tutor_question = next(
        (
            message.content
            for message in reversed(req.conversation)
            if message.role == "tutor"
        ),
        "",
    )
    initial_state = {
        "response_language": _resolve_response_language(req),
        "task_id": req.taskId,
        "problem_content": problem,
        "action": req.action,
        "stage": req.stage,
        "entry_path": req.entryPath,
        "mode": req.mode,
        "plan_form": plan_form,
        "student_answer": req.studentMessage,
        "student_code": req.currentCode or "",
        "code_prediction": req.latestPrediction or "",
        "latest_run_status": req.latestRunResult.status if req.latestRunResult else None,
        "latest_run_id": req.latestRunResult.id if req.latestRunResult else None,
        "latest_run_stdout": req.latestRunResult.stdout if req.latestRunResult else None,
        "latest_run_stderr": req.latestRunResult.stderr if req.latestRunResult else None,
        "latest_run_duration_ms": req.latestRunResult.elapsedMs if req.latestRunResult else None,
        "latest_run_tests": req.latestRunResult.tests if req.latestRunResult else [],
        "latest_error_type": (
            req.latestRunResult.error.type
            if req.latestRunResult and req.latestRunResult.error
            else None
        ),
        "latest_error_message": (
            req.latestRunResult.error.message
            if req.latestRunResult and req.latestRunResult.error
            else None
        ),
        "execution_result": "\n".join(
            part for part in [
                f"status: {req.latestRunResult.status}" if req.latestRunResult and req.latestRunResult.status else "",
                f"stdout: {req.latestRunResult.stdout}" if req.latestRunResult and req.latestRunResult.stdout else "",
                f"stderr: {req.latestRunResult.stderr}" if req.latestRunResult and req.latestRunResult.stderr else "",
                f"error: {req.latestRunResult.error.message}" if req.latestRunResult and req.latestRunResult.error and req.latestRunResult.error.message else "",
                (
                    "failed diagnostic tags: "
                    + ", ".join(
                        str(test.get("diagnosticTag"))
                        for test in req.latestRunResult.tests
                        if not test.get("passed", False) and test.get("diagnosticTag")
                    )
                ) if req.latestRunResult and req.latestRunResult.tests else "",
            ] if part
        ),
        "student_reflection": req.studentMessage,
        "messages": [message.model_dump() for message in req.conversation],
        "learner_state": previous_learner_state,
        "latest_tutor_question": latest_tutor_question,
        "prior_learning_focus": previous_learner_state.get("currentFocus"),
        "task_memory": task_memory or {},
        "memory_loaded": task_memory is not None,
        # Only the answer evaluator may consume this; other agents stay isolated.
        "short_term_memory": short_term_memory,
        "short_term_memory_loaded": bool(short_term_memory),
        "user_profile_summary": user_profile_summary,
        "profile_memory_loaded": bool(user_profile_summary),
        "profile_memory_used_by": [],
        "hint_level": req.hintLevel or 0,
        "idle_duration_ms": max(0, req.idleDurationMs or 0),
        "confusion_level": 0,
        "is_stuck": False,
        "code_error_type": "No Error",
        "issue_type": previous_learner_state.get("currentFocus", "logical_error"),
        "agent_trace": [],
    }
    result_state = graph.invoke(initial_state)
    content = (result_state.get("tutor_message") or "").strip()
    if not content:
        raise RuntimeError("The tutor model did not produce a contextual question.")
    question_type = result_state.get("question_type") or "understanding"
    agent_trace = result_state.get("agent_trace", [])

    plan_review = None
    plan_interaction = None
    if req.action in {"review_plan", "understand_problem"} or req.stage == "plan":
        plan_data = {
            "understandingScore": result_state.get("understanding_score", 0),
            "missingSteps": result_state.get("missing_steps", []),
            "canEnterCoding": result_state.get("can_enter_coding", False),
            "action": result_state.get("selected_action"),
            "currentState": result_state.get("current_state"),
            "reasoningSummary": result_state.get("reasoning_summary"),
        }
        if req.studentMessage.strip():
            plan_interaction = {**plan_data, "showReviewCard": False}
        else:
            plan_review = plan_data

    result_state.update({
        "question_type": question_type,
        "learner_state_evidence": result_state.get("learner_state") or previous_learner_state,
        "plan_review_result": plan_interaction or plan_review,
        "model_provider": os.getenv("MODEL_PROVIDER", "openai-compatible"),
        "model_name": scoring_model or "unknown",
        "model_version": os.getenv("MODEL_VERSION") or scoring_model or "unknown",
        "prompt_version": os.getenv("TUTOR_PROMPT_VERSION", "socratic-tutor-v1"),
        "response_latency_ms": round((time.perf_counter() - request_started) * 1000),
        "short_term_memory_count": len(short_term_memory),
    })
    try:
        memory_manager.record_tutor_turn(
            account_id=account_id,
            task_id=req.taskId,
            state=result_state,
            tutor_message=content,
        )
    except Exception as error:
        print(f"Shadow memory write failed: {error}", file=sys.stderr)

    if req.studentMessage.strip():
        latest_student_message = next(
            (message for message in reversed(req.conversation) if message.role == "student"),
            None,
        )
        source_message_id = (
            latest_student_message.id
            if latest_student_message and latest_student_message.id
            else f"{req.conversationId}:{hashlib.sha256(req.studentMessage.encode('utf-8')).hexdigest()[:24]}"
        )
        try:
            memory_manager.record_profile_observation(
                account_id=account_id,
                task_id=req.taskId,
                conversation_id=req.conversationId,
                source_message_id=source_message_id,
                state=result_state,
            )
        except Exception as error:
            print(f"Shadow profile memory write failed: {error}", file=sys.stderr)

    if req.studySessionId:
        log_intervention(
            session_id=req.conversationId,
            task_id=req.taskId,
            state=result_state,
            tutor_question=content,
            study_session_id=req.studySessionId,
        )

    return (
        content,
        question_type,
        agent_trace,
        plan_review,
        plan_interaction,
        result_state.get("hint_level", req.hintLevel or 0),
        result_state.get("learner_state") or previous_learner_state,
    )


def _make_tutor_message(content: str, question_type: str, agent_trace: List[dict], plan_review: Optional[dict], plan_interaction: Optional[dict], hint_level: int, learner_state: Optional[dict], req: TutorRequest) -> TutorMessage:
    return TutorMessage(
        id=f"tutor-{int(time.time() * 1000)}-{random.randint(0, 1000)}",
        role="tutor",
        content=content,
        timestamp=datetime.now(timezone.utc).isoformat(),
        stage=req.stage,
        actionType=req.action,
        mode=req.mode,
        questionType=question_type,
        hintLevel=hint_level,
        learnerState=learner_state,
        agentTrace=agent_trace,
        planReview=plan_review,
        planInteraction=plan_interaction,
    )


# ---------- Code execution ----------

RUN_TIMEOUT_SECONDS = 5.0
MAX_OUTPUT_CHARS = 4000


CODE_EXECUTION_UNAVAILABLE = (
    "Student Python execution is temporarily unavailable while a secure, "
    "isolated code runner is being prepared. Other tutoring features remain available."
)


def _execute_python(code: str, stdin: str, timeout_sec: float = RUN_TIMEOUT_SECONDS) -> dict:
    """Prevent accidental re-enabling of untrusted in-process code execution."""
    raise HTTPException(status_code=503, detail=CODE_EXECUTION_UNAVAILABLE)


def _extract_exception_title(stderr: str) -> Optional[str]:
    lines = [line for line in stderr.strip().splitlines() if line.strip()]
    if not lines:
        return None
    match = re.match(r"([A-Za-z_][A-Za-z0-9_]*Error)\b", lines[-1])
    return match.group(1) if match else None


def _classify_error(stderr: str):
    if "SyntaxError" in stderr or "IndentationError" in stderr:
        error_type = "syntax"
        title = "Syntax Error"
    else:
        error_type = "runtime"
        title = _extract_exception_title(stderr) or "Runtime Error"

    line_number = None
    matches = re.findall(r'File "[^"]+", line (\d+)', stderr)
    if matches:
        line_number = int(matches[-1])

    stripped = stderr.strip()
    message = stripped.splitlines()[-1] if stripped else "An error occurred while running the code."

    return error_type, title, message, line_number


@app.post("/api/code/run", response_model=CodeRunResponse)
def run_code(req: CodeRunRequest):
    raise HTTPException(status_code=503, detail=CODE_EXECUTION_UNAVAILABLE)

    # Retained temporarily so the response models and prior grading behavior can
    # be restored after code execution moves to a dedicated sandbox service.
    run_id = f"run-{int(time.time() * 1000)}-{random.randint(0, 1000)}"
    created_at = datetime.now(timezone.utc).isoformat()

    main_result = _execute_python(req.code, req.stdin)

    if main_result["timedOut"]:
        return CodeRunResponse(
            id=run_id,
            taskId=req.taskId,
            status="timeout",
            scenario="timeout",
            stdin=req.stdin,
            stdout=main_result["stdout"],
            stderr=main_result["stderr"] or "Execution timed out.",
            elapsedMs=main_result["elapsedMs"],
            createdAt=created_at,
            summary="The program took too long to finish. Check whether every loop eventually stops.",
            tests=[],
            error=CodeErrorOut(
                type="timeout",
                title="Time Limit Exceeded",
                message=f"The program did not finish within {RUN_TIMEOUT_SECONDS:.0f} seconds.",
                hint="Check that each loop iteration moves toward a stopping condition.",
            ),
        )

    if main_result["returncode"] not in (0, None) and main_result["stderr"].strip():
        error_type, title, message, line_number = _classify_error(main_result["stderr"])
        return CodeRunResponse(
            id=run_id,
            taskId=req.taskId,
            status="error",
            scenario="syntax_error" if error_type == "syntax" else "runtime_error",
            stdin=req.stdin,
            stdout=main_result["stdout"],
            stderr=main_result["stderr"],
            elapsedMs=main_result["elapsedMs"],
            createdAt=created_at,
            summary=(
                "Python could not understand the code structure yet. Check the line shown below."
                if error_type == "syntax"
                else "The code started running, then stopped because Python found a runtime issue."
            ),
            tests=[],
            error=CodeErrorOut(
                type=error_type,
                title=title,
                message=message,
                lineNumber=line_number,
            ),
        )

    # Main run succeeded. Run any provided test cases against the same code.
    test_results: List[TestCaseResultOut] = []
    for case in req.testCases:
        case_result = _execute_python(req.code, case.input or "")
        actual_output = case_result["stdout"].strip()
        expected_output = (case.expectedOutput or "").strip()
        passed = (
            not case_result["timedOut"]
            and case_result["returncode"] == 0
            and actual_output == expected_output
        )

        if passed:
            feedback = "The output matches the expected result."
        elif case_result["timedOut"]:
            feedback = "Execution timed out for this input."
        elif case_result["returncode"] not in (0, None):
            feedback = "The program raised an error for this input."
        else:
            feedback = "The output does not match the expected result yet."

        test_results.append(
            TestCaseResultOut(
                id=case.id,
                name=case.name or case.id,
                visibility=case.visibility,
                input=case.input if case.visibility == "public" else None,
                expectedOutput=case.expectedOutput if case.visibility == "public" else None,
                actualOutput=actual_output if case.visibility == "public" else None,
                passed=passed,
                feedback=feedback,
                diagnosticTag=case.misconceptionTag,
            )
        )

    all_passed = all(test.passed for test in test_results) if test_results else True
    status = "success" if all_passed else "failed"
    scenario = "success" if all_passed else "failed"

    if test_results:
        passed_count = sum(1 for test in test_results if test.passed)
        summary = (
            f"All {len(test_results)} checks passed."
            if all_passed
            else f"{passed_count} of {len(test_results)} checks passed. Review the differences below."
        )
    else:
        summary = "The program ran without errors."

    return CodeRunResponse(
        id=run_id,
        taskId=req.taskId,
        status=status,
        scenario=scenario,
        stdin=req.stdin,
        stdout=main_result["stdout"],
        stderr=main_result["stderr"],
        elapsedMs=main_result["elapsedMs"],
        createdAt=created_at,
        summary=summary,
        tests=test_results,
        error=None,
    )


# ---------- Routes ----------

@app.get("/health")
def health():
    return {"status": "ok"}


def _hash_password(password: str) -> str:
    iterations = 600_000
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return "pbkdf2_sha256${}${}${}".format(
        iterations,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            base64.urlsafe_b64decode(salt.encode("ascii")),
            int(iterations),
        )
        return hmac.compare_digest(
            base64.urlsafe_b64encode(digest).decode("ascii"),
            expected,
        )
    except (TypeError, ValueError):
        return False


def _auth_user(row: dict) -> dict:
    return {
        "id": row["id"],
        "username": row["username"],
        "usernameType": row["username_type"],
        "displayName": row["display_name"],
        "role": row["role"],
    }


def _issue_auth_token(account_id: str) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    database.table("auth_sessions").insert({
        "id": str(uuid.uuid4()),
        "account_id": account_id,
        "token_hash": hashlib.sha256(token.encode("utf-8")).hexdigest(),
        "created_at": now.isoformat(),
        "expires_at": (now + timedelta(days=30)).isoformat(),
        "last_used_at": now.isoformat(),
    }).execute()
    return token


def _require_account(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Sign in to use the AI Tutor.")
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    sessions = (
        database.table("auth_sessions")
        .select("id,account_id,expires_at")
        .eq("token_hash", token_hash)
        .limit(1)
        .execute()
        .data
    )
    if not sessions:
        raise HTTPException(status_code=401, detail="The login session is invalid.")
    expires_at = datetime.fromisoformat(sessions[0]["expires_at"].replace("Z", "+00:00"))
    if expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="The login session has expired.")
    database.table("auth_sessions").update({
        "last_used_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", sessions[0]["id"]).execute()
    return sessions[0]["account_id"]


def _next_student_display_name() -> str:
    rows = database.table("accounts").select("display_name").execute().data
    sequence_numbers = []
    for row in rows:
        match = re.fullmatch(r"Student (\d+)", row["display_name"] or "")
        if match:
            sequence_numbers.append(int(match.group(1)))
    return f"Student {max(sequence_numbers, default=0) + 1:03d}"


def _start_or_resume_account_study_session(account_id: str) -> StudySessionStartResponse:
    """Give a signed-in account a stable study identity without a U-code."""
    users = (
        database.table("users")
        .select("id,user_code")
        .eq("id", account_id)
        .limit(1)
        .execute()
        .data
    )
    if users:
        user_id = users[0]["id"]
        user_code = users[0]["user_code"]
    else:
        user_id = account_id
        user_code = f"A{account_id.replace('-', '')[:31]}"
        database.table("users").insert({
            "id": user_id,
            "user_code": user_code,
        }).execute()

    active_sessions = (
        database.table("study_sessions")
        .select("id")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("started_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if active_sessions:
        return StudySessionStartResponse(
            userId=user_id,
            userCode=user_code,
            studySessionId=active_sessions[0]["id"],
            resumed=True,
        )

    session_id = str(uuid.uuid4())
    database.table("study_sessions").insert({
        "id": session_id,
        "user_id": user_id,
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "client_version": "account-study-session-v1",
    }).execute()
    return StudySessionStartResponse(
        userId=user_id,
        userCode=user_code,
        studySessionId=session_id,
        resumed=False,
    )


@app.post("/api/auth/register")
def register_account(req: AuthRegisterRequest):
    username = normalize_email(req.username)
    if not username or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Invalid registration details.")
    existing = database.table("accounts").select("id").eq("username", username).limit(1).execute().data
    if existing:
        raise HTTPException(status_code=409, detail="This username is already registered.")
    try:
        verification_record_id = verify_registration_code(username, req.verificationCode)
    except VerificationError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    row = {
        "id": str(uuid.uuid4()),
        "username": username,
        "username_type": "email" if "@" in username else "phone",
        "display_name": _next_student_display_name(),
        "password_hash": _hash_password(req.password),
        "role": "student",
    }
    database.table("accounts").insert(row).execute()
    consume_registration_code(verification_record_id)
    return {
        "success": True,
        "message": "Account created.",
        "user": _auth_user(row),
        "token": _issue_auth_token(row["id"]),
    }


@app.post("/api/auth/verification-code")
def send_auth_verification_code(req: AuthVerificationCodeRequest):
    try:
        send_registration_code(req.username, req.uiLanguage)
    except VerificationError as error:
        raise HTTPException(status_code=error.status_code, detail=error.message) from error
    return {"success": True, "message": "Verification code sent. Check your email."}


@app.post("/api/auth/login")
def login_account(req: AuthLoginRequest):
    username = req.username.strip().lower()
    rows = database.table("accounts").select("*").eq("username", username).limit(1).execute().data
    if not rows or not _verify_password(req.password, rows[0]["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password. Please try again.")
    return {
        "success": True,
        "message": "Signed in.",
        "user": _auth_user(rows[0]),
        "token": _issue_auth_token(rows[0]["id"]),
    }


@app.patch("/api/auth/profile")
def update_auth_profile(req: AuthDisplayNameRequest, request: Request):
    account_id = _require_account(request)
    display_name = re.sub(r"\s+", " ", req.displayName).strip()
    if len(display_name) < 2 or len(display_name) > 30:
        raise HTTPException(status_code=400, detail="Username must be between 2 and 30 characters.")
    database.table("accounts").update({"display_name": display_name}).eq("id", account_id).execute()
    rows = database.table("accounts").select("*").eq("id", account_id).limit(1).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Account not found.")
    return {"success": True, "message": "Username updated.", "user": _auth_user(rows[0])}


@app.get("/health/db")
def database_health():
    details = check_database()
    return {
        "status": "ok",
        "database": details["database_name"],
        "version": details["version"],
    }


def _require_active_study_session(study_session_id: Optional[str]):
    if not study_session_id:
        raise HTTPException(status_code=401, detail="An active study session is required.")
    sessions = (
        database.table("study_sessions")
        .select("id,status")
        .eq("id", study_session_id)
        .eq("status", "active")
        .limit(1)
        .execute()
        .data
    )
    if not sessions:
        raise HTTPException(status_code=401, detail="The study session is not active.")


@app.post("/api/tutor/message", response_model=TutorResponse)
def tutor_message(req: TutorRequest, request: Request):
    account_id = _require_account(request)
    if req.taskId in {"task_1_maximum", "task_4_minimum"}:
        raise HTTPException(
            status_code=403,
            detail="AI Tutor is disabled for this assessment task.",
        )
    content, question_type, agent_trace, plan_review, plan_interaction, hint_level, learner_state = get_tutor_content(req, account_id)
    message = _make_tutor_message(content, question_type, agent_trace, plan_review, plan_interaction, hint_level, learner_state, req)
    try:
        conversation_snapshot = [item.model_dump() for item in req.conversation]
        conversation_snapshot.append(message.model_dump())
        memory_manager.sync_short_term_conversation(
            account_id=account_id,
            task_id=req.taskId,
            conversation_id=req.conversationId,
            messages=conversation_snapshot,
            stage=req.stage,
        )
    except Exception as error:
        print(f"Short-term memory sync failed: {error}", file=sys.stderr)
    return TutorResponse(message=message)


def _extract_json_object(text: str) -> dict:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end < start:
        raise ValueError("Scoring model did not return a JSON object")
    return json.loads(cleaned[start:end + 1])


CT_DIMENSIONS = [
    "decomposition",
    "algorithmic_thinking",
    "abstraction",
    "pattern_recognition",
    "evaluation",
    "debugging",
]

CT_SCORING_RUBRIC = """You are an evidence-based computational-thinking assessment rater. Score only the supplied artifacts and never reward polish without evidence.

Evaluate six dimensions. Give each dimension an integer score from 0 to 5, for a maximum total of 30:
1. decomposition: separates the problem into coherent, executable subproblems or steps.
2. algorithmic_thinking: specifies a correct ordered process, state initialization, traversal, comparison, update, and output.
3. abstraction: identifies essential state and general rules without irrelevant or task-specific clutter.
4. pattern_recognition: identifies or applies reusable patterns across tasks. Do not infer transfer from one correct answer alone.
5. evaluation: predicts or checks behavior, considers examples and edge cases, interprets test outcomes, and verifies requirements.
6. debugging: uses observed failure evidence to locate a cause, makes a targeted revision, and checks whether the revision fixes it. Final correctness alone is not debugging evidence.

Use this scale: 0=no evidence or fundamentally incorrect; 1=minimal fragment; 2=partial with major gaps; 3=adequate core evidence; 4=strong and mostly complete; 5=clear, complete, consistent, and transferable.

The supplied evidence_profile is authoritative. A missing plan on a task whose planning_requirement is optional or not_required must never cause a deduction. Do not equate missing observation with weak ability. If a dimension is marked insufficient_evidence, explain what future evidence is needed rather than inventing a score. Debugging must not be penalized when no failure or revision opportunity was observed.

Return JSON only. For every dimension return: score, summary_en, summary_zh, observations, plan_evidence, code_evidence, run_evidence, deductions, missing_for_next_score_en, missing_for_next_score_zh, and confidence (low/medium/high). Also return overall_strengths_en, overall_strengths_zh, overall_limitations_en, overall_limitations_zh, cross_artifact_consistency, next_steps_en, and next_steps_zh. English and Simplified Chinese fields must express the same evidence-based meaning. Distinguish observation from inference and explicitly state when evidence is unavailable. Do not include chain-of-thought."""


def _normalize_ct_score(
    raw: dict,
    *,
    scope: str,
    evidence_profile: Optional[dict] = None,
) -> dict:
    dimensions = raw.get("dimensions") if isinstance(raw.get("dimensions"), dict) else {}
    evidence_profile = evidence_profile or {
        name: {"status": "scored", "coverage": 1.0, "reason": "Assessment task directly observes this dimension."}
        for name in CT_DIMENSIONS
    }
    normalized = {}
    for name in CT_DIMENSIONS:
        detail = dimensions.get(name) if isinstance(dimensions.get(name), dict) else {}
        evidence = evidence_profile.get(name) or {}
        status = evidence.get("status", "insufficient_evidence")
        coverage = max(0.0, min(1.0, float(evidence.get("coverage", 0) or 0)))
        try:
            dimension_score = int(detail.get("score", detail.get("level", 0)))
        except (TypeError, ValueError):
            dimension_score = 0
        score_value = (
            max(0, min(5, dimension_score))
            if status in {"scored", "provisional"}
            else None
        )
        normalized[name] = {
            **detail,
            "score": score_value,
            "max_score": 5,
            "status": status,
            "evidence_coverage": round(coverage, 2),
            "status_reason": evidence.get("reason", ""),
            "confidence": (
                "low"
                if status in {"insufficient_evidence", "not_applicable"}
                else detail.get("confidence")
                if detail.get("confidence") in {"low", "medium", "high"}
                else "low"
            ),
        }
    assessed = [item for item in normalized.values() if item["score"] is not None]
    total = sum(item["score"] for item in assessed)
    total_max = len(assessed) * 5
    overall_status = (
        "insufficient_evidence"
        if not assessed
        else "scored"
        if len(assessed) == len(CT_DIMENSIONS) and all(item["status"] == "scored" for item in assessed)
        else "provisional"
    )
    return {
        "rubric_version": "ct-rubric-v4-fair-evidence",
        "scoring_model": scoring_model,
        "scoring_status": "scored",
        "scope": scope,
        "dimensions": normalized,
        "total": total,
        "total_max": total_max,
        "percentage": round(total / total_max * 100) if total_max else 0,
        "overall_status": overall_status,
        "assessed_dimensions": len(assessed),
        "total_dimensions": len(CT_DIMENSIONS),
        "overall_strengths": raw.get("overall_strengths") or [],
        "overall_limitations": raw.get("overall_limitations") or [],
        "cross_artifact_consistency": raw.get("cross_artifact_consistency") or "",
        "next_steps": raw.get("next_steps") or [],
        "overall_strengths_en": raw.get("overall_strengths_en") or raw.get("overall_strengths") or [],
        "overall_strengths_zh": raw.get("overall_strengths_zh") or raw.get("overall_strengths") or [],
        "overall_limitations_en": raw.get("overall_limitations_en") or raw.get("overall_limitations") or [],
        "overall_limitations_zh": raw.get("overall_limitations_zh") or raw.get("overall_limitations") or [],
        "next_steps_en": raw.get("next_steps_en") or raw.get("next_steps") or [],
        "next_steps_zh": raw.get("next_steps_zh") or raw.get("next_steps") or [],
        "evidence_policy": "observed_artifacts_only",
    }


def _score_ct_artifacts(
    artifacts: dict,
    *,
    scope: str,
    evidence_profile: Optional[dict] = None,
) -> dict:
    raw = _extract_json_object(
        base_llm_call(CT_SCORING_RUBRIC, json.dumps(artifacts, ensure_ascii=False))
    )
    return _normalize_ct_score(raw, scope=scope, evidence_profile=evidence_profile)


def _coverage_status(coverage: float) -> str:
    if coverage >= 0.6:
        return "scored"
    if coverage >= 0.3:
        return "provisional"
    return "insufficient_evidence"


def _build_ct_evidence_profile(task_artifacts: list[dict]) -> dict:
    task_count = max(1, len(task_artifacts))

    def has_plan(task: dict) -> bool:
        plan = task.get("plan") or {}
        return bool(
            str(plan.get("approach") or "").strip()
            or any(str(step or "").strip() for step in plan.get("steps", []))
        )

    planning_opportunities = [
        task for task in task_artifacts
        if task.get("planning_requirement") == "required" or has_plan(task)
    ]
    plan_evidence_count = sum(1 for task in planning_opportunities if has_plan(task))
    decomposition_coverage = (
        plan_evidence_count / len(planning_opportunities)
        if planning_opportunities
        else 0.0
    )
    code_count = sum(1 for task in task_artifacts if str(task.get("final_code") or "").strip())
    code_coverage = code_count / task_count
    multi_task_code_coverage = code_coverage if code_count >= 2 else 0.0
    run_task_count = sum(1 for task in task_artifacts if task.get("run_history"))
    evaluation_coverage = run_task_count / task_count

    debugging_tasks = 0
    for task in task_artifacts:
        has_failed_run = any(
            str(run.get("status") or "").lower() not in {"", "success", "passed"}
            or bool(run.get("stderr"))
            or bool(run.get("error_type"))
            for run in task.get("run_history", [])
        )
        has_debug_dialogue = any(
            message.get("stage") == "debug"
            for message in task.get("tutor_evidence", [])
        )
        if has_failed_run or has_debug_dialogue:
            debugging_tasks += 1
    debugging_coverage = min(1.0, debugging_tasks / 2)

    raw_profile = {
        "decomposition": {
            "coverage": decomposition_coverage,
            "reason": (
                "Only tasks requiring a plan, or tasks where the learner voluntarily submitted one, count toward decomposition evidence."
                if planning_opportunities
                else "This question set did not require or capture a learner plan, so missing plans are not treated as weak decomposition."
            ),
        },
        "algorithmic_thinking": {
            "coverage": code_coverage,
            "reason": "Coverage is based on completed tasks with observable final code.",
        },
        "abstraction": {
            "coverage": multi_task_code_coverage,
            "reason": "Abstraction needs comparable code evidence from at least two related tasks.",
        },
        "pattern_recognition": {
            "coverage": multi_task_code_coverage,
            "reason": "Pattern recognition is assessed only when at least two related task solutions can be compared.",
        },
        "evaluation": {
            "coverage": evaluation_coverage,
            "reason": "Evaluation evidence comes from recorded runs, tests, predictions, or result checks.",
        },
        "debugging": {
            "coverage": debugging_coverage,
            "reason": (
                "Coverage reflects observed failed runs or debug-stage dialogue."
                if debugging_tasks
                else "No failed run or debug episode was observed; absence of errors is not scored as poor debugging."
            ),
        },
    }
    return {
        name: {**detail, "status": _coverage_status(detail["coverage"])}
        for name, detail in raw_profile.items()
    }


@app.post("/api/assessment/score", response_model=AssessmentScoreResponse)
def score_assessment(req: AssessmentScoreRequest):
    _require_active_study_session(req.studySessionId)
    if req.taskId not in {"task_1_maximum", "task_4_minimum"}:
        raise HTTPException(status_code=403, detail="Scoring is limited to pre/post assessment tasks.")

    artifacts = json.dumps({
        "task_id": req.taskId,
        "title": req.taskTitle,
        "description": req.taskDescription,
        "plan": req.plan,
        "final_code": req.code,
        "run_history": req.runs,
        "student_reflection": req.reflection,
        "required_output_schema": {
            "dimensions": {
                "decomposition": {}, "algorithmic_thinking": {}, "abstraction": {},
                "pattern_recognition": {}, "evaluation": {}, "debugging": {}
            },
            "overall_strengths": [], "overall_limitations": [], "cross_artifact_consistency": "",
        },
    }, ensure_ascii=False)
    try:
        score = _score_ct_artifacts(json.loads(artifacts), scope="single_assessment")
    except Exception as error:
        pending_score = {
            "rubric_version": "ct-rubric-v4-fair-evidence",
            "scoring_model": scoring_model,
            "scoring_status": "pending_model",
            "scoring_error_type": type(error).__name__,
            "dimensions": {},
            "total": None,
            "total_max": 30,
            "evidence_policy": "blind_artifact_only",
        }
        save_assessment_score(
            task_id=req.taskId,
            plan=req.plan,
            code=req.code,
            runs=req.runs,
            score=pending_score,
            study_session_id=req.studySessionId,
        )
        return AssessmentScoreResponse(
            submitted=True,
            total=None,
            scoringStatus="pending_model",
        )
    save_assessment_score(
        task_id=req.taskId,
        plan=req.plan,
        code=req.code,
        runs=req.runs,
        score=score,
        study_session_id=req.studySessionId,
    )
    return AssessmentScoreResponse(
        submitted=True,
        total=score["total"],
        scoringStatus="scored",
    )


def _question_set_score_events(study_session_id: str) -> list[dict]:
    attempts = (
        database.table("task_attempts")
        .select("id")
        .eq("session_id", study_session_id)
        .execute()
        .data
        or []
    )
    attempt_ids = [row["id"] for row in attempts]
    if not attempt_ids:
        return []
    rows = (
        database.table("interaction_events")
        .select("id,attempt_id,metadata,occurred_at")
        .in_("attempt_id", attempt_ids)
        .eq("event_name", "computational_thinking_question_set_score")
        .order("occurred_at", desc=True)
        .execute()
        .data
        or []
    )
    return [row for row in rows if isinstance(row.get("metadata"), dict)]


@app.get("/api/ct-assessment/question-sets")
def get_question_set_scores(studySessionId: str):
    latest_by_question_set = {}
    for row in _question_set_score_events(studySessionId):
        metadata = row["metadata"]
        question_set_id = metadata.get("question_set_id")
        if question_set_id and question_set_id not in latest_by_question_set:
            latest_by_question_set[question_set_id] = metadata
    return {"scores": list(latest_by_question_set.values())}


@app.post("/api/ct-assessment/question-sets")
def score_question_set(req: QuestionSetScoreRequest):
    _require_active_study_session(req.studySessionId)
    task_ids = list(dict.fromkeys(req.taskIds))
    if len(task_ids) < 2:
        raise HTTPException(status_code=400, detail="A question set needs at least two tasks.")

    existing_score = next(
        (
            row["metadata"]
            for row in _question_set_score_events(req.studySessionId)
            if row["metadata"].get("question_set_id") == req.questionSetId
            and row["metadata"].get("rubric_version") == "ct-rubric-v4-fair-evidence"
        ),
        None,
    )
    if existing_score:
        return {"score": existing_score, "cached": True}

    attempts = (
        database.table("task_attempts")
        .select("id,task_id,student_plan,final_code,planning_revision_count,code_attempt_count,completed_at")
        .eq("session_id", req.studySessionId)
        .in_("task_id", task_ids)
        .eq("status", "completed")
        .execute()
        .data
        or []
    )
    completed_ids = {row["task_id"] for row in attempts}
    missing = [task_id for task_id in task_ids if task_id not in completed_ids]
    if missing:
        raise HTTPException(
            status_code=409,
            detail="Complete every task in the question set before generating a score.",
        )

    attempt_ids = [row["id"] for row in attempts]
    runs = (
        database.table("code_runs")
        .select("attempt_id,run_number,status,stdout,stderr,error_type,passed_tests,total_tests,test_results,created_at")
        .in_("attempt_id", attempt_ids)
        .order("created_at")
        .execute()
        .data
        or []
    )
    messages = (
        database.table("tutor_messages")
        .select("attempt_id,role,content,stage,answer_quality,current_focus,learner_state_evidence,created_at")
        .in_("attempt_id", attempt_ids)
        .order("created_at")
        .limit(120)
        .execute()
        .data
        or []
    )
    definitions = {item.id: item for item in req.tasks}
    runs_by_attempt: dict[str, list] = {}
    messages_by_attempt: dict[str, list] = {}
    for run in runs:
        runs_by_attempt.setdefault(run["attempt_id"], []).append(run)
    for message in messages:
        compact = {**message, "content": str(message.get("content") or "")[:800]}
        messages_by_attempt.setdefault(message["attempt_id"], []).append(compact)

    task_artifacts = []
    for attempt in attempts:
        definition = definitions.get(attempt["task_id"])
        task_artifacts.append({
            "task_id": attempt["task_id"],
            "title": definition.title if definition else attempt["task_id"],
            "description": definition.description if definition else "",
            "planning_requirement": (
                definition.planningRequirement
                if definition and definition.planningRequirement in {"required", "optional", "not_required"}
                else "optional"
            ),
            "plan": attempt.get("student_plan") or {},
            "final_code": attempt.get("final_code") or "",
            "planning_revision_count": attempt.get("planning_revision_count") or 0,
            "code_attempt_count": attempt.get("code_attempt_count") or 0,
            "run_history": runs_by_attempt.get(attempt["id"], []),
            "tutor_evidence": messages_by_attempt.get(attempt["id"], [])[-30:],
        })

    evidence_profile = _build_ct_evidence_profile(task_artifacts)
    try:
        score = _score_ct_artifacts(
            {
                "question_set_id": req.questionSetId,
                "question_set_title": req.questionSetTitle,
                "task_count": len(task_artifacts),
                "tasks": task_artifacts,
                "evidence_profile": evidence_profile,
                "required_output_schema": {
                    "dimensions": {name: {} for name in CT_DIMENSIONS},
                    "overall_strengths": [],
                    "overall_limitations": [],
                    "cross_artifact_consistency": "",
                    "next_steps": [],
                    "overall_strengths_en": [],
                    "overall_strengths_zh": [],
                    "overall_limitations_en": [],
                    "overall_limitations_zh": [],
                    "next_steps_en": [],
                    "next_steps_zh": [],
                },
            },
            scope="question_set",
            evidence_profile=evidence_profile,
        )
    except Exception as error:
        print(f"Question-set CT scoring failed: {type(error).__name__}", file=sys.stderr)
        raise HTTPException(status_code=503, detail="The CT scoring model is temporarily unavailable.")

    score.update({
        "question_set_id": req.questionSetId,
        "question_set_title": req.questionSetTitle,
        "task_ids": task_ids,
        "task_count": len(task_ids),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    })
    anchor = max(attempts, key=lambda row: str(row.get("completed_at") or ""))
    event_id = str(uuid.uuid5(
        uuid.NAMESPACE_URL,
        f"ct-question-set:{req.studySessionId}:{req.questionSetId}:ct-rubric-v4-fair-evidence",
    ))
    database.table("interaction_events").upsert({
        "id": event_id,
        "attempt_id": anchor["id"],
        "sequence_number": 900000,
        "event_name": "computational_thinking_question_set_score",
        "stage": "reflect",
        "metadata": score,
        "occurred_at": score["generated_at"],
    }).execute()
    return {"score": score, "cached": False}


@app.get("/api/memory/debug")
def memory_debug(request: Request, task_id: str, conversation_id: str):
    account_id = _require_account(request)
    recent_messages = memory_manager.load_recent_messages(
        account_id,
        task_id,
        conversation_id,
    )
    profile = memory_manager.load_user_profile(account_id)
    concept_masteries = memory_manager.profile_memory.get_concept_masteries(account_id)
    score_events = memory_manager.profile_memory.get_score_events(account_id)
    observations = (
        database.table("profile_observations")
        .select("id,task_id,conversation_id,observation_type,concept,value,confidence,evidence,status,created_at")
        .eq("account_id", account_id)
        .eq("task_id", task_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
        .data
    )
    events = (
        database.table("memory_events")
        .select("id,memory_type,event_name,evidence,created_at")
        .eq("account_id", account_id)
        .eq("task_id", task_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
        .data
    )
    usage_event = next(
        (
            event
            for event in events
            if event["memory_type"] == "task_memory"
            and isinstance(event.get("evidence"), dict)
        ),
        None,
    )
    return {
        "task_id": task_id,
        "conversation_id": conversation_id,
        "short_term_messages": recent_messages,
        "profile": profile,
        "concept_masteries": concept_masteries,
        "score_events": score_events,
        "profile_observations": observations,
        "latest_usage": usage_event,
        "recent_events": events,
    }
    save_assessment_score(
        task_id=req.taskId, plan=req.plan, code=req.code, runs=req.runs,
        score=score, study_session_id=req.studySessionId,
    )
    return AssessmentScoreResponse(
        submitted=True,
        total=total,
        scoringStatus="scored",
    )


@app.post("/api/study/session/start", response_model=StudySessionStartResponse)
def start_study_session(req: StudySessionStartRequest):
    user_code = req.userCode.strip().upper()
    if not re.fullmatch(r"U\d{3}", user_code):
        raise HTTPException(status_code=400, detail="Participant code must use the format U001.")
    existing = database.table("users").select("id,user_code").eq("user_code", user_code).limit(1).execute().data
    if existing:
        user_id = existing[0]["id"]
    else:
        user_id = str(uuid.uuid4())
        database.table("users").insert({
            "id": user_id,
            "user_code": user_code,
        }).execute()

    previous_sessions = (
        database.table("study_sessions")
        .select("id,status")
        .eq("user_id", user_id)
        .order("started_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    if previous_sessions:
        return StudySessionStartResponse(
            userId=user_id,
            userCode=user_code,
            studySessionId=previous_sessions[0]["id"],
            resumed=True,
        )

    session_id = str(uuid.uuid4())
    database.table("study_sessions").insert({
        "id": session_id,
        "user_id": user_id,
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "client_version": "study-v2-agent-trace",
    }).execute()
    return StudySessionStartResponse(
        userId=user_id,
        userCode=user_code,
        studySessionId=session_id,
        resumed=False,
    )


@app.post("/api/study/session/account", response_model=StudySessionStartResponse)
def start_account_study_session(request: Request):
    account_id = _require_account(request)
    return _start_or_resume_account_study_session(account_id)


@app.post("/api/study/run")
def record_study_run(req: StudyRunRecordRequest):
    # Execution happens in an isolated browser worker. The backend only stores
    # the already-produced result and never evaluates the submitted code.
    _require_active_study_session(req.studySessionId)
    save_code_run(
        task_id=req.taskId,
        code=req.code,
        result=req.result,
        study_session_id=req.studySessionId,
    )
    return {"saved": True}


@app.post("/api/study/draft")
def sync_study_draft(req: StudyDraftRequest):
    save_task_draft(
        task_id=req.taskId,
        plan=req.plan,
        code=req.code,
        entry_path=req.entryPath,
        current_stage=req.currentStage,
        study_session_id=req.studySessionId,
    )
    return {"saved": True}


@app.post("/api/study/task/complete")
def complete_task(req: StudyTaskCompleteRequest):
    _require_active_study_session(req.studySessionId)
    if req.taskId in {"task_1_maximum", "task_4_minimum"}:
        raise HTTPException(status_code=403, detail="Assessment tasks must use the assessment submission flow.")
    try:
        complete_study_task(
            task_id=req.taskId,
            plan=req.plan,
            code=req.code,
            entry_path=req.entryPath,
            study_session_id=req.studySessionId,
        )
    except Exception as error:
        reference = uuid.uuid4().hex[:10]
        print(
            f"TASK_COMPLETION_FAILED reference={reference} "
            f"error_type={type(error).__name__} error={error}",
            file=sys.stderr,
            flush=True,
        )
        raise HTTPException(
            status_code=500,
            detail=(
                "The learning record could not be saved. "
                f"Check the backend log reference {reference}."
            ),
        ) from error
    return {"completed": True}


@app.get("/api/study/progress")
def get_study_progress(studySessionId: str):
    response = (
        database.table("task_attempts")
        .select(
            "task_id,status,current_stage,entry_path,student_plan,final_code,"
            "planning_revision_count,code_attempt_count,completed_at"
        )
        .eq("session_id", studySessionId)
        .execute()
    )
    return {"attempts": response.data or []}


@app.post("/api/study/conversation")
def sync_study_conversation(req: StudyConversationRequest):
    save_tutor_conversation_snapshot(
        task_id=req.taskId,
        messages=req.messages,
        stage=req.stage,
        entry_path=req.entryPath,
        study_session_id=req.studySessionId,
    )
    return {"saved": True, "messageCount": len(req.messages)}


@app.post("/api/assessment/plan")
def submit_assessment_plan(req: AssessmentPlanRequest):
    if req.taskId not in {"task_1_maximum", "task_4_minimum"}:
        raise HTTPException(status_code=403, detail="Plan locking is limited to assessment tasks.")
    locked = save_assessment_plan(
        task_id=req.taskId, plan=req.plan, study_session_id=req.studySessionId,
    )
    return {"saved": True, "lockedAt": locked["lockedAt"]}

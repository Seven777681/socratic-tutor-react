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
import random
import re
import json
import subprocess
import sys
import tempfile
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name(".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from study_logger import log_intervention, save_assessment_plan, save_assessment_score, save_code_run, save_task_draft, save_tutor_conversation_snapshot
from llm_base import base_llm_call, model as scoring_model

from tutor_graph import graph

from supabase import create_client, Client

# 读取.env文件
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# 创建supabase客户端（拥有最高权限）
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)




app = FastAPI(title="Socratic Tutor Backend")

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


def get_tutor_content(req: TutorRequest):
    request_started = time.perf_counter()
    if _is_dialogue_reset_request(req.studentMessage):
        return (
            "可以，我们先换一种方式。你现在先不用追踪例子，只看代码：你想先完成“保存第一个数”，还是“比较后面的数”？",
            "understanding",
            [],
            None,
            None,
            max(0, min(2, req.hintLevel or 0)),
            {"currentFocus": "coding_progress", "attemptsOnFocus": 0, "consecutiveOffTarget": 0},
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
        "hint_level": req.hintLevel or 0,
        "confusion_level": 0,
        "is_stuck": False,
        "code_error_type": "No Error",
        "issue_type": previous_learner_state.get("currentFocus", "logical_error"),
        "agent_trace": [],
    }
    result_state = graph.invoke(initial_state)
    content = result_state.get("tutor_message") or "你接下来准备怎么做？"
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
    })
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


def _execute_python(code: str, stdin: str, timeout_sec: float = RUN_TIMEOUT_SECONDS) -> dict:
    """Run student code as a real Python subprocess and capture the result."""
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, encoding="utf-8"
    ) as tmp_file:
        tmp_file.write(code)
        script_path = tmp_file.name

    start = time.time()
    try:
        try:
            proc = subprocess.run(
                [sys.executable, "-I", script_path],
                input=stdin,
                capture_output=True,
                text=True,
                timeout=timeout_sec,
            )
            elapsed_ms = int((time.time() - start) * 1000)
            return {
                "stdout": proc.stdout[-MAX_OUTPUT_CHARS:],
                "stderr": proc.stderr[-MAX_OUTPUT_CHARS:],
                "returncode": proc.returncode,
                "elapsedMs": elapsed_ms,
                "timedOut": False,
            }
        except subprocess.TimeoutExpired as exc:
            elapsed_ms = int((time.time() - start) * 1000)
            stdout = exc.stdout or ""
            stderr = exc.stderr or ""
            if isinstance(stdout, bytes):
                stdout = stdout.decode("utf-8", "replace")
            if isinstance(stderr, bytes):
                stderr = stderr.decode("utf-8", "replace")
            return {
                "stdout": stdout[-MAX_OUTPUT_CHARS:],
                "stderr": stderr[-MAX_OUTPUT_CHARS:],
                "returncode": None,
                "elapsedMs": elapsed_ms,
                "timedOut": True,
            }
    finally:
        try:
            os.unlink(script_path)
        except OSError:
            pass


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


@app.get("/health/db")
def database_health():
    response = supabase.table("tasks").select("id", count="exact").limit(1).execute()
    return {
        "status": "ok",
        "table": "tasks",
        "count": response.count,
    }


@app.post("/api/tutor/message", response_model=TutorResponse)
def tutor_message(req: TutorRequest):
    if req.taskId in {"task_1_maximum", "task_5_minimum"}:
        raise HTTPException(
            status_code=403,
            detail="AI Tutor is disabled for this assessment task.",
        )
    content, question_type, agent_trace, plan_review, plan_interaction, hint_level, learner_state = get_tutor_content(req)
    message = _make_tutor_message(content, question_type, agent_trace, plan_review, plan_interaction, hint_level, learner_state, req)
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


@app.post("/api/assessment/score", response_model=AssessmentScoreResponse)
def score_assessment(req: AssessmentScoreRequest):
    if req.taskId not in {"task_1_maximum", "task_5_minimum"}:
        raise HTTPException(status_code=403, detail="Scoring is limited to pre/post assessment tasks.")

    rubric = """You are a blind computational-thinking assessment rater. You do not know whether this is a pre-test or post-test. Score only the supplied artifacts and never reward polish without evidence.

Evaluate six dimensions. Give each dimension an integer score from 0 to 5, for a maximum total of 30:
1. decomposition: separates the problem into coherent, executable subproblems or steps.
2. algorithmic_thinking: specifies a correct ordered process, state initialization, traversal, comparison, update, and output.
3. abstraction: identifies the essential state and general rule without irrelevant or task-specific clutter.
4. pattern_recognition: identifies or applies the reusable traverse/compare/update pattern; do not infer prior-task knowledge merely from a correct answer.
5. evaluation: predicts or checks behavior, considers examples and edge cases, interprets test outcomes, and verifies that output meets requirements.
6. debugging: uses observed failure evidence to locate a cause, makes a targeted revision, and checks whether the revision fixes the issue. Final correctness alone is not debugging evidence. If no failure or revision is observable, explicitly state that debugging evidence is unavailable rather than inventing it.

Use this common scoring scale for every dimension: 0=no evidence or fundamentally incorrect; 1=minimal fragment; 2=partial but major gaps; 3=adequate core evidence with some gaps; 4=strong and mostly complete evidence; 5=clear, complete, consistent, and well-supported evidence.

Return JSON only. For every dimension return: score, summary, observations (specific behaviors), plan_evidence (short exact excerpts or precise absence), code_evidence (specific variables/conditions/lines described), run_evidence (test outcomes and changes), deductions (each with reason and point impact), missing_for_next_score, and confidence (low/medium/high). Detailed evidence must explain both awarded credit and deductions, distinguish observed evidence from inference, and state when evidence is unavailable. Do not include chain-of-thought."""
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
        raw = _extract_json_object(base_llm_call(rubric, artifacts))
    except Exception as error:
        pending_score = {
            "rubric_version": "ct-rubric-v2-six-dimensions",
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
    dimensions = raw.get("dimensions") or {}
    required = ["decomposition", "algorithmic_thinking", "abstraction", "pattern_recognition", "evaluation", "debugging"]
    normalized = {}
    for name in required:
        detail = dimensions.get(name) if isinstance(dimensions.get(name), dict) else {}
        dimension_score = max(0, min(5, int(detail.get("score", detail.get("level", 0)))))
        normalized[name] = {**detail, "score": dimension_score, "max_score": 5}
    total = sum(item["score"] for item in normalized.values())
    score = {
        "rubric_version": "ct-rubric-v2-six-dimensions",
        "scoring_model": scoring_model,
        "scoring_status": "scored",
        "dimensions": normalized,
        "total": total,
        "total_max": 30,
        "overall_strengths": raw.get("overall_strengths") or [],
        "overall_limitations": raw.get("overall_limitations") or [],
        "cross_artifact_consistency": raw.get("cross_artifact_consistency") or "",
        "evidence_policy": "blind_artifact_only",
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
    existing = supabase.table("users").select("id,user_code").eq("user_code", user_code).limit(1).execute().data
    if existing:
        user_id = existing[0]["id"]
    else:
        user_id = str(uuid.uuid4())
        supabase.table("users").insert({
            "id": user_id,
            "user_code": user_code,
        }).execute()

    active_sessions = (
        supabase.table("study_sessions")
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
    supabase.table("study_sessions").insert({
        "id": session_id,
        "user_id": user_id,
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "client_version": "study-v1",
    }).execute()
    return StudySessionStartResponse(
        userId=user_id,
        userCode=user_code,
        studySessionId=session_id,
        resumed=False,
    )


@app.post("/api/study/run")
def record_study_run(req: StudyRunRecordRequest):
    save_code_run(task_id=req.taskId, code=req.code, result=req.result, study_session_id=req.studySessionId)
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


@app.get("/api/study/progress")
def get_study_progress(studySessionId: str):
    response = (
        supabase.table("task_attempts")
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
    if req.taskId not in {"task_1_maximum", "task_5_minimum"}:
        raise HTTPException(status_code=403, detail="Plan locking is limited to assessment tasks.")
    locked = save_assessment_plan(
        task_id=req.taskId, plan=req.plan, study_session_id=req.studySessionId,
    )
    return {"saved": True, "lockedAt": locked["lockedAt"]}

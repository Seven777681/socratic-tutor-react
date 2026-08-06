"""
FastAPI HTTP layer for isolated Python code execution and optional legacy
tutor-agent experiments.

Run locally with:
    cd socratic_backend
    uvicorn server:app --reload --port 8000

The active tutor workflow runs in Next.js through LangGraph.js. The Next.js
route at app/api/code/run/route.ts proxies code execution requests here.
"""

import os
import random
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    status: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    error: Optional[RunResultError] = None


class PlanningData(BaseModel):
    status: Optional[str] = None
    approach: Optional[str] = None
    steps: Optional[List[str]] = None


class ConversationMessage(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    timestamp: Optional[str] = None


class TutorRequest(BaseModel):
    taskId: str
    taskTitle: Optional[str] = None
    taskDescription: Optional[str] = None
    studentMessage: str = ""
    currentCode: str = ""
    latestRunResult: Optional[LatestRunResult] = None
    planningData: Optional[PlanningData] = None
    latestPrediction: Optional[str] = None
    hintLevel: Optional[int] = 0
    conversationId: str
    stage: str
    mode: str
    conversation: List[ConversationMessage] = []
    action: str


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


class TutorResponse(BaseModel):
    message: TutorMessage


# ---------- Code execution models (mirrors types/code-run.ts) ----------

class CodeRunTestCaseInput(BaseModel):
    id: str
    name: Optional[str] = None
    input: Optional[str] = ""
    expectedOutput: Optional[str] = None


class CodeRunRequest(BaseModel):
    taskId: str
    code: str
    stdin: str = ""
    testCases: List[CodeRunTestCaseInput] = []


class TestCaseResultOut(BaseModel):
    id: str
    name: str
    visibility: str = "public"
    input: Optional[str] = None
    expectedOutput: Optional[str] = None
    actualOutput: Optional[str] = None
    passed: bool
    feedback: str


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


def get_tutor_content(req: TutorRequest):
    # The Next.js application currently runs the production Tutor Graph.
    # Keep this legacy Python tutor endpoint usable for experiments, but load
    # its LLM dependencies only when the endpoint is actually called. This lets
    # the code-execution API start and run without an API key.
    from agent_services import run_agent1, run_agent2, run_agent3, run_agent4, run_agent5

    problem = req.taskDescription or req.taskTitle or "the current problem"
    code = req.currentCode or ""
    chat_history = _build_chat_history(req.conversation)

    # Stage/action: Plan review -> Agent 1
    if req.action == "review_plan" or req.stage == "plan":
        approach = (req.planningData.approach if req.planningData else "") or ""
        steps = (
            "\n".join(req.planningData.steps)
            if req.planningData and req.planningData.steps
            else ""
        )
        result = run_agent1(problem, approach, steps)
        content = result.get("guide_question") or "Tell me more about your current plan."
        return content, "decomposition"

    # Reflection summary -> Agent 5
    if req.action == "generate_reflection_summary":
        result = run_agent5(
            problem=problem,
            code=code,
            error_records=[],
            chat_history=chat_history,
            reflection_text=req.studentMessage,
        )
        return result.get("summary", ""), "reflection"

    # Default coding/debug flow -> Agent 3 (analysis) -> Agent 4 (monitor) -> Agent 2 (dialogue)
    error_type = "No Error"
    if code.strip():
        predicted_output = req.latestPrediction or ""
        analysis = run_agent3(problem, code, predicted_output)
        error_type = analysis.get("error_type", "No Error")

    error_records = [error_type] if error_type != "No Error" else []
    monitor = run_agent4(chat_history, error_records, idle_over_1min=False)
    confusion_level = monitor.get("confusion_level", 0)
    is_stuck = monitor.get("is_stuck", False)

    hint_level = req.hintLevel or 0
    if is_stuck and hint_level < 3:
        hint_level += 1

    dialogue = run_agent2(
        problem=problem,
        code=code,
        error_type=error_type,
        confusion_level=confusion_level,
        is_stuck=is_stuck,
        hint_level=hint_level,
        chat_history=chat_history,
    )
    content = dialogue.get("question", "")

    if error_type != "No Error":
        question_type = "debugging"
    elif req.stage == "reflect":
        question_type = "reflection"
    else:
        question_type = "understanding"

    return content, question_type


def _make_tutor_message(content: str, question_type: str, req: TutorRequest) -> TutorMessage:
    return TutorMessage(
        id=f"tutor-{int(time.time() * 1000)}-{random.randint(0, 1000)}",
        role="tutor",
        content=content,
        timestamp=datetime.now(timezone.utc).isoformat(),
        stage=req.stage,
        actionType=req.action,
        mode=req.mode,
        questionType=question_type,
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
                visibility="public",
                input=case.input,
                expectedOutput=case.expectedOutput,
                actualOutput=actual_output,
                passed=passed,
                feedback=feedback,
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


@app.post("/api/tutor/message", response_model=TutorResponse)
def tutor_message(req: TutorRequest):
    content, question_type = get_tutor_content(req)
    message = _make_tutor_message(content, question_type, req)
    return TutorResponse(message=message)

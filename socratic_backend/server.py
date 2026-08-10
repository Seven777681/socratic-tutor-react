"""
FastAPI HTTP layer for isolated Python code execution.

Run locally with:
    cd socratic_backend
    uvicorn server:app --reload --port 8001

The only tutor workflow runs in Next.js through LangGraph.js. This service is
deliberately limited to code execution so there is one authoritative Agent
graph and one state contract.
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

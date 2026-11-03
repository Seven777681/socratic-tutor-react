import type {
  CodeExecutionError,
  CodeRunResult,
  TestCaseResult,
} from "@/types/code-run";

export interface RunCodeTestCase {
  id: string;
  name?: string;
  input?: string;
  expectedOutput?: string;
  visibility?: "public" | "hidden";
  misconceptionTag?: string;
}

export interface RunCodeInput {
  taskId: string;
  code: string;
  stdin: string;
  testCases?: RunCodeTestCase[];
}

interface WorkerExecution {
  ok: boolean;
  stdout: string;
  stderr: string;
  elapsedMs: number;
}

interface WorkerResultMessage {
  type: "result";
  requestId: string;
  main: WorkerExecution;
  tests: Array<{ testCase: RunCodeTestCase; execution: WorkerExecution }>;
}

const INITIALIZATION_TIMEOUT_MS = 45000;
const EXECUTION_TIMEOUT_MS = 8000;

let worker: Worker | undefined;
let readyPromise: Promise<void> | undefined;
let readyResolve: (() => void) | undefined;
let readyReject: ((error: Error) => void) | undefined;
const pendingRuns = new Map<
  string,
  {
    resolve: (message: WorkerResultMessage) => void;
    reject: (error: Error) => void;
    timeoutId: number;
  }
>();

function buildRunId(prefix = "run") {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function resetWorker(error?: Error) {
  worker?.terminate();
  worker = undefined;
  readyPromise = undefined;
  readyResolve = undefined;
  readyReject = undefined;
  for (const pending of pendingRuns.values()) {
    window.clearTimeout(pending.timeoutId);
    pending.reject(error || new Error("Python runner was reset."));
  }
  pendingRuns.clear();
}

function getWorker() {
  if (worker && readyPromise) return { worker, readyPromise };

  worker = new Worker("/python-runner.worker.js");
  readyPromise = new Promise<void>((resolve, reject) => {
    readyResolve = resolve;
    readyReject = reject;
    window.setTimeout(
      () => reject(new Error("Python runtime initialization timed out.")),
      INITIALIZATION_TIMEOUT_MS,
    );
  });

  worker.onmessage = (event: MessageEvent) => {
    const message = event.data;
    if (message?.type === "ready") {
      readyResolve?.();
      return;
    }
    if (message?.type === "initialization-error") {
      const error = new Error(message.message || "Python runtime failed to load.");
      readyReject?.(error);
      resetWorker(error);
      return;
    }
    if (message?.type === "result" || message?.type === "runner-error") {
      const pending = pendingRuns.get(message.requestId);
      if (!pending) return;
      window.clearTimeout(pending.timeoutId);
      pendingRuns.delete(message.requestId);
      if (message.type === "result") pending.resolve(message as WorkerResultMessage);
      else pending.reject(new Error(message.message || "Python runner failed."));
    }
  };

  worker.onerror = (event) => {
    const error = new Error(event.message || "Python runner worker failed.");
    readyReject?.(error);
    resetWorker(error);
  };

  return { worker, readyPromise };
}

async function executeInBrowser(input: RunCodeInput): Promise<WorkerResultMessage> {
  const runner = getWorker();
  await runner.readyPromise;
  const requestId = buildRunId("request");
  return new Promise<WorkerResultMessage>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      resetWorker(new Error("EXECUTION_TIMEOUT"));
    }, EXECUTION_TIMEOUT_MS);
    pendingRuns.set(requestId, { resolve, reject, timeoutId });
    runner.worker.postMessage({ type: "run", requestId, ...input });
  });
}

function classifyError(stderr: string): CodeExecutionError {
  const syntax = /(?:SyntaxError|IndentationError|TabError):/.test(stderr);
  const titleMatch = stderr.match(/([A-Za-z]+Error):/g);
  const lineMatch = stderr.match(/File "<student-code>", line (\d+)/g);
  const lastLine = stderr.trim().split("\n").at(-1) || "Python stopped with an error.";
  const lineNumber = lineMatch?.at(-1)?.match(/(\d+)/)?.[1];
  return {
    type: syntax ? "syntax" : "runtime",
    title: titleMatch?.at(-1)?.replace(":", "") || (syntax ? "Syntax Error" : "Runtime Error"),
    message: lastLine,
    lineNumber: lineNumber ? Number(lineNumber) : undefined,
  };
}

function toTestResult(testCase: RunCodeTestCase, execution: WorkerExecution): TestCaseResult {
  const visibility = testCase.visibility || "public";
  const actualOutput = execution.stdout.trim();
  const expectedOutput = (testCase.expectedOutput || "").trim();
  const passed = execution.ok && actualOutput === expectedOutput;
  return {
    id: testCase.id,
    name: testCase.name || testCase.id,
    visibility,
    input: visibility === "public" ? testCase.input : undefined,
    expectedOutput: visibility === "public" ? testCase.expectedOutput : undefined,
    actualOutput: visibility === "public" ? actualOutput : undefined,
    passed,
    feedback: passed
      ? "The output matches the expected result."
      : execution.ok
        ? "The output does not match the expected result yet."
        : "The program raised an error for this input.",
    diagnosticTag: testCase.misconceptionTag,
  };
}

async function persistRun(input: RunCodeInput, result: CodeRunResult) {
  const studySessionId = window.sessionStorage.getItem("socratic-study-session-id");
  if (!studySessionId) return;
  try {
    const response = await fetch("/api/study/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: input.taskId,
        studySessionId,
        code: input.code,
        result,
      }),
      keepalive: true,
    });
    if (!response.ok) console.warn("Code run could not be persisted.");
  } catch (error) {
    console.warn("Code run could not be persisted.", error);
  }
}

export async function runCode(input: RunCodeInput): Promise<CodeRunResult> {
  const createdAt = new Date().toISOString();
  const id = buildRunId();
  try {
    const workerResult = await executeInBrowser(input);
    const { main } = workerResult;
    let result: CodeRunResult;

    if (!main.ok) {
      const error = classifyError(main.stderr);
      result = {
        id,
        taskId: input.taskId,
        status: "error",
        scenario: error.type === "syntax" ? "syntax_error" : "runtime_error",
        stdin: input.stdin,
        stdout: main.stdout,
        stderr: main.stderr,
        elapsedMs: main.elapsedMs,
        createdAt,
        summary:
          error.type === "syntax"
            ? "Python could not understand the code structure yet. Check the line shown below."
            : "The code started running, then stopped because Python found a runtime issue.",
        tests: [],
        error,
      };
    } else {
      const tests = workerResult.tests.map(({ testCase, execution }) =>
        toTestResult(testCase, execution),
      );
      const allPassed = tests.every((test) => test.passed);
      const passedCount = tests.filter((test) => test.passed).length;
      result = {
        id,
        taskId: input.taskId,
        status: allPassed ? "success" : "failed",
        scenario: allPassed ? "success" : "failed",
        stdin: input.stdin,
        stdout: main.stdout,
        stderr: main.stderr,
        elapsedMs:
          main.elapsedMs + workerResult.tests.reduce((total, item) => total + item.execution.elapsedMs, 0),
        createdAt,
        summary: tests.length
          ? allPassed
            ? `All ${tests.length} checks passed.`
            : `${passedCount} of ${tests.length} checks passed. Review the differences below.`
          : "The program ran without errors.",
        tests,
      };
    }

    void persistRun(input, result);
    return result;
  } catch (error) {
    const timedOut = error instanceof Error && error.message === "EXECUTION_TIMEOUT";
    const result: CodeRunResult = {
      id,
      taskId: input.taskId,
      status: timedOut ? "timeout" : "system_error",
      scenario: timedOut ? "timeout" : "system_error",
      stdin: input.stdin,
      stdout: "",
      stderr: timedOut
        ? "Execution timed out."
        : error instanceof Error
          ? error.message
          : "Unknown Python runner error",
      elapsedMs: timedOut ? EXECUTION_TIMEOUT_MS : 0,
      createdAt,
      summary: timedOut
        ? "The program took too long to finish. Check whether every loop eventually stops."
        : "The browser Python runtime could not be loaded. Check the network and try again.",
      tests: [],
      error: {
        type: timedOut ? "timeout" : "system",
        title: timedOut ? "Time Limit Exceeded" : "Python Runtime Unavailable",
        message: timedOut
          ? "The program did not finish within 8 seconds."
          : "The browser could not start the isolated Python runtime.",
        hint: timedOut
          ? "Check that each loop iteration moves toward a stopping condition."
          : "Refresh the page and make sure cdn.jsdelivr.net is reachable.",
      },
    };
    void persistRun(input, result);
    return result;
  }
}

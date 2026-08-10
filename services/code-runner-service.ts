import type { CodeRunResult } from "@/types/code-run";

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

function buildRunId() {
  return `run-error-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Sends the student's code to the Python execution backend
 * (via the Next.js /api/code/run proxy) and returns the real result.
 * Falls back to a "system_error" result if the backend cannot be reached,
 * instead of leaving the UI stuck.
 */
export async function runCode({
  taskId,
  code,
  stdin,
  testCases = [],
}: RunCodeInput): Promise<CodeRunResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, code, stdin, testCases }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Code run request failed with status ${response.status}`);
    }

    return (await response.json()) as CodeRunResult;
  } catch (error) {
    const timedOut = isAbortError(error);

    return {
      id: buildRunId(),
      taskId,
      status: "system_error",
      scenario: "system_error",
      stdin,
      stdout: "",
      stderr: timedOut
        ? "The code execution request timed out."
        : error instanceof Error
          ? error.message
          : "Unknown error",
      elapsedMs: 0,
      createdAt: new Date().toISOString(),
      summary:
        timedOut
          ? "The code execution service did not respond in time. Your code may not have run."
          : "The code execution service is unavailable. Your code was not executed.",
      tests: [],
      error: {
        type: "system",
        title: timedOut ? "Execution Service Timeout" : "System Error",
        message:
          "Could not get a response from the code execution backend at http://127.0.0.1:8001.",
        hint: "Start it with: cd socratic_backend && uvicorn server:app --port 8001",
      },
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

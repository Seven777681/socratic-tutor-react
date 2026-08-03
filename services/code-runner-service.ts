import type { CodeRunResult } from "@/types/code-run";

export interface RunCodeTestCase {
  id: string;
  name?: string;
  input?: string;
  expectedOutput?: string;
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
  try {
    const response = await fetch("/api/code/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, code, stdin, testCases }),
    });

    if (!response.ok) {
      throw new Error(`Code run request failed with status ${response.status}`);
    }

    return (await response.json()) as CodeRunResult;
  } catch (error) {
    return {
      id: buildRunId(),
      taskId,
      status: "system_error",
      scenario: "system_error",
      stdin,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown error",
      elapsedMs: 0,
      createdAt: new Date().toISOString(),
      summary:
        "The code execution service is unavailable. Your code was not executed.",
      tests: [],
      error: {
        type: "system",
        title: "System Error",
        message:
          "Could not reach the code execution backend at http://127.0.0.1:8000.",
        hint: "Start it with: cd socratic_backend && uvicorn server:app --reload --port 8000",
      },
    };
  }
}

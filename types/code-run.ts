export type RunStatus =
  | "idle"
  | "running"
  | "success"
  | "failed"
  | "error"
  | "timeout"
  | "system_error";

export type RunScenario =
  | "success"
  | "failed"
  | "syntax_error"
  | "runtime_error"
  | "timeout"
  | "system_error";

export type TestVisibility = "public" | "hidden";

export interface TestCaseResult {
  id: string;
  name: string;
  visibility: TestVisibility;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  passed: boolean;
  feedback: string;
}

export interface CodeExecutionError {
  type: "syntax" | "runtime" | "timeout" | "system";
  title: string;
  message: string;
  lineNumber?: number;
  hint?: string;
}

export interface CodeRunResult {
  id: string;
  taskId: string;
  status: Exclude<RunStatus, "idle" | "running">;
  scenario: RunScenario;
  stdin: string;
  stdout: string;
  stderr: string;
  elapsedMs: number;
  createdAt: string;
  summary: string;
  tests: TestCaseResult[];
  error?: CodeExecutionError;
}

export interface MockRunCodeInput {
  taskId: string;
  code: string;
  stdin: string;
  scenario: RunScenario;
}

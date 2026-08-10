import assert from "node:assert/strict";
import test from "node:test";
import { reconcileCodeAnalysisWithRunEvidence } from "@/lib/server/tutor-code-analysis-guard";
import type { CodeAnalysisOutput } from "@/lib/server/tutor-agent-schemas";
import type { CodeRunResult } from "@/types/code-run";
import type { TutorRequest } from "@/types/tutor";

const analysis: CodeAnalysisOutput = {
  hasError: false,
  errorType: "none",
  errorLayer: "none",
  likelyPattern: "none",
  suspectedLineNumbers: [],
  counterexample: null,
  executionTrace: [],
  predictionMismatch: false,
  summary: "No error inferred.",
  investigationFocus: "Explain the approach.",
};

function request(latestRunResult: CodeRunResult): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "print(value)",
    conversationId: "conversation-1",
    stage: "debug",
    mode: "run_and_reflect",
    conversation: [],
    action: "debug",
    latestRunResult,
  };
}

function run(overrides: Partial<CodeRunResult>): CodeRunResult {
  return {
    id: "run-1",
    taskId: "task-1",
    status: "success",
    scenario: "success",
    stdin: "",
    stdout: "",
    stderr: "",
    elapsedMs: 10,
    createdAt: "2026-08-11T00:00:00.000Z",
    summary: "Run complete",
    tests: [],
    ...overrides,
  };
}

test("trusted syntax errors override a model no-error classification", () => {
  const result = reconcileCodeAnalysisWithRunEvidence({
    request: request(run({
      status: "error",
      scenario: "syntax_error",
      error: { type: "syntax", title: "Syntax Error", message: "invalid syntax" },
    })),
    analysis,
  });

  assert.equal(result.hasError, true);
  assert.equal(result.errorType, "syntax");
  assert.equal(result.errorLayer, "syntax");
});

test("a failed test prevents a model no-error classification", () => {
  const result = reconcileCodeAnalysisWithRunEvidence({
    request: request(run({
      status: "failed",
      scenario: "failed",
      tests: [{
        id: "case-1",
        name: "case-1",
        visibility: "hidden",
        passed: false,
        feedback: "Output differs.",
      }],
    })),
    analysis,
  });

  assert.equal(result.hasError, true);
  assert.equal(result.errorLayer, "implementation");
});

test("all supplied tests passing clears an unsupported model error", () => {
  const result = reconcileCodeAnalysisWithRunEvidence({
    request: request(run({
      tests: [{
        id: "case-1",
        name: "case-1",
        visibility: "public",
        passed: true,
        feedback: "Output matches.",
      }],
    })),
    analysis: {
      ...analysis,
      hasError: true,
      errorType: "logic",
      errorLayer: "algorithm",
      likelyPattern: "missing_case",
      suspectedLineNumbers: [2],
    },
  });

  assert.equal(result.hasError, false);
  assert.equal(result.errorLayer, "none");
  assert.equal(result.likelyPattern, "none");
  assert.deepEqual(result.suspectedLineNumbers, []);
});

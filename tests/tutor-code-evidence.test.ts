import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCodeAnalysisEvidence } from "@/lib/server/tutor-code-evidence";
import type { TutorRequest } from "@/types/tutor";

function request(overrides: Partial<TutorRequest> = {}): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "",
    conversationId: "conversation-1",
    stage: "debug",
    mode: "run_and_reflect",
    conversation: [],
    action: "debug",
    ...overrides,
  };
}

test("downgrades model-inferred trace steps because no instrumented trace exists", () => {
  const result = normalizeCodeAnalysisEvidence({
    request: request(),
    counterexample: null,
    executionTrace: [{
      step: 1,
      lineNumber: 3,
      variables: [{ name: "total", value: "3" }],
      observation: "The value changes.",
      evidence: "run_evidence",
    }],
  });

  assert.equal(result.executionTrace[0]?.evidence, "static_inference");
});

test("keeps student-prediction labeling only when a prediction was supplied", () => {
  const result = normalizeCodeAnalysisEvidence({
    request: request({ latestPrediction: "total will be 3" }),
    counterexample: null,
    executionTrace: [{
      step: 1,
      lineNumber: null,
      variables: [{ name: "total", value: "3" }],
      observation: "The student expects this value.",
      evidence: "student_prediction",
    }],
  });

  assert.equal(result.executionTrace[0]?.evidence, "student_prediction");
});

test("trusts a counterexample input only when it matches supplied test evidence", () => {
  const result = normalizeCodeAnalysisEvidence({
    request: request({
      latestRunResult: {
        id: "run-1",
        taskId: "task-1",
        status: "failed",
        scenario: "failed",
        stdin: "",
        stdout: "",
        stderr: "",
        elapsedMs: 8,
        createdAt: "2026-08-10T00:00:00.000Z",
        summary: "One test failed.",
        tests: [{
          id: "case-1",
          name: "single item",
          visibility: "public",
          input: "[1]",
          expectedOutput: "1",
          actualOutput: "0",
          passed: false,
          feedback: "Wrong output",
        }],
      },
    }),
    counterexample: {
      input: "[1]",
      expectedBehavior: "The value should be processed.",
      investigationReason: "This exposes the boundary.",
      evidence: "static_inference",
    },
    executionTrace: [],
  });

  assert.equal(result.counterexample?.evidence, "run_evidence");
});

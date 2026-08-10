import assert from "node:assert/strict";
import test from "node:test";
import {
  createSafeStrategyQuestion,
  selectTutorQuestionStrategy,
} from "@/lib/server/tutor-question-strategy";
import type { TutorRequest } from "@/types/tutor";

function request(overrides: Partial<TutorRequest> = {}): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "",
    conversationId: "conversation-1",
    stage: "code",
    mode: "run_and_reflect",
    conversation: [],
    action: "message",
    ...overrides,
  };
}

test("selects decomposition for planning", () => {
  assert.equal(selectTutorQuestionStrategy({
    request: request({ stage: "plan" }),
    codeHasError: false,
    predictionMismatch: false,
  }), "decomposition");
});

test("rotates away from a recently used strategy", () => {
  assert.equal(selectTutorQuestionStrategy({
    request: request({
      stage: "plan",
      conversation: [{
        id: "tutor-1",
        role: "tutor",
        content: "What is the smallest step?",
        timestamp: "2026-08-10T00:00:00.000Z",
        questionStrategy: "decomposition",
      }],
    }),
    codeHasError: false,
    predictionMismatch: false,
  }), "prediction");
});

test("uses execution tracing when code evidence shows an error", () => {
  assert.equal(selectTutorQuestionStrategy({
    request: request({ currentCode: "print(value)" }),
    codeHasError: true,
    predictionMismatch: false,
  }), "trace_execution");
});

test("safe fallback question follows the student's language", () => {
  assert.match(createSafeStrategyQuestion("counterexample", "我卡住了"), /哪个最小输入/);
  assert.match(createSafeStrategyQuestion("counterexample", "I am stuck"), /smallest input/i);
});

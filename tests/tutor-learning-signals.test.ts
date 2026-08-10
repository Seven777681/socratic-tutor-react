import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeTutorLearningSignals,
  calculateNextHintLevel,
} from "@/lib/server/tutor-learning-signals";
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

test("detects repeated student messages as strong struggle evidence", () => {
  const signals = analyzeTutorLearningSignals(request({
    studentMessage: "I do not understand the loop",
    conversation: [{
      id: "student-1",
      role: "student",
      content: "I do not understand the loop",
      timestamp: "2026-08-10T00:00:00.000Z",
    }],
  }));

  assert.equal(signals.repeatedStudentMessage, true);
  assert.equal(signals.shouldEscalateHint, true);
  assert.ok(signals.struggleScore >= 2);
});

test("recognizes Chinese uncertainty language", () => {
  const signals = analyzeTutorLearningSignals(request({
    studentMessage: "我不确定下一步应该做什么",
  }));

  assert.equal(signals.uncertaintyDetected, true);
  assert.equal(signals.isLikelyStuck, false);
});

test("combines a failed run and explicit hint request", () => {
  const signals = analyzeTutorLearningSignals(request({
    action: "smaller_hint",
    latestRunResult: {
      id: "run-1",
      taskId: "task-1",
      status: "failed",
      scenario: "failed",
      stdin: "",
      stdout: "0\n",
      stderr: "",
      elapsedMs: 10,
      createdAt: "2026-08-10T00:00:00.000Z",
      summary: "Two tests failed",
      tests: [
        {
          id: "case-1",
          name: "case-1",
          visibility: "public",
          passed: false,
          feedback: "wrong output",
        },
        {
          id: "case-2",
          name: "case-2",
          visibility: "public",
          passed: false,
          feedback: "wrong output",
        },
      ],
    },
  }));

  assert.equal(signals.failedTestCount, 2);
  assert.equal(signals.shouldEscalateHint, true);
  assert.equal(signals.isLikelyStuck, true);
});

test("hint level increases gradually and never decreases", () => {
  assert.equal(calculateNextHintLevel({
    currentHintLevel: 1,
    confusionLevel: 0,
    shouldIncrease: true,
  }), 2);
  assert.equal(calculateNextHintLevel({
    currentHintLevel: 2,
    confusionLevel: 1,
    shouldIncrease: false,
  }), 2);
  assert.equal(calculateNextHintLevel({
    currentHintLevel: 3,
    confusionLevel: 3,
    shouldIncrease: true,
  }), 3);
});

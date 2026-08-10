import assert from "node:assert/strict";
import test from "node:test";
import {
  createInitialLearnerState,
  createUnderstandingLearnerState,
  mergeMonitoredLearnerState,
} from "@/lib/server/tutor-learner-state";
import type { TutorRequest } from "@/types/tutor";

function request(overrides: Partial<TutorRequest> = {}): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "",
    conversationId: "conversation-1",
    stage: "plan",
    mode: "run_and_reflect",
    conversation: [],
    action: "message",
    ...overrides,
  };
}

test("uses the five understanding dimensions as the canonical learning state", () => {
  const state = createUnderstandingLearnerState({
    request: request({ studentMessage: "I read the input and print a result." }),
    hintLevel: 1,
    output: {
      dimensions: { goal: 8, input: 7, output: 7, constraints: 2, stepOrder: 5 },
      misconceptions: [],
      planStatus: "needs_revision",
      missingPlanElement: "Handle the boundary case.",
      summary: "Constraints are not demonstrated yet.",
      nextQuestionFocus: "constraints",
    },
  });

  assert.equal(state.currentFocus, "constraints");
  assert.equal(state.concepts.goal?.status, "understood");
  assert.equal(state.concepts.constraints?.status, "missing");
  assert.equal(state.hintLevel, 1);
});

test("marks a resolved focus as understood and preserves evidence", () => {
  const baseState = createInitialLearnerState(request());
  baseState.currentFocus = "goal";
  baseState.concepts.goal = {
    status: "partial",
    confidence: 0.5,
    evidence: "Partial goal",
  };

  const state = mergeMonitoredLearnerState({
    request: request({ studentMessage: "The program should print the largest value." }),
    baseState,
    hintLevel: 1,
    monitoring: {
      learningState: "independent",
      currentFocus: "input",
      codeChangeQuality: "meaningful",
      productiveStruggle: false,
      intervention: "encourage",
      supportProfile: {
        preferredWaitTime: 90,
        typicalAttemptsBeforeHint: 3,
        preferredQuestionStyle: "question_based",
      },
      latestAnswer: {
        quality: "correct",
        focusResolved: true,
        recognizedIdeas: ["largest value"],
        missingIdeas: [],
      },
    },
  });

  assert.equal(state.concepts.goal?.status, "understood");
  assert.match(state.concepts.goal?.evidence ?? "", /largest value/);
  assert.equal(state.currentFocus, "input");
});

test("carries the latest learner state forward across requests", () => {
  const previous = createInitialLearnerState(request());
  previous.currentFocus = "coding_progress";
  const state = createInitialLearnerState(request({
    stage: "code",
    conversation: [{
      id: "tutor-1",
      role: "tutor",
      content: "What will you implement next?",
      timestamp: "2026-08-10T00:00:00.000Z",
      learnerState: previous,
    }],
  }));

  assert.deepEqual(state, previous);
});

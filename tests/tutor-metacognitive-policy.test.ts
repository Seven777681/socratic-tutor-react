import assert from "node:assert/strict";
import test from "node:test";
import {
  adaptSupportProfile,
  analyzeCodeChangeQuality,
  detectProductiveStruggle,
  reconcileMetacognitiveDecision,
} from "@/lib/server/tutor-metacognitive-policy";
import type { TutorLearningSignals } from "@/lib/server/tutor-learning-signals";
import type { TutorRequest } from "@/types/tutor";

const signals: TutorLearningSignals = {
  idleSeconds: 0,
  repeatedStudentMessage: false,
  uncertaintyDetected: false,
  recentHelpRequests: 0,
  failedTestCount: 1,
  totalTestCount: 1,
  runStatus: "failed",
  errorType: "none",
  struggleScore: 1,
  shouldEscalateHint: false,
  isLikelyStuck: false,
  reasons: ["latest code run status is failed"],
};

const profile = {
  preferredWaitTime: 90,
  typicalAttemptsBeforeHint: 3,
  preferredQuestionStyle: "question_based" as const,
};

function request(overrides: Partial<TutorRequest> = {}): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "print(total)",
    conversationId: "conversation-1",
    stage: "debug",
    mode: "run_and_reflect",
    conversation: [],
    action: "debug",
    ...overrides,
  };
}

test("distinguishes meaningful code changes from cosmetic edits", () => {
  assert.equal(analyzeCodeChangeQuality("total=0", "total = 0  # start"), "cosmetic");
  assert.equal(analyzeCodeChangeQuality("total = 0", "total = value"), "meaningful");
  assert.equal(analyzeCodeChangeQuality("total = 0", "total = 0"), "none");
});

test("treats early meaningful changes during failure as productive struggle", () => {
  assert.equal(detectProductiveStruggle({
    codeChangeQuality: "meaningful",
    signals,
    attemptsOnFocus: 1,
    profile,
  }), true);
});

test("gives productive explorers more time before intervening", () => {
  const adapted = adaptSupportProfile({
    previous: profile,
    signals,
    productiveStruggle: true,
    request: request(),
  });

  assert.equal(adapted.preferredWaitTime, 105);
  assert.equal(adapted.typicalAttemptsBeforeHint, 4);
});

test("selects wait instead of a larger hint during productive struggle", () => {
  const decision = reconcileMetacognitiveDecision({
    request: request(),
    modelLearningState: "stuck",
    modelIntervention: "increase_hint",
    modelProductiveStruggle: false,
    signals,
    codeChangeQuality: "meaningful",
    productiveStruggle: true,
    previousLearningState: "exploring",
    latestAnswerResolved: false,
  });

  assert.equal(decision.learningState, "exploring");
  assert.equal(decision.intervention, "wait");
  assert.equal(decision.productiveStruggle, true);
});

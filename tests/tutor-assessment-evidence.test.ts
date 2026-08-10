import assert from "node:assert/strict";
import test from "node:test";
import {
  buildTutorAssessmentEvidence,
  reconcileUnderstandingVerdict,
  resolveAssessmentEvidence,
} from "@/lib/server/tutor-assessment-evidence";
import type { TutorLearnerState, TutorRequest } from "@/types/tutor";

const resolvedLearnerState: TutorLearnerState = {
  currentFocus: "coding_progress",
  hintLevel: 2,
  attemptsOnFocus: 1,
  consecutiveOffTarget: 0,
  learningState: "recovering",
  codeChangeQuality: "meaningful",
  productiveStruggle: false,
  intervention: "encourage",
  supportProfile: {
    preferredWaitTime: 90,
    typicalAttemptsBeforeHint: 3,
    preferredQuestionStyle: "question_based",
  },
  concepts: {},
  latestAnswer: {
    quality: "correct",
    focusResolved: true,
    recognizedIdeas: ["compared predicted and actual output"],
    missingIdeas: [],
  },
};

function request(): TutorRequest {
  return {
    taskId: "task-1",
    taskTitle: "Boundary loop",
    studentMessage: "I learned to test the final index.",
    currentCode: "print('done')",
    conversationId: "conversation-1",
    stage: "reflect",
    mode: "run_and_reflect",
    action: "generate_reflection_summary",
    hintLevel: 2,
    planningData: {
      status: "ready",
      approach: "Inspect each value",
      steps: ["Read input", "Loop through values", "Print result"],
    },
    conversation: [
      {
        id: "tutor-1",
        role: "tutor",
        content: "What do you predict for the final index?",
        timestamp: "2026-08-11T00:00:00.000Z",
        questionStrategy: "prediction",
        hintLevel: 1,
      },
      {
        id: "student-1",
        role: "student",
        content: "I think the loop skips the final item.",
        timestamp: "2026-08-11T00:01:00.000Z",
      },
      {
        id: "tutor-2",
        role: "tutor",
        content: "Which boundary will you change?",
        timestamp: "2026-08-11T00:02:00.000Z",
        questionStrategy: "counterexample",
        hintLevel: 2,
        learnerState: resolvedLearnerState,
        codeAnalysis: {
          hasError: true,
          errorType: "logic",
          errorLayer: "implementation",
          likelyPattern: "off_by_one",
          suspectedLineNumbers: [2],
          counterexample: null,
          executionTrace: [],
          patternHistory: {
            repeatedPattern: "off_by_one",
            occurrenceCount: 1,
            isRepeated: false,
          },
          predictionMismatch: true,
          summary: "The final item is skipped.",
          investigationFocus: "Compare the loop boundary.",
        },
      },
    ],
    latestRunResult: {
      id: "run-1",
      taskId: "task-1",
      status: "success",
      scenario: "success",
      stdin: "",
      stdout: "done\n",
      stderr: "",
      elapsedMs: 10,
      createdAt: "2026-08-11T00:03:00.000Z",
      summary: "All checks passed.",
      tests: [{
        id: "case-1",
        name: "boundary",
        visibility: "hidden",
        passed: true,
        feedback: "Output matches.",
      }],
    },
  };
}

test("builds a timeline, difficulty signals, and question effectiveness from evidence", () => {
  const packet = buildTutorAssessmentEvidence(request());

  assert.ok(packet.timelineEvidenceIds.includes("plan-submission"));
  assert.ok(packet.timelineEvidenceIds.includes("latest-run"));
  assert.ok(packet.commonDifficultySignals.includes("off_by_one"));
  assert.ok(packet.effectiveQuestionStrategies.includes("prediction"));
  assert.equal(packet.maxHintLevel, 2);
  assert.equal(packet.aiReliance, "moderate");
});

test("resolves only evidence identifiers that actually exist", () => {
  const packet = buildTutorAssessmentEvidence(request());
  const resolved = resolveAssessmentEvidence(
    ["plan-submission", "invented-event"],
    packet,
  );

  assert.equal(resolved.length, 1);
  assert.equal(resolved[0]?.source, "plan");
});

test("does not treat passing tests alone as demonstrated understanding", () => {
  const packet = buildTutorAssessmentEvidence(request());
  const runOnlyEvidence = resolveAssessmentEvidence(["latest-run"], packet);

  assert.equal(reconcileUnderstandingVerdict({
    requestedVerdict: "demonstrated",
    evidence: runOnlyEvidence,
    hasPassingRun: true,
  }), "partial");
  assert.equal(reconcileUnderstandingVerdict({
    requestedVerdict: "demonstrated",
    evidence: resolveAssessmentEvidence(["latest-run", "current-reflection"], packet),
    hasPassingRun: true,
  }), "demonstrated");
});

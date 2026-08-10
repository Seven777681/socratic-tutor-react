import assert from "node:assert/strict";
import test from "node:test";
import { buildErrorPatternHistory } from "@/lib/server/tutor-error-history";
import type {
  TutorCodeAnalysis,
  TutorErrorPattern,
  TutorMessage,
  TutorRequest,
} from "@/types/tutor";

function codeAnalysis(likelyPattern: TutorErrorPattern): TutorCodeAnalysis {
  return {
    hasError: true,
    errorType: "logic",
    errorLayer: "implementation",
    likelyPattern,
    suspectedLineNumbers: [3],
    counterexample: null,
    executionTrace: [],
    patternHistory: {
      repeatedPattern: likelyPattern,
      occurrenceCount: 1,
      isRepeated: false,
    },
    predictionMismatch: false,
    summary: "Possible boundary issue.",
    investigationFocus: "Check the stopping condition.",
  };
}

function tutorMessage(id: string, pattern: TutorErrorPattern): TutorMessage {
  return {
    id,
    role: "tutor",
    content: "Which boundary should you inspect?",
    timestamp: "2026-08-10T00:00:00.000Z",
    codeAnalysis: codeAnalysis(pattern),
  };
}

function request(conversation: TutorMessage[]): TutorRequest {
  return {
    taskId: "task-1",
    studentMessage: "",
    currentCode: "",
    conversationId: "conversation-1",
    stage: "debug",
    mode: "run_and_reflect",
    conversation,
    action: "debug",
  };
}

test("counts the current error together with matching prior patterns", () => {
  const history = buildErrorPatternHistory({
    request: request([
      tutorMessage("tutor-1", "off_by_one"),
      tutorMessage("tutor-2", "off_by_one"),
      tutorMessage("tutor-3", "wrong_initialization"),
    ]),
    currentPattern: "off_by_one",
  });

  assert.deepEqual(history, {
    repeatedPattern: "off_by_one",
    occurrenceCount: 3,
    isRepeated: true,
  });
});

test("does not create error history when no current pattern exists", () => {
  const history = buildErrorPatternHistory({
    request: request([tutorMessage("tutor-1", "off_by_one")]),
    currentPattern: "none",
  });

  assert.deepEqual(history, {
    repeatedPattern: "none",
    occurrenceCount: 0,
    isRepeated: false,
  });
});

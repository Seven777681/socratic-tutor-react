import type { ProblemUnderstandingOutput } from "@/lib/server/tutor-agent-schemas";
import type {
  LearnerAnswerQuality,
  TutorLearnerState,
  TutorLearningFocus,
  TutorRequest,
} from "@/types/tutor";

const dimensionKeys = ["goal", "input", "output", "constraints", "stepOrder"] as const;
const focusByDimension = {
  goal: "goal",
  input: "input",
  output: "output",
  constraints: "constraints",
  stepOrder: "step_order",
} as const;

export function getLatestLearnerState(request: TutorRequest) {
  return [...request.conversation]
    .reverse()
    .find((message) => message.learnerState)
    ?.learnerState;
}

function conceptStatus(score: number) {
  if (score >= 7) return "understood" as const;
  if (score >= 4) return "partial" as const;
  return "missing" as const;
}

export function createUnderstandingLearnerState({
  request,
  output,
  hintLevel,
}: {
  request: TutorRequest;
  output: ProblemUnderstandingOutput;
  hintLevel: number;
}): TutorLearnerState {
  const previous = getLatestLearnerState(request);
  const concepts = { ...(previous?.concepts ?? {}) };

  for (const key of dimensionKeys) {
    const focus = focusByDimension[key];
    const score = output.dimensions[key];
    const misconception = output.misconceptions.find((item) =>
      item.type === (key === "stepOrder" ? "step_order" : key === "constraints" ? "constraint" : key),
    );
    concepts[focus] = {
      status: conceptStatus(score),
      confidence: score / 10,
      evidence: misconception?.evidence || `Evidence-based ${focus} score: ${score}/10.`,
    };
  }

  const weakestIncomplete = dimensionKeys
    .filter((key) => output.dimensions[key] < 7)
    .sort((left, right) => output.dimensions[left] - output.dimensions[right])[0];
  const currentFocus = output.planStatus === "ready"
    ? "plan_complete"
    : weakestIncomplete
      ? focusByDimension[weakestIncomplete]
      : "step_order";
  const hasLatestAnswer = Boolean(request.studentMessage.trim());
  const quality: LearnerAnswerQuality = !hasLatestAnswer
    ? "uncertain"
    : output.misconceptions.length
      ? "partial"
      : "correct";
  const previousAttempts = previous?.attemptsOnFocus ?? 0;

  return {
    currentFocus,
    hintLevel,
    attemptsOnFocus:
      hasLatestAnswer && previous?.currentFocus === currentFocus
        ? previousAttempts + 1
        : 0,
    consecutiveOffTarget: 0,
    learningState:
      output.planStatus === "ready"
        ? "independent"
        : output.misconceptions.length
          ? "uncertain"
          : "exploring",
    codeChangeQuality: "none",
    productiveStruggle: false,
    intervention: output.planStatus === "ready" ? "wait" : "break_down_problem",
    supportProfile: previous?.supportProfile ?? {
      preferredWaitTime: 90,
      typicalAttemptsBeforeHint: 3,
      preferredQuestionStyle: "question_based",
    },
    concepts,
    latestAnswer: {
      quality,
      focusResolved: output.planStatus === "ready",
      recognizedIdeas: dimensionKeys
        .filter((key) => output.dimensions[key] >= 7)
        .map((key) => focusByDimension[key]),
      missingIdeas: dimensionKeys
        .filter((key) => output.dimensions[key] < 4)
        .map((key) => focusByDimension[key]),
      misconception: output.misconceptions[0]?.evidence,
    },
  };
}

export function mergeMonitoredLearnerState({
  request,
  baseState,
  hintLevel,
  monitoring,
}: {
  request: TutorRequest;
  baseState: TutorLearnerState;
  hintLevel: number;
  monitoring: {
    learningState: TutorLearnerState["learningState"];
    codeChangeQuality: TutorLearnerState["codeChangeQuality"];
    productiveStruggle: boolean;
    intervention: TutorLearnerState["intervention"];
    supportProfile: TutorLearnerState["supportProfile"];
    currentFocus: TutorLearningFocus;
    latestAnswer: TutorLearnerState["latestAnswer"];
  };
}): TutorLearnerState {
  const hasLatestAnswer = Boolean(request.studentMessage.trim());
  const sameFocus = monitoring.currentFocus === baseState.currentFocus;
  const concepts = { ...baseState.concepts };

  if (
    hasLatestAnswer &&
    monitoring.latestAnswer.focusResolved &&
    concepts[baseState.currentFocus]
  ) {
    concepts[baseState.currentFocus] = {
      status: "understood",
      confidence: Math.max(0.8, concepts[baseState.currentFocus].confidence),
      evidence: request.studentMessage.trim().slice(0, 240),
    };
  }

  return {
    currentFocus: monitoring.currentFocus,
    hintLevel,
    attemptsOnFocus:
      hasLatestAnswer && sameFocus ? baseState.attemptsOnFocus + 1 : 0,
    consecutiveOffTarget:
      monitoring.latestAnswer.quality === "off_target"
        ? baseState.consecutiveOffTarget + 1
        : 0,
    learningState: monitoring.learningState,
    codeChangeQuality: monitoring.codeChangeQuality,
    productiveStruggle: monitoring.productiveStruggle,
    intervention: monitoring.intervention,
    supportProfile: monitoring.supportProfile,
    concepts,
    latestAnswer: monitoring.latestAnswer,
  };
}

export function createInitialLearnerState(request: TutorRequest): TutorLearnerState {
  return getLatestLearnerState(request) ?? {
    currentFocus:
      request.stage === "reflect"
        ? "reflection_learning"
        : request.stage === "debug"
          ? "debugging"
          : request.stage === "code"
            ? "coding_progress"
            : "goal",
    hintLevel: request.hintLevel ?? 0,
    attemptsOnFocus: 0,
    consecutiveOffTarget: 0,
    learningState: "exploring",
    codeChangeQuality: "none",
    productiveStruggle: false,
    intervention: "wait",
    supportProfile: {
      preferredWaitTime: 90,
      typicalAttemptsBeforeHint: 3,
      preferredQuestionStyle: "question_based",
    },
    concepts: {},
    latestAnswer: {
      quality: "uncertain",
      focusResolved: false,
      recognizedIdeas: [],
      missingIdeas: [],
    },
  };
}

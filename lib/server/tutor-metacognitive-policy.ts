import type { TutorLearningSignals } from "@/lib/server/tutor-learning-signals";
import type {
  TutorCodeChangeQuality,
  TutorIntervention,
  TutorLearnerState,
  TutorProgressState,
  TutorRequest,
  TutorSupportProfile,
} from "@/types/tutor";

function structuralCode(code: string) {
  return code
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\s*([=+\-*/%<>!:,()[\]{}])\s*/g, "$1")
    .replace(/\s+/g, " ");
}

export function analyzeCodeChangeQuality(
  previousCode: string | undefined,
  currentCode: string,
): TutorCodeChangeQuality {
  if (previousCode === undefined || previousCode === currentCode) return "none";
  if (structuralCode(previousCode) === structuralCode(currentCode)) return "cosmetic";
  return "meaningful";
}

export function adaptSupportProfile({
  previous,
  signals,
  productiveStruggle,
  request,
}: {
  previous?: TutorSupportProfile;
  signals: TutorLearningSignals;
  productiveStruggle: boolean;
  request: TutorRequest;
}): TutorSupportProfile {
  const base = previous ?? {
    preferredWaitTime: 90,
    typicalAttemptsBeforeHint: 3,
    preferredQuestionStyle:
      request.mode === "explore_strategies"
        ? "comparison_based" as const
        : "question_based" as const,
  };

  if (productiveStruggle) {
    return {
      ...base,
      preferredWaitTime: Math.min(120, base.preferredWaitTime + 15),
      typicalAttemptsBeforeHint: Math.min(4, base.typicalAttemptsBeforeHint + 1),
    };
  }
  if (signals.isLikelyStuck || signals.recentHelpRequests >= 2) {
    return {
      preferredWaitTime: Math.max(60, base.preferredWaitTime - 15),
      typicalAttemptsBeforeHint: Math.max(2, base.typicalAttemptsBeforeHint - 1),
      preferredQuestionStyle: "example_based",
    };
  }
  return base;
}

export function detectProductiveStruggle({
  codeChangeQuality,
  signals,
  attemptsOnFocus,
  profile,
}: {
  codeChangeQuality: TutorCodeChangeQuality;
  signals: TutorLearningSignals;
  attemptsOnFocus: number;
  profile: TutorSupportProfile;
}) {
  return (
    codeChangeQuality === "meaningful" &&
    ["failed", "error", "timeout"].includes(signals.runStatus) &&
    !signals.uncertaintyDetected &&
    !signals.repeatedStudentMessage &&
    attemptsOnFocus < profile.typicalAttemptsBeforeHint
  );
}

export function reconcileMetacognitiveDecision({
  request,
  modelLearningState,
  modelIntervention,
  modelProductiveStruggle,
  signals,
  codeChangeQuality,
  productiveStruggle,
  previousLearningState,
  latestAnswerResolved,
}: {
  request: TutorRequest;
  modelLearningState: TutorProgressState;
  modelIntervention: TutorIntervention;
  modelProductiveStruggle: boolean;
  signals: TutorLearningSignals;
  codeChangeQuality: TutorCodeChangeQuality;
  productiveStruggle: boolean;
  previousLearningState: TutorProgressState;
  latestAnswerResolved: boolean;
}) {
  const isProductive = productiveStruggle || (
    modelProductiveStruggle && codeChangeQuality === "meaningful"
  );
  if (request.action === "smaller_hint") {
    return { learningState: "stuck" as const, intervention: "increase_hint" as const, productiveStruggle: false };
  }
  if (request.stage === "debug" && modelIntervention === "return_to_plan") {
    return { learningState: modelLearningState, intervention: "return_to_plan" as const, productiveStruggle: false };
  }
  if (isProductive) {
    return { learningState: "exploring" as const, intervention: "wait" as const, productiveStruggle: true };
  }
  if (signals.isLikelyStuck) {
    return {
      learningState: "stuck" as const,
      intervention: modelIntervention === "wait" ? "break_down_problem" as const : modelIntervention,
      productiveStruggle: false,
    };
  }
  if (latestAnswerResolved && previousLearningState === "stuck") {
    return { learningState: "recovering" as const, intervention: "encourage" as const, productiveStruggle: false };
  }
  if (latestAnswerResolved && !signals.uncertaintyDetected) {
    return { learningState: "independent" as const, intervention: "wait" as const, productiveStruggle: false };
  }
  if (signals.uncertaintyDetected) {
    return { learningState: "uncertain" as const, intervention: modelIntervention, productiveStruggle: false };
  }
  if (request.action === "idle_check_in") {
    return { learningState: modelLearningState, intervention: "encourage" as const, productiveStruggle: false };
  }
  return { learningState: modelLearningState, intervention: modelIntervention, productiveStruggle: false };
}

export function preferredStrategyForIntervention(
  intervention: TutorIntervention,
  learnerState: TutorLearnerState,
) {
  if (intervention === "ask_prediction") return "prediction" as const;
  if (intervention === "break_down_problem" || intervention === "return_to_plan") return "decomposition" as const;
  if (intervention === "show_counterexample") return "counterexample" as const;
  if (learnerState.supportProfile.preferredQuestionStyle === "example_based") return "counterexample" as const;
  if (learnerState.supportProfile.preferredQuestionStyle === "step_by_step") return "decomposition" as const;
  if (learnerState.supportProfile.preferredQuestionStyle === "comparison_based") return "comparison" as const;
  return null;
}

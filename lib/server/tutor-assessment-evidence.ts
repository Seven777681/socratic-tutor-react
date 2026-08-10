import type {
  TutorQuestionStrategy,
  TutorRequest,
} from "@/types/tutor";

export interface TutorAssessmentEvidenceRecord {
  id: string;
  source: "plan" | "student_message" | "tutor_diagnosis" | "code_run" | "reflection";
  detail: string;
}

export interface TutorAssessmentEvidencePacket {
  records: TutorAssessmentEvidenceRecord[];
  timelineEvidenceIds: string[];
  maxHintLevel: number;
  helpRequestCount: number;
  commonDifficultySignals: string[];
  effectiveQuestionStrategies: TutorQuestionStrategy[];
  aiReliance: "low" | "moderate" | "high";
}

function concise(value: string, max = 220) {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

export function buildTutorAssessmentEvidence(
  request: TutorRequest,
): TutorAssessmentEvidencePacket {
  const records: TutorAssessmentEvidenceRecord[] = [];
  const timelineEvidenceIds: string[] = [];
  const difficulties = new Set<string>();
  const effectiveStrategyCounts = new Map<TutorQuestionStrategy, number>();
  const plan = request.planningData;

  if (plan?.approach.trim() || plan?.steps.some((step) => step.trim())) {
    records.push({
      id: "plan-submission",
      source: "plan",
      detail: `Approach: ${concise(plan.approach || "not stated", 120)}; ordered steps provided: ${plan.steps.filter((step) => step.trim()).length}.`,
    });
    timelineEvidenceIds.push("plan-submission");
  }

  let pendingStrategy: TutorQuestionStrategy | undefined;
  request.conversation.slice(-30).forEach((message, index) => {
    if (message.role === "student" && message.content.trim()) {
      const id = `student-${index}`;
      records.push({ id, source: "student_message", detail: concise(message.content) });
      if (timelineEvidenceIds.length < 8) timelineEvidenceIds.push(id);
    }
    if (message.role === "tutor" && message.understandingAssessment) {
      for (const misconception of message.understandingAssessment.misconceptions) {
        difficulties.add(`${misconception.type}: ${concise(misconception.evidence, 120)}`);
      }
    }
    if (message.role === "tutor" && message.codeAnalysis) {
      const analysis = message.codeAnalysis;
      const id = `diagnosis-${index}`;
      records.push({
        id,
        source: "tutor_diagnosis",
        detail: concise(`Error layer ${analysis.errorLayer}; pattern ${analysis.likelyPattern}; ${analysis.summary}`),
      });
      if (analysis.hasError && timelineEvidenceIds.length < 8) timelineEvidenceIds.push(id);
      if (analysis.likelyPattern !== "none") difficulties.add(analysis.likelyPattern);
    }
    if (
      message.role === "tutor" &&
      pendingStrategy &&
      message.learnerState?.latestAnswer.focusResolved
    ) {
      effectiveStrategyCounts.set(
        pendingStrategy,
        (effectiveStrategyCounts.get(pendingStrategy) ?? 0) + 1,
      );
      pendingStrategy = undefined;
    }
    if (message.role === "tutor" && message.questionStrategy) {
      pendingStrategy = message.questionStrategy;
    }
  });

  if (request.latestRunResult) {
    const run = request.latestRunResult;
    const passed = run.tests.filter((test) => test.passed).length;
    records.push({
      id: "latest-run",
      source: "code_run",
      detail: `Run status ${run.status}; ${passed}/${run.tests.length} supplied tests passed; ${concise(run.summary, 140)}`,
    });
    timelineEvidenceIds.push("latest-run");
  }

  if (request.studentMessage.trim()) {
    records.push({
      id: "current-reflection",
      source: request.stage === "reflect" ? "reflection" : "student_message",
      detail: concise(request.studentMessage),
    });
    timelineEvidenceIds.push("current-reflection");
  }

  const maxHintLevel = Math.min(3, Math.max(
    request.hintLevel ?? 0,
    ...request.conversation.map((message) => message.hintLevel ?? 0),
  ));
  const helpRequestCount = request.conversation.filter(
    (message) => message.actionType === "smaller_hint",
  ).length + (request.action === "smaller_hint" ? 1 : 0);
  const aiReliance = maxHintLevel >= 3 || helpRequestCount >= 3
    ? "high"
    : maxHintLevel >= 2 || helpRequestCount >= 2
      ? "moderate"
      : "low";
  const effectiveQuestionStrategies = [...effectiveStrategyCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([strategy]) => strategy);

  return {
    records,
    timelineEvidenceIds: [...new Set(timelineEvidenceIds)].slice(0, 10),
    maxHintLevel,
    helpRequestCount,
    commonDifficultySignals: [...difficulties].slice(0, 5),
    effectiveQuestionStrategies,
    aiReliance,
  };
}

export function resolveAssessmentEvidence(
  evidenceIds: string[],
  packet: TutorAssessmentEvidencePacket,
) {
  const byId = new Map(packet.records.map((record) => [record.id, record]));
  return evidenceIds
    .map((id) => byId.get(id))
    .filter((record): record is TutorAssessmentEvidenceRecord => Boolean(record));
}

export function reconcileUnderstandingVerdict({
  requestedVerdict,
  evidence,
  hasPassingRun,
}: {
  requestedVerdict: "demonstrated" | "partial" | "insufficient_evidence";
  evidence: TutorAssessmentEvidenceRecord[];
  hasPassingRun: boolean;
}) {
  if (evidence.length === 0) return "insufficient_evidence" as const;
  const hasNonRunEvidence = evidence.some((record) => record.source !== "code_run");
  if (requestedVerdict === "demonstrated" && (!hasPassingRun || !hasNonRunEvidence)) {
    return "partial" as const;
  }
  return requestedVerdict;
}

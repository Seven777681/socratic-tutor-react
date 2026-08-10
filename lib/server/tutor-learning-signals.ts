import type { CodeRunResult } from "@/types/code-run";
import type { TutorRequest } from "@/types/tutor";

export interface TutorLearningSignals {
  idleSeconds: number;
  repeatedStudentMessage: boolean;
  uncertaintyDetected: boolean;
  recentHelpRequests: number;
  failedTestCount: number;
  totalTestCount: number;
  runStatus: CodeRunResult["status"] | "not_run";
  errorType: string;
  struggleScore: number;
  shouldEscalateHint: boolean;
  isLikelyStuck: boolean;
  reasons: string[];
}

const uncertaintyTerms = [
  "not sure",
  "don't know",
  "dont know",
  "no idea",
  "confused",
  "stuck",
  "不知道",
  "不清楚",
  "不确定",
  "我不会",
  "不会做",
  "没思路",
  "卡住",
] as const;

function normalizeMessage(content: string) {
  return content.trim().toLocaleLowerCase();
}

export function hasRepeatedStudentMessage(request: TutorRequest) {
  const studentMessages = request.conversation
    .filter((message) => message.role === "student")
    .slice(-3)
    .map((message) => normalizeMessage(message.content));

  if (request.studentMessage.trim()) {
    studentMessages.push(normalizeMessage(request.studentMessage));
  }

  const recent = studentMessages.filter(Boolean).slice(-2);
  return recent.length === 2 && recent[0] === recent[1];
}

function countRecentHelpRequests(request: TutorRequest) {
  const priorRequests = request.conversation
    .slice(-8)
    .filter((message) => message.actionType === "smaller_hint").length;
  return priorRequests + (request.action === "smaller_hint" ? 1 : 0);
}

function detectsUncertainty(request: TutorRequest) {
  const recentStudentText = [
    ...request.conversation
      .filter((message) => message.role === "student")
      .slice(-3)
      .map((message) => message.content),
    request.studentMessage,
  ]
    .join(" ")
    .toLocaleLowerCase();

  return uncertaintyTerms.some((term) => recentStudentText.includes(term));
}

export function analyzeTutorLearningSignals(
  request: TutorRequest,
  preferredWaitTime = 90,
): TutorLearningSignals {
  const idleSeconds = Math.max(0, request.idleSeconds ?? 0);
  const repeatedStudentMessage = hasRepeatedStudentMessage(request);
  const uncertaintyDetected = detectsUncertainty(request);
  const recentHelpRequests = countRecentHelpRequests(request);
  const tests = request.latestRunResult?.tests ?? [];
  const failedTestCount = tests.filter((test) => !test.passed).length;
  const runStatus = request.latestRunResult?.status ?? "not_run";
  const errorType = request.latestRunResult?.error?.type ?? "none";
  const reasons: string[] = [];
  let struggleScore = 0;

  if (idleSeconds >= preferredWaitTime) {
    struggleScore += 2;
    reasons.push(`inactive for ${idleSeconds} seconds`);
  }
  if (repeatedStudentMessage) {
    struggleScore += 2;
    reasons.push("repeated the same question or statement");
  }
  if (uncertaintyDetected) {
    struggleScore += 1;
    reasons.push("expressed uncertainty");
  }
  if (recentHelpRequests >= 2) {
    struggleScore += 2;
    reasons.push(`requested a smaller hint ${recentHelpRequests} times`);
  } else if (recentHelpRequests === 1) {
    struggleScore += 1;
    reasons.push("requested a smaller hint");
  }
  if (["failed", "error", "timeout"].includes(runStatus)) {
    struggleScore += 1;
    reasons.push(`latest code run status is ${runStatus}`);
  }
  if (failedTestCount >= 2) {
    struggleScore += 1;
    reasons.push(`${failedTestCount} tests are failing`);
  }

  return {
    idleSeconds,
    repeatedStudentMessage,
    uncertaintyDetected,
    recentHelpRequests,
    failedTestCount,
    totalTestCount: tests.length,
    runStatus,
    errorType,
    struggleScore,
    shouldEscalateHint:
      request.action === "smaller_hint" || struggleScore >= 2,
    isLikelyStuck: struggleScore >= 3,
    reasons,
  };
}

export function calculateNextHintLevel({
  currentHintLevel,
  confusionLevel,
  shouldIncrease,
  shouldDecrease = false,
}: {
  currentHintLevel: number;
  confusionLevel: number;
  shouldIncrease: boolean;
  shouldDecrease?: boolean;
}) {
  const storedLevel = Math.min(3, Math.max(0, currentHintLevel));
  const modelLevel = Math.min(3, Math.max(0, confusionLevel));
  if (shouldDecrease && !shouldIncrease && confusionLevel <= 1) {
    return Math.max(0, storedLevel - 1);
  }
  return Math.min(
    3,
    Math.max(
      storedLevel,
      modelLevel,
      shouldIncrease ? storedLevel + 1 : storedLevel,
    ),
  );
}

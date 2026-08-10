import type {
  TutorErrorPattern,
  TutorErrorPatternHistory,
  TutorRequest,
} from "@/types/tutor";

export function collectRecentErrorPatterns(request: TutorRequest) {
  return request.conversation
    .filter((message) => message.role === "tutor")
    .map((message) => message.codeAnalysis?.likelyPattern)
    .filter(
      (pattern): pattern is TutorErrorPattern =>
        Boolean(pattern) && pattern !== "none",
    )
    .slice(-10);
}

export function buildErrorPatternHistory({
  request,
  currentPattern,
}: {
  request: TutorRequest;
  currentPattern: TutorErrorPattern;
}): TutorErrorPatternHistory {
  if (currentPattern === "none") {
    return {
      repeatedPattern: "none",
      occurrenceCount: 0,
      isRepeated: false,
    };
  }

  const occurrenceCount = [
    ...collectRecentErrorPatterns(request),
    currentPattern,
  ].filter((pattern) => pattern === currentPattern).length;

  return {
    repeatedPattern: currentPattern,
    occurrenceCount,
    isRepeated: occurrenceCount >= 2,
  };
}

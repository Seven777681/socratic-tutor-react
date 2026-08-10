import type { SocraticResponseOutput } from "@/lib/server/tutor-agent-schemas";
import type { TutorLearningFocus } from "@/types/tutor";

export type TutorResponseViolation =
  | "missing_single_question"
  | "optional_prompt_contains_question"
  | "possible_code_leakage"
  | "possible_direct_answer"
  | "hint_level_exceeded"
  | "repeated_question"
  | "off_focus_question";

export interface TutorResponseGuardResult {
  safe: boolean;
  violations: TutorResponseViolation[];
}

const directAnswerPatterns = [
  /\bthe answer is\b/i,
  /\bcomplete solution\b/i,
  /\buse this code\b/i,
  /\bcopy (?:and|&) paste\b/i,
  /答案是/u,
  /完整(?:答案|代码)/u,
  /直接(?:改成|写成|使用下面)/u,
] as const;

const codeLinePattern = /^\s*(?:def\s+|class\s+|for\s+.+:|while\s+.+:|if\s+.+:|return\s+|print\s*\(|[A-Za-z_]\w*\s*=)/m;

const supportRank: Record<SocraticResponseOutput["supportType"], number> = {
  metacognitive: 0,
  concept: 1,
  syntax_direction: 2,
  pseudocode: 3,
};

function similarityTokens(text: string) {
  const normalized = text.toLocaleLowerCase().replace(/[?？]/g, " ");
  const words = normalized.match(/[a-z0-9]+/g) ?? [];
  const chinese = normalized.match(/[\u3400-\u9fff]/gu) ?? [];
  const chinesePairs = chinese.slice(0, -1).map((character, index) =>
    `${character}${chinese[index + 1]}`,
  );
  return new Set([...words, ...chinesePairs]);
}

export function questionSimilarity(first: string, second: string) {
  const firstTokens = similarityTokens(first);
  const secondTokens = similarityTokens(second);
  if (!firstTokens.size || !secondTokens.size) return 0;

  const intersection = [...firstTokens].filter((token) =>
    secondTokens.has(token),
  ).length;
  const union = new Set([...firstTokens, ...secondTokens]).size;
  return intersection / union;
}

export function evaluateTutorResponse({
  candidate,
  hintLevel,
  recentTutorQuestions,
  currentFocus,
}: {
  candidate: SocraticResponseOutput;
  hintLevel: number;
  recentTutorQuestions: string[];
  currentFocus: TutorLearningFocus;
}): TutorResponseGuardResult {
  const violations = new Set<TutorResponseViolation>();
  const primaryQuestionMarks = candidate.primaryQuestion.match(/[?？]/g)?.length ?? 0;
  const optionalQuestionMarks = candidate.optionalPrompt.match(/[?？]/g)?.length ?? 0;
  const combined = `${candidate.primaryQuestion}\n${candidate.optionalPrompt}`;

  if (primaryQuestionMarks !== 1) {
    violations.add("missing_single_question");
  }
  if (optionalQuestionMarks > 0) {
    violations.add("optional_prompt_contains_question");
  }
  if (combined.includes("```") || (hintLevel < 3 && codeLinePattern.test(combined))) {
    violations.add("possible_code_leakage");
  }
  if (directAnswerPatterns.some((pattern) => pattern.test(combined))) {
    violations.add("possible_direct_answer");
  }
  if (supportRank[candidate.supportType] > Math.min(3, Math.max(0, hintLevel))) {
    violations.add("hint_level_exceeded");
  }
  if (
    recentTutorQuestions.some(
      (question) => questionSimilarity(candidate.primaryQuestion, question) >= 0.72,
    )
  ) {
    violations.add("repeated_question");
  }
  if (candidate.targetFocus !== currentFocus) {
    violations.add("off_focus_question");
  }

  return {
    safe: violations.size === 0,
    violations: [...violations],
  };
}

import type {
  TutorQuestionStrategy,
  TutorRequest,
} from "@/types/tutor";

function recentStrategies(request: TutorRequest) {
  return request.conversation
    .filter((message) => message.role === "tutor" && message.questionStrategy)
    .slice(-3)
    .map((message) => message.questionStrategy as TutorQuestionStrategy);
}

function strategyCandidates({
  request,
  codeHasError,
  predictionMismatch,
}: {
  request: TutorRequest;
  codeHasError: boolean;
  predictionMismatch: boolean;
}): TutorQuestionStrategy[] {
  if (request.action === "check_edge_cases") {
    return ["counterexample", "transfer", "prediction"];
  }
  if (request.mode === "explore_strategies") {
    return ["comparison", "explain_reasoning", "decomposition"];
  }
  if (request.stage === "understand" || request.stage === "plan") {
    return ["decomposition", "prediction", "comparison"];
  }
  if (predictionMismatch) {
    return ["trace_execution", "prediction", "counterexample"];
  }
  if (codeHasError || request.latestRunResult?.status === "failed") {
    return ["trace_execution", "counterexample", "explain_reasoning"];
  }
  if (request.stage === "reflect" || request.latestRunResult?.status === "success") {
    return ["transfer", "explain_reasoning", "comparison"];
  }
  if (request.latestPrediction && !request.latestRunResult) {
    return ["prediction", "trace_execution", "explain_reasoning"];
  }
  return ["explain_reasoning", "decomposition", "prediction"];
}

export function selectTutorQuestionStrategy(input: {
  request: TutorRequest;
  codeHasError: boolean;
  predictionMismatch: boolean;
}): TutorQuestionStrategy {
  const candidates = strategyCandidates(input);
  const recent = recentStrategies(input.request);
  return candidates.find((candidate) => !recent.includes(candidate)) ?? candidates[0];
}

const safeQuestions: Record<
  TutorQuestionStrategy,
  { en: string; zh: string }
> = {
  prediction: {
    en: "Before running it, what do you expect the next meaningful step to produce?",
    zh: "在运行之前，你预计下一个关键步骤会产生什么结果？",
  },
  counterexample: {
    en: "What is the smallest input that could test whether your current idea always works?",
    zh: "哪个最小输入最适合检验你当前的想法是否总是成立？",
  },
  decomposition: {
    en: "What is the smallest part of the problem you can verify first?",
    zh: "这个问题中，你现在可以先验证的最小部分是什么？",
  },
  comparison: {
    en: "What is the most important difference between the two approaches you are considering?",
    zh: "你正在考虑的两种方法，最关键的区别是什么？",
  },
  trace_execution: {
    en: "After the first meaningful step, what should the key variable contain?",
    zh: "执行第一个关键步骤后，核心变量应该是什么值？",
  },
  explain_reasoning: {
    en: "How would you explain why your current next step should work?",
    zh: "你会怎样解释当前这一步为什么应该有效？",
  },
  transfer: {
    en: "If the input changed, which part of your current idea should still remain true?",
    zh: "如果输入发生变化，你当前思路中的哪一部分仍然应该成立？",
  },
};

export function createSafeStrategyQuestion(
  strategy: TutorQuestionStrategy,
  studentText: string,
) {
  const usesChinese = /[\u3400-\u9fff]/u.test(studentText);
  return safeQuestions[strategy][usesChinese ? "zh" : "en"];
}

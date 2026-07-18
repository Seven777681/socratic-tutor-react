import type { CodeRunResult } from "@/types/code-run";
import type { GuidanceStage, TutorActionType, TutorMessage, TutorMode } from "@/types/tutor";
import { createTutorMessage } from "@/data/mock-tutor-conversations";

const MOCK_TUTOR_DELAY_MS = 850;

function waitForTutorDelay() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, MOCK_TUTOR_DELAY_MS));
}

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function runObservation(latestRunResult?: CodeRunResult) {
  if (!latestRunResult) return "Your code has not been run yet.";
  if (latestRunResult.status === "success") return "Your latest solution passed all available checks.";
  if (latestRunResult.status === "timeout") return "Your latest run did not finish within the time limit.";
  if (latestRunResult.error?.type === "syntax") return "Your latest run stopped at a syntax issue.";
  if (latestRunResult.error?.type === "runtime") return "Your latest run stopped because Python could not find a referenced name.";
  return `Your latest output is ${latestRunResult.stdout.trim() || "empty"}.`;
}

function actionResponse(action: TutorActionType, mode: TutorMode, hasReasoning: boolean, run?: CodeRunResult) {
  if (action === "rephrase") {
    if (mode === "explore_strategies") return "Let’s compare the choices another way: which approach best helps you practice updating a value inside a loop?";
    if (mode === "run_and_reflect") return "Look again at the latest output. What did you expect to change before the result was printed?";
    return "Let’s make the question smaller: during one loop step, what should `total` remember?";
  }
  if (action === "smaller_hint") {
    if (mode === "explore_strategies") return "Compare two strategies: keep only the current number, or keep the sum collected so far. Which one preserves earlier values?";
    if (mode === "run_and_reflect") return `${runObservation(run)} What part of the code should make \`total\` change from its starting value?`;
    return "Focus on one choice: should `total` keep the current number, or everything collected so far?";
  }
  if (action === "check_reasoning" && !hasReasoning) return "Share your reasoning first, and I’ll help you examine it without giving away the solution.";
  if (action === "check_reasoning") {
    return mode === "explore_strategies"
      ? "Explain which strategy you chose and why it fits the task goal. I’ll help you examine the trade-off."
      : "Which part of your reasoning explains why the printed value should change from `0`?";
  }
  return undefined;
}

export async function getMockTutorResponse({
  studentMessage,
  stage,
  conversation,
  action = "message",
  latestRunResult,
  tutorMode,
}: {
  taskId: string;
  studentMessage: string;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  stage: GuidanceStage;
  conversation: TutorMessage[];
  action?: TutorActionType;
  tutorMode: TutorMode;
}): Promise<TutorMessage> {
  await waitForTutorDelay();
  const response = actionResponse(action, tutorMode, conversation.some((message) => message.role === "student"), latestRunResult);
  const questionType = tutorMode === "explore_strategies" ? "strategy_comparison" : stage === "reflect" ? "reflection" : "debugging";
  if (response) return createTutorMessage(response, stage, questionType, tutorMode);

  const asksForAnswer = includesAny(studentMessage, ["give me the code", "tell me the answer", "fix it", "solution", "answer", "完整代码", "答案"]);
  if (asksForAnswer) {
    const content = tutorMode === "explore_strategies"
      ? "I won’t provide the complete solution, but we can compare two approaches: a loop with a running total, or a built-in summing function. Which better matches the goal of practicing loops?"
      : tutorMode === "run_and_reflect"
        ? `${runObservation(latestRunResult)} I won’t replace your code with a complete solution. Which value should change during the loop, and what small edit could you test next?`
        : "I won’t write the complete solution for you. Let’s take one step: which part feels less clear—choosing the loop range or deciding what `total` means?";
    return createTutorMessage(content, stage, tutorMode === "explore_strategies" ? "strategy_comparison" : "decomposition", tutorMode);
  }

  if (tutorMode === "explore_strategies") {
    return createTutorMessage("There are two ways to approach this:\n\nStrategy A: update a running total once per loop iteration.\n\nStrategy B: use a built-in operation to compute the result at once.\n\nWhich strategy better matches the learning goal of practicing loops, and why?", stage, "strategy_comparison", tutorMode);
  }
  if (tutorMode === "run_and_reflect") {
    return createTutorMessage(`Observation:\n${runObservation(latestRunResult)}\n\nGuiding Question:\nWhich variable should change before the final print?\n\nSuggested Action:\nDescribe what \`total\` should hold after one loop iteration.`, stage, questionType, tutorMode);
  }
  if (includesAny(studentMessage, ["sum", "accumulator", "running total", "累加"])) {
    return createTutorMessage("Let’s focus on one step. What value should the running total have before the loop processes the first number?", stage, "understanding", tutorMode);
  }
  if (includesAny(studentMessage, ["i don't know", "i dont know", "not sure", "不知道", "不懂"])) {
    return createTutorMessage("Let’s make the question smaller. If `n` is 3, what values should be added together?", stage, "decomposition", tutorMode);
  }
  return createTutorMessage("Guiding Step: understand the changing value.\n\nWhich variable should store the running total?", stage, "decomposition", tutorMode);
}

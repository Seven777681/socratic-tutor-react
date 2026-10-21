import type { CodeRunResult } from "@/types/code-run";
import type { GuidanceStage, TutorActionType, TutorMessage, TutorMode } from "@/types/tutor";
import { createTutorMessage } from "@/data/mock-tutor-conversations";

const MOCK_TUTOR_DELAY_MS = 850;

function useChinese() {
  return typeof window !== "undefined" && window.localStorage.getItem("socratic-tutor-language") === "zh";
}

function waitForTutorDelay() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, MOCK_TUTOR_DELAY_MS));
}

function runObservation(latestRunResult?: CodeRunResult) {
  if (useChinese()) {
    if (!latestRunResult) return "你的代码还没有运行。";
    if (latestRunResult.status === "success") return "你当前的解法已经通过所有可用检查。";
    if (latestRunResult.status === "timeout") return "你最近一次运行未能在时间限制内完成。";
    if (latestRunResult.error) return `最近一次运行报告了“${latestRunResult.error.title}”。`;
    return `你最近的输出是 ${latestRunResult.stdout.trim() || "空"}。`;
  }
  if (!latestRunResult) return "Your code has not been run yet.";
  if (latestRunResult.status === "success") return "Your latest solution passed all available checks.";
  if (latestRunResult.status === "timeout") return "Your latest run did not finish within the time limit.";
  if (latestRunResult.error) return `Your latest run reported: ${latestRunResult.error.title}.`;
  return `Your latest output is ${latestRunResult.stdout.trim() || "empty"}.`;
}

function actionResponse(action: TutorActionType, run?: CodeRunResult) {
  if (useChinese()) {
    if (action === "review_plan") return "你的计划中，哪一步把输入或初始值与最终输出连接起来？";
    if (action === "generate_reflection_summary") return "你练习了如何把计划、预测、代码和运行反馈连接成一个完整的学习循环。";
    if (action === "explain_success") return "代码中的哪一部分能够说明这个成功结果也适用于其他有效输入？";
    if (action === "debug") return `${runObservation(run)} 你会先检查哪一行来解释这个结果？`;
    if (action === "check_edge_cases") return "请尝试最小输入、典型输入和边界输入。每种情况下都应该保持什么条件？";
    if (action === "reflect_solution") return "什么策略帮助你从题目描述逐步得到可运行的解法？";
    if (action === "rephrase") return "程序开始时需要知道什么？结束时又应该满足什么条件？";
    if (action === "smaller_hint") return "请手动跟踪一个很小的示例。完成第一个关键步骤后，应该满足什么条件？";
    if (action === "check_reasoning") return "代码中的哪一行能够支持你刚才描述的推理？";
    return undefined;
  }
  if (action === "review_plan") {
    return "Which step in your plan connects the input or starting value to the final output?";
  }
  if (action === "generate_reflection_summary") {
    return "You practiced connecting a plan, prediction, code, and run feedback into one learning loop.";
  }
  if (action === "explain_success") {
    return "Which part of your code explains why the successful result should generalize to another valid input?";
  }
  if (action === "debug") {
    return `${runObservation(run)} What is the first line you would inspect to explain that result?`;
  }
  if (action === "check_edge_cases") {
    return "Try a smallest input, a typical input, and a boundary input. What should stay true in every case?";
  }
  if (action === "reflect_solution") {
    return "What strategy helped you move from the task description to a working solution?";
  }
  if (action === "rephrase") {
    return "What does the program need to know at the start, and what should be true at the end?";
  }
  if (action === "smaller_hint") {
    return "Trace one tiny example by hand. After the first meaningful step, what should be true?";
  }
  if (action === "check_reasoning") {
    return "Which line in your code supports the reasoning you just described?";
  }
  return undefined;
}

export async function getMockTutorResponse({
  stage,
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
  const response = actionResponse(action, latestRunResult);
  const questionType =
    action === "reflect_solution" || action === "explain_success" || stage === "reflect"
      ? "reflection"
      : action === "check_edge_cases"
        ? "transfer"
        : stage === "debug"
          ? "debugging"
          : "understanding";

  return createTutorMessage(
    response ??
      (useChinese()
        ? `${runObservation(latestRunResult)} 你接下来最想理清的一个小问题是什么？`
        : `${runObservation(latestRunResult)} What is the next small uncertainty you want to reason through?`),
    stage,
    questionType,
    tutorMode,
  );
}

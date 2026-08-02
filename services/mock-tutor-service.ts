import type { CodeRunResult } from "@/types/code-run";
import type { GuidanceStage, TutorActionType, TutorMessage, TutorMode } from "@/types/tutor";
import { createTutorMessage } from "@/data/mock-tutor-conversations";

const MOCK_TUTOR_DELAY_MS = 850;

function waitForTutorDelay() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, MOCK_TUTOR_DELAY_MS));
}

function runObservation(latestRunResult?: CodeRunResult) {
  if (!latestRunResult) return "Your code has not been run yet.";
  if (latestRunResult.status === "success") return "Your latest solution passed all available checks.";
  if (latestRunResult.status === "timeout") return "Your latest run did not finish within the time limit.";
  if (latestRunResult.error) return `Your latest run reported: ${latestRunResult.error.title}.`;
  return `Your latest output is ${latestRunResult.stdout.trim() || "empty"}.`;
}

function actionResponse(action: TutorActionType, run?: CodeRunResult) {
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
      `${runObservation(latestRunResult)} What is the next small uncertainty you want to reason through?`,
    stage,
    questionType,
    tutorMode,
  );
}

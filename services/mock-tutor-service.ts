import type { CodeRunResult } from "@/types/code-run";
import type {
  GuidanceStage,
  TutorActionType,
  TutorMessage,
} from "@/types/tutor";
import { createTutorMessage } from "@/data/mock-tutor-conversations";

const MOCK_TUTOR_DELAY_MS = 850;

function waitForTutorDelay() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, MOCK_TUTOR_DELAY_MS);
  });
}

function includesAny(text: string, terms: string[]) {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function responseForRunResult(latestRunResult?: CodeRunResult) {
  if (!latestRunResult) {
    return undefined;
  }

  if (latestRunResult.status === "success") {
    return "Great work. Your solution passed all available tests.\n\nCan you explain why your loop includes every integer from 1 through n?";
  }

  if (latestRunResult.status === "timeout") {
    return "Your program took too long to finish.\n\nWhat condition would allow the loop to eventually stop?";
  }

  if (latestRunResult.error?.type === "syntax") {
    return "Your code could not run because of a syntax issue.\n\nWhat punctuation does Python expect at the end of a loop statement?";
  }

  if (latestRunResult.error?.type === "runtime") {
    return "Your program refers to a name that Python cannot find.\n\nWhich variable name in the error message is different from the one you defined?";
  }

  return undefined;
}

function getActionResponse({
  action,
  hasStudentReasoning,
  latestRunResult,
}: {
  action?: TutorActionType;
  hasStudentReasoning: boolean;
  latestRunResult?: CodeRunResult;
}) {
  if (action === "rephrase") {
    return "Let me ask it in a different way: during each loop step, what information should `total` remember?";
  }

  if (action === "smaller_hint") {
    return "Think about whether `total` should keep the most recent number or the sum collected so far.";
  }

  if (action === "check_reasoning" && !hasStudentReasoning) {
    return "Share your reasoning first, and I’ll help you examine it.";
  }

  if (action === "check_reasoning") {
    return "Which part of your reasoning explains why the printed value should change from `0`?";
  }

  return responseForRunResult(latestRunResult);
}

export async function getMockTutorResponse({
  studentMessage,
  stage,
  conversation,
  action = "message",
  latestRunResult,
}: {
  taskId: string;
  studentMessage: string;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  stage: GuidanceStage;
  conversation: TutorMessage[];
  action?: TutorActionType;
}): Promise<TutorMessage> {
  await waitForTutorDelay();

  const hasStudentReasoning = conversation.some(
    (message) => message.role === "student",
  );
  const actionResponse = getActionResponse({
    action,
    hasStudentReasoning,
    latestRunResult,
  });

  if (actionResponse) {
    return createTutorMessage(
      actionResponse,
      stage,
      stage === "reflect" ? "reflection" : "debugging",
    );
  }

  if (
    includesAny(studentMessage, [
      "give me the code",
      "tell me the answer",
      "fix it",
      "solution",
      "answer",
    ])
  ) {
    return createTutorMessage(
      "I won’t write the complete solution for you, but I can help you build it step by step. Which part feels less clear: choosing the loop range or updating the total?",
      stage,
      "decomposition",
    );
  }

  if (includesAny(studentMessage, ["sum", "accumulator", "running total", "累加"])) {
    return createTutorMessage(
      "That sounds like an accumulator. What value should it have before the loop processes the first number?",
      stage,
      "understanding",
    );
  }

  if (includesAny(studentMessage, ["start at 0", "starts at 0", "zero", "0"])) {
    return createTutorMessage(
      "Why is 0 a reasonable starting value for a running total?",
      stage,
      "understanding",
    );
  }

  if (includesAny(studentMessage, ["loop from 1 to n", "1 to n", "range"])) {
    return createTutorMessage(
      "How will you make sure the loop includes n rather than stopping before it?",
      stage,
      "debugging",
    );
  }

  if (
    includesAny(studentMessage, [
      "i don't know",
      "i dont know",
      "not sure",
      "不知道",
      "不懂",
    ])
  ) {
    return createTutorMessage(
      "Let’s make the question smaller. If n is 3, what values should be added together?",
      stage,
      "decomposition",
    );
  }

  return createTutorMessage(
    "Let’s reconnect this to your current result. Your program prints `0`. Which variable would need to change before the final print statement?",
    stage,
    "debugging",
  );
}

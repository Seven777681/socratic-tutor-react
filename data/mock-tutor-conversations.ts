import type { GuidanceStage, TutorMessage, TutorMode, TutorQuestionType } from "@/types/tutor";

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function createInitialTutorMessages({
  stage,
  mode,
  taskTitle,
  hasRunResult,
}: {
  stage: GuidanceStage;
  mode: TutorMode;
  taskTitle: string;
  hasRunResult: boolean;
}): TutorMessage[] {
  const timestamp = new Date().toISOString();
  const content =
    stage === "plan"
      ? `Let's start with "${taskTitle}". What is the main goal your program needs to accomplish before you write code?`
      : stage === "reflect"
        ? `Your latest run is available for "${taskTitle}". What part of your solution explains why the result is correct?`
        : stage === "debug" && hasRunResult
          ? `Look at the latest run for "${taskTitle}". What is the first difference between what you expected and what happened?`
          : `For "${taskTitle}", what is the next small uncertainty you want to reason through?`;

  return [
    {
      id: createMessageId("tutor"),
      role: "tutor",
      content,
      timestamp,
      questionType:
        stage === "reflect"
          ? "reflection"
          : stage === "plan"
            ? "understanding"
            : "debugging",
      stage,
      mode,
    },
  ];
}

export function createTutorMessage(
  content: string,
  stage: GuidanceStage,
  questionType: TutorQuestionType = "debugging",
  mode?: TutorMode,
): TutorMessage {
  return {
    id: createMessageId("tutor"),
    role: "tutor",
    content,
    timestamp: new Date().toISOString(),
    questionType,
    stage,
    mode,
  };
}

export function createSystemTutorMessage(
  content: string,
  stage: GuidanceStage,
): TutorMessage {
  return {
    id: createMessageId("system"),
    role: "system",
    content,
    timestamp: new Date().toISOString(),
    stage,
  };
}

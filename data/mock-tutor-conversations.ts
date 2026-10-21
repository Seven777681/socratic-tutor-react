import type { GuidanceStage, TutorMessage, TutorMode, TutorQuestionType } from "@/types/tutor";

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function useChinese() {
  return typeof window !== "undefined" && window.localStorage.getItem("socratic-tutor-language") === "zh";
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
  const content = useChinese()
    ? stage === "plan"
      ? `我们从“${taskTitle}”开始。编写代码前，你认为程序最主要的目标是什么？`
      : stage === "reflect"
        ? `“${taskTitle}”的最新运行结果已经生成。你的解法中，哪一部分能够说明结果为什么正确？`
        : stage === "debug" && hasRunResult
          ? `请查看“${taskTitle}”的最新运行结果。预期结果与实际结果之间最先出现的差异是什么？`
          : `针对“${taskTitle}”，你接下来最想理清的一个小问题是什么？`
    :
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

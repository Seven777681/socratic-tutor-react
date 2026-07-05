import type { GuidanceStage, TutorMessage, TutorQuestionType } from "@/types/tutor";

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function createInitialTutorMessages(stage: GuidanceStage): TutorMessage[] {
  const timestamp = new Date().toISOString();

  return [
    {
      id: createMessageId("system"),
      role: "system",
      content:
        "I can see your latest run completed, but none of the checks passed.",
      timestamp,
      stage,
    },
    {
      id: createMessageId("tutor"),
      role: "tutor",
      content:
        "Your program currently prints `0`.\n\nBefore writing the loop, what should the variable `total` represent while the program is running?",
      timestamp,
      questionType: "debugging",
      stage,
    },
  ];
}

export function createTutorMessage(
  content: string,
  stage: GuidanceStage,
  questionType: TutorQuestionType = "debugging",
): TutorMessage {
  return {
    id: createMessageId("tutor"),
    role: "tutor",
    content,
    timestamp: new Date().toISOString(),
    questionType,
    stage,
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

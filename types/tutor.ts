import type { CodeRunResult } from "@/types/code-run";

export type GuidanceStage = "understand" | "plan" | "code" | "debug" | "reflect";

export type TutorQuestionType =
  | "understanding"
  | "decomposition"
  | "debugging"
  | "reflection"
  | "transfer";

export type TutorActionType =
  | "message"
  | "rephrase"
  | "smaller_hint"
  | "check_reasoning";

export type TutorStatus = "ready" | "thinking" | "offline";

export interface TutorMessage {
  id: string;
  role: "student" | "tutor" | "system";
  content: string;
  timestamp: string;
  questionType?: TutorQuestionType;
  stage?: GuidanceStage;
  actionType?: TutorActionType;
}

export interface TutorConversation {
  id: string;
  taskId: string;
  stage: GuidanceStage;
  messages: TutorMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface TutorRequest {
  taskId: string;
  studentMessage: string;
  currentCode: string;
  latestRunId?: string;
  conversationId: string;
  stage: GuidanceStage;
}

export interface TutorContextSnapshot {
  taskId: string;
  taskTitle: string;
  topic: string;
  stage: GuidanceStage;
  currentCodeLineCount: number;
  latestRunResult?: CodeRunResult;
  lastActivity: "Code edited" | "Code run" | "Conversation";
}

import type { CodeRunResult } from "@/types/code-run";

export type GuidanceStage = "understand" | "plan" | "code" | "debug" | "reflect";

export type TutorMode =
  | "step_by_step"
  | "explore_strategies"
  | "run_and_reflect";

export type TutorQuestionType =
  | "understanding"
  | "decomposition"
  | "debugging"
  | "reflection"
  | "transfer"
  | "strategy_comparison";

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
  mode?: TutorMode;
  visibleReasoningSummary?: string;
}

export interface TutorConversation {
  id: string;
  taskId: string;
  stage: GuidanceStage;
  mode: TutorMode;
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
  mode: TutorMode;
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

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
  | "check_reasoning"
  | "debug"
  | "check_edge_cases"
  | "reflect_solution"
  | "review_plan"
  | "understand_problem"
  | "explain_success"
  | "generate_reflection_summary";

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
  choicePrompt?: "planning_entry";
  agentTrace?: TutorAgentTraceItem[];
  planReview?: TutorPlanReview;
  planInteraction?: TutorPlanInteraction;
}

export interface TutorAgentTraceItem {
  agent: string;
  label: string;
  summary: string;
}

export interface TutorPlanReview {
  understandingScore: number;
  missingSteps: string[];
  canEnterCoding: boolean;
}

export interface TutorPlanInteraction extends TutorPlanReview {
  showReviewCard: boolean;
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
  taskTitle?: string;
  taskDescription?: string;
  studentMessage: string;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  planningData?: {
    status: string;
    approach: string;
    steps: string[];
  };
  latestPrediction?: string;
  hintLevel?: number;
  conversationId: string;
  stage: GuidanceStage;
  mode: TutorMode;
  conversation: TutorMessage[];
  action: TutorActionType;
}

export interface TutorResponse {
  message: TutorMessage;
}

export interface TutorContextSnapshot {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  topic: string;
  stage: GuidanceStage;
  planningStatus: string;
  latestPrediction: string;
  currentCodeLineCount: number;
  latestRunResult?: CodeRunResult;
  latestError?: string;
  hintLevel: number;
  lastActivity: "Code edited" | "Code run" | "Conversation";
}

export interface TutorLearningContext {
  planningStatus: string;
  planningApproach: string;
  planningSteps: string[];
  latestPrediction: string;
  hintLevel: number;
}

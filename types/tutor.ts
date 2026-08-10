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

export type TutorQuestionStrategy =
  | "prediction"
  | "counterexample"
  | "decomposition"
  | "comparison"
  | "trace_execution"
  | "explain_reasoning"
  | "transfer";

export type TutorActionType =
  | "message"
  | "rephrase"
  | "smaller_hint"
  | "check_reasoning"
  | "debug"
  | "check_edge_cases"
  | "reflect_solution"
  | "review_plan"
  | "explain_success"
  | "generate_reflection_summary";

export type TutorStatus = "ready" | "thinking" | "offline";

export interface TutorMessage {
  id: string;
  role: "student" | "tutor" | "system";
  content: string;
  timestamp: string;
  questionType?: TutorQuestionType;
  questionStrategy?: TutorQuestionStrategy;
  stage?: GuidanceStage;
  actionType?: TutorActionType;
  mode?: TutorMode;
  hintLevel?: number;
  agentTrace?: TutorAgentTrace[];
  understandingAssessment?: TutorUnderstandingAssessment;
  codeAnalysis?: TutorCodeAnalysis;
}

export type TutorErrorLayer =
  | "none"
  | "syntax"
  | "implementation"
  | "algorithm"
  | "task_misunderstanding"
  | "testing";

export type TutorErrorPattern =
  | "none"
  | "off_by_one"
  | "wrong_initialization"
  | "incorrect_condition"
  | "state_update"
  | "input_parsing"
  | "output_format"
  | "type_mismatch"
  | "missing_case"
  | "infinite_loop"
  | "unknown";

export interface TutorCounterexample {
  input: string;
  expectedBehavior: string;
  investigationReason: string;
  evidence: "run_evidence" | "static_inference";
}

export interface TutorExecutionTraceStep {
  step: number;
  lineNumber: number | null;
  variables: Array<{ name: string; value: string }>;
  observation: string;
  evidence: "run_evidence" | "static_inference" | "student_prediction";
}

export interface TutorErrorPatternHistory {
  repeatedPattern: TutorErrorPattern;
  occurrenceCount: number;
  isRepeated: boolean;
}

export interface TutorCodeAnalysis {
  hasError: boolean;
  errorType: string;
  errorLayer: TutorErrorLayer;
  likelyPattern: TutorErrorPattern;
  suspectedLineNumbers: number[];
  counterexample: TutorCounterexample | null;
  executionTrace: TutorExecutionTraceStep[];
  patternHistory: TutorErrorPatternHistory;
  predictionMismatch: boolean;
  summary: string;
  investigationFocus: string;
}

export interface TutorUnderstandingAssessment {
  dimensions: {
    goal: number;
    input: number;
    output: number;
    constraints: number;
    stepOrder: number;
  };
  misconceptions: Array<{
    type:
      | "task_goal"
      | "input"
      | "output"
      | "constraint"
      | "step_order"
      | "algorithm";
    evidence: string;
  }>;
  confidence: {
    studentConfidence: number;
    normalizedConfidence: number | null;
    assessedUnderstanding: number;
    gap: number | null;
    calibration:
      | "not_provided"
      | "well_calibrated"
      | "overconfident"
      | "underconfident";
  };
}

export type TutorAgentName =
  | "problem_understanding"
  | "socratic_questioning"
  | "code_analysis"
  | "metacognitive_monitor"
  | "assessment";

export interface TutorAgentTrace {
  agent: TutorAgentName;
  summary: string;
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
    confidenceRating?: number;
  };
  latestPrediction?: string;
  hintLevel?: number;
  idleSeconds?: number;
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
  confidenceRating: number;
  latestPrediction: string;
  hintLevel: number;
}

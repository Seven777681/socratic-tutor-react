import type { CodeRunResult } from "@/types/code-run";
import type { TaskPedagogy } from "@/types/task";

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
  | "understand_problem"
  | "explain_success"
  | "generate_reflection_summary";

export type TutorStatus = "ready" | "thinking" | "offline";

export type LearnerConceptStatus = "missing" | "partial" | "understood";
export type LearnerAnswerQuality =
  | "correct"
  | "partial"
  | "off_target"
  | "uncertain";

export interface TutorLearnerState {
  currentFocus: string;
  hintLevel: number;
  attemptsOnFocus: number;
  consecutiveOffTarget: number;
  studentState: "beginner" | "confused" | "understanding";
  concepts: Record<
    string,
    {
      status: LearnerConceptStatus;
      confidence: number;
      evidence: string;
    }
  >;
  latestAnswer: {
    quality: LearnerAnswerQuality;
    recognizedIdeas: string[];
    missingIdeas: string[];
    misconception?: string;
  };
}

export interface TutorMessage {
  id: string;
  role: "student" | "tutor" | "system";
  content: string;
  timestamp: string;
  questionType?: TutorQuestionType;
  questionStrategy?: TutorQuestionStrategy;
  hintLevel?: number;
  learnerState?: TutorLearnerState;
  stage?: GuidanceStage;
  actionType?: TutorActionType;
  mode?: TutorMode;
  choicePrompt?: "planning_entry";
  agentTrace?: TutorAgentTrace[];
  planReview?: TutorPlanReview;
  planInteraction?: TutorPlanInteraction;
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
  agent: string;
  label?: string;
  summary: string;
}

export type TutorAgentTraceItem = TutorAgentTrace;

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
  taskPedagogy?: TaskPedagogy;
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

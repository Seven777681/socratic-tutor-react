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
  | "generate_reflection_summary"
  | "idle_check_in";

export type TutorStatus = "ready" | "thinking" | "offline";

export type LearnerConceptStatus = "missing" | "partial" | "understood";
export type LearnerAnswerQuality =
  | "correct"
  | "partial"
  | "off_target"
  | "uncertain";

export type TutorLearningFocus =
  | "goal"
  | "input"
  | "output"
  | "constraints"
  | "step_order"
  | "plan_complete"
  | "coding_progress"
  | "debugging"
  | "reflection_learning";

export type TutorCodeChangeQuality = "none" | "cosmetic" | "meaningful";

export type TutorProgressState =
  | "exploring"
  | "uncertain"
  | "stuck"
  | "recovering"
  | "independent";

export type TutorIntervention =
  | "wait"
  | "encourage"
  | "ask_prediction"
  | "break_down_problem"
  | "show_counterexample"
  | "increase_hint"
  | "return_to_plan";

export type TutorQuestionStyle =
  | "question_based"
  | "example_based"
  | "step_by_step"
  | "comparison_based";

export interface TutorSupportProfile {
  preferredWaitTime: number;
  typicalAttemptsBeforeHint: number;
  preferredQuestionStyle: TutorQuestionStyle;
}

export interface TutorLearnerState {
  currentFocus: TutorLearningFocus;
  hintLevel: number;
  attemptsOnFocus: number;
  consecutiveOffTarget: number;
  learningState: TutorProgressState;
  codeChangeQuality: TutorCodeChangeQuality;
  productiveStruggle: boolean;
  intervention: TutorIntervention;
  supportProfile: TutorSupportProfile;
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
    focusResolved: boolean;
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
  learningAssessment?: TutorLearningAssessment;
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

export type TutorCapabilityDimension =
  | "problemUnderstanding"
  | "planning"
  | "implementation"
  | "debugging"
  | "reflection"
  | "independence";

export interface TutorLearningAssessment {
  capabilities: Record<TutorCapabilityDimension, number>;
  evidenceBasedEvaluation: Array<{
    dimension: TutorCapabilityDimension;
    judgment: string;
    evidence: string[];
  }>;
  timeline: Array<{
    order: number;
    event: string;
    evidence: string;
  }>;
  transferTask: {
    title: string;
    objective: string;
    differenceFromCurrent: string;
    reason: string;
    evidence: string[];
    suggestedDifficulty: "easier" | "similar" | "harder";
  };
  teacherReport: {
    commonDifficulties: string[];
    maxHintLevel: number;
    aiReliance: "low" | "moderate" | "high";
    effectiveQuestionStrategies: TutorQuestionStrategy[];
    understandingVerdict: "demonstrated" | "partial" | "insufficient_evidence";
    understandingEvidence: string;
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
  previousCode?: string;
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

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { createLlmClient } from "@/lib/server/llm-client";
import {
  assessmentSchema,
  codeAnalysisSchema,
  metacognitiveSchema,
  problemUnderstandingSchema,
  socraticResponseSchema,
  type AssessmentOutput,
  type CodeAnalysisOutput,
  type MetacognitiveOutput,
  type ProblemUnderstandingOutput,
  type SocraticResponseOutput,
} from "@/lib/server/tutor-agent-schemas";
import {
  analyzeTutorLearningSignals,
  calculateNextHintLevel,
} from "@/lib/server/tutor-learning-signals";
import {
  calculateConfidenceAssessment,
  type ConfidenceAssessment,
} from "@/lib/server/tutor-understanding-assessment";
import {
  createSafeStrategyQuestion,
  selectTutorQuestionStrategy,
} from "@/lib/server/tutor-question-strategy";
import { evaluateTutorResponse } from "@/lib/server/tutor-response-guard";
import {
  buildErrorPatternHistory,
  collectRecentErrorPatterns,
} from "@/lib/server/tutor-error-history";
import { normalizeCodeAnalysisEvidence } from "@/lib/server/tutor-code-evidence";
import type {
  TutorAgentTrace,
  TutorCodeAnalysis,
  TutorErrorLayer,
  TutorErrorPatternHistory,
  TutorQuestionStrategy,
  TutorQuestionType,
  TutorPlanInteraction,
  TutorPlanReview,
  TutorRequest,
  TutorUnderstandingAssessment,
} from "@/types/tutor";

const TutorState = Annotation.Root({
  request: Annotation<TutorRequest>(),
  understandingScore: Annotation<number>(),
  understandingDimensions: Annotation<ProblemUnderstandingOutput["dimensions"]>(),
  misconceptions: Annotation<ProblemUnderstandingOutput["misconceptions"]>(),
  confidenceAssessment: Annotation<ConfidenceAssessment>(),
  planStatus: Annotation<"missing" | "needs_revision" | "ready">(),
  missingPlanElement: Annotation<string>(),
  codeHasError: Annotation<boolean>(),
  codeErrorType: Annotation<string>(),
  errorLayer: Annotation<TutorErrorLayer>(),
  likelyErrorPattern: Annotation<CodeAnalysisOutput["likelyPattern"]>(),
  suspectedLineNumbers: Annotation<number[]>(),
  counterexample: Annotation<CodeAnalysisOutput["counterexample"]>(),
  executionTrace: Annotation<CodeAnalysisOutput["executionTrace"]>(),
  errorPatternHistory: Annotation<TutorErrorPatternHistory>(),
  predictionMismatch: Annotation<boolean>(),
  analysisSummary: Annotation<string>(),
  investigationFocus: Annotation<string>(),
  codeAnalysisSummary: Annotation<string>(),
  codeInvestigationFocus: Annotation<string>(),
  confusionLevel: Annotation<number>(),
  isStuck: Annotation<boolean>(),
  hintLevel: Annotation<number>(),
  metacognitiveReason: Annotation<string>(),
  reflectionFocus: Annotation<string>(),
  taskFinished: Annotation<boolean>(),
  finalContent: Annotation<string>(),
  questionType: Annotation<TutorQuestionType>(),
  questionStrategy: Annotation<TutorQuestionStrategy>(),
  trace: Annotation<TutorAgentTrace[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

type TutorGraphState = typeof TutorState.State;

export interface MultiAgentTutorResult {
  content: string;
  questionType: TutorQuestionType;
  questionStrategy?: TutorQuestionStrategy;
  hintLevel: number;
  trace: TutorAgentTrace[];
  understandingAssessment?: TutorUnderstandingAssessment;
  codeAnalysis?: TutorCodeAnalysis;
  planReview?: TutorPlanReview;
  planInteraction?: TutorPlanInteraction;
}

const hintRules = [
  "Level 0: ask only a metacognitive question; give no technical clue.",
  "Level 1: give a conceptual clue without naming exact syntax.",
  "Level 2: name a useful programming construct or syntax direction, but no code.",
  "Level 3: give pseudocode or a tiny unrelated syntax example; never provide task-specific solution code.",
] as const;

function recentConversation(request: TutorRequest) {
  return request.conversation
    .slice(-8)
    .map(({ role, content }) => ({ role, content }));
}

function taskContext(request: TutorRequest) {
  return {
    task: {
      title: request.taskTitle ?? "",
      description: request.taskDescription ?? "",
    },
    stage: request.stage,
    action: request.action,
    studentMessage: request.studentMessage,
    plan: request.planningData ?? { status: "not_started", approach: "", steps: [] },
    currentCode: request.currentCode.slice(0, 6_000),
    prediction: request.latestPrediction ?? "",
    runResult: request.latestRunResult ?? null,
    recentErrorPatterns: collectRecentErrorPatterns(request),
    learningSignals: analyzeTutorLearningSignals(request),
    recentConversation: recentConversation(request),
  };
}

function inferStoredHintLevel(request: TutorRequest) {
  return Math.min(
    3,
    Math.max(
      request.hintLevel ?? 0,
      ...request.conversation.map((message) => message.hintLevel ?? 0),
    ),
  );
}

async function problemUnderstandingAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const output = await llm.generateJson<ProblemUnderstandingOutput>({
    schema: problemUnderstandingSchema,
    responseSchemaName: "problem_understanding",
    systemPrompt:
      "You are the Problem Understanding Agent in a Socratic programming tutor. Evaluate the student's demonstrated understanding across five separate dimensions: goal, input, output, constraints, and step order. Detect only misconceptions supported by the student's own plan or messages and include a short evidence statement for each one. An omitted idea is not automatically a misconception. Do not solve the task and do not write code. Scores must be evidence-based: 0 means no demonstrated understanding and 10 means complete, accurate understanding.",
    userPrompt: JSON.stringify(taskContext(state.request)),
  });
  const confidenceAssessment = calculateConfidenceAssessment({
    confidenceRating: state.request.planningData?.confidenceRating,
    dimensions: output.dimensions,
  });
  const misconceptionSummary = output.misconceptions.length
    ? ` Misconceptions: ${output.misconceptions.map((item) => item.type).join(", ")}.`
    : " No evidenced misconception was detected.";
  return {
    understandingScore: confidenceAssessment.assessedUnderstanding,
    understandingDimensions: output.dimensions,
    misconceptions: output.misconceptions,
    confidenceAssessment,
    planStatus: output.planStatus,
    missingPlanElement: output.missingPlanElement,
    analysisSummary: output.summary,
    investigationFocus: output.nextQuestionFocus,
    trace: [{
      agent: "problem_understanding" as const,
      summary: `${output.summary} Confidence calibration: ${confidenceAssessment.calibration}.${misconceptionSummary}`,
    }],
  };
}

async function codeAnalysisAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const output = await llm.generateJson<CodeAnalysisOutput>({
    schema: codeAnalysisSchema,
    responseSchemaName: "code_analysis",
    systemPrompt:
      "You are the Code Analysis Agent. Analyze only the supplied code, student prediction, and trusted run/test evidence. Classify the error layer: syntax, implementation, algorithm, task_misunderstanding, or testing; use none when no error is supported. Identify a likely reusable error pattern. When useful, propose the smallest counterexample input, but label it static_inference unless that exact input appears in trusted test evidence. Build at most 8 concise trace steps. Never present inferred variable values as actual execution: label each step run_evidence, static_inference, or student_prediction. If evidence is insufficient, return null counterexample or an empty trace. Do not execute code, invent test results, repair the code, or reveal a solution.",
    userPrompt: JSON.stringify(taskContext(state.request)),
  });
  const errorPatternHistory = buildErrorPatternHistory({
    request: state.request,
    currentPattern: output.likelyPattern,
  });
  const normalizedEvidence = normalizeCodeAnalysisEvidence({
    request: state.request,
    counterexample: output.counterexample,
    executionTrace: output.executionTrace,
  });
  const repeatedSummary = errorPatternHistory.isRepeated
    ? ` Repeated ${errorPatternHistory.repeatedPattern} pattern (${errorPatternHistory.occurrenceCount} occurrences).`
    : "";
  return {
    codeHasError: output.hasError,
    codeErrorType: output.errorType,
    errorLayer: output.errorLayer,
    likelyErrorPattern: output.likelyPattern,
    suspectedLineNumbers: output.suspectedLineNumbers,
    counterexample: normalizedEvidence.counterexample,
    executionTrace: normalizedEvidence.executionTrace,
    errorPatternHistory,
    predictionMismatch: output.predictionMismatch,
    analysisSummary: output.summary,
    investigationFocus: output.investigationFocus,
    codeAnalysisSummary: output.summary,
    codeInvestigationFocus: output.investigationFocus,
    taskFinished: state.request.latestRunResult?.status === "success" && !output.hasError,
    trace: [{
      agent: "code_analysis" as const,
      summary: `${output.summary} Error layer: ${output.errorLayer}.${repeatedSummary}`,
    }],
  };
}

async function metacognitiveAgent(state: TutorGraphState) {
  const request = state.request;
  const currentHintLevel = inferStoredHintLevel(request);
  const learningSignals = analyzeTutorLearningSignals(request);
  const llm = createLlmClient();
  const output = await llm.generateJson<MetacognitiveOutput>({
    schema: metacognitiveSchema,
    responseSchemaName: "metacognitive_monitor",
    systemPrompt:
      "You are the Metacognitive Monitoring Agent. Judge struggle from the supplied evidence: uncertainty, repeated attempts, repeated errors, prediction mismatch, or at least 60 seconds of inactivity. Do not diagnose personal traits. Recommend the smallest useful support increase and one reflection focus. Do not answer the programming task.",
    userPrompt: JSON.stringify({
      context: taskContext(request),
      learningSignals: {
        ...learningSignals,
        codeHasError: state.codeHasError,
        codeErrorType: state.codeErrorType,
        predictionMismatch: state.predictionMismatch,
        errorLayer: state.errorLayer,
        errorPatternHistory: state.errorPatternHistory,
      },
      currentHintLevel,
    }),
  });
  const shouldIncrease =
    learningSignals.shouldEscalateHint ||
    output.shouldIncreaseHint;
  const hintLevel = calculateNextHintLevel({
    currentHintLevel,
    confusionLevel: output.confusionLevel,
    shouldIncrease,
  });
  const evidenceSummary = learningSignals.reasons.length
    ? ` Evidence: ${learningSignals.reasons.join("; ")}.`
    : "";
  return {
    confusionLevel: output.confusionLevel,
    isStuck: learningSignals.isLikelyStuck || output.isStuck,
    hintLevel,
    metacognitiveReason: output.reason,
    reflectionFocus: output.reflectionFocus,
    trace: [{
      agent: "metacognitive_monitor" as const,
      summary: `${output.reason}${evidenceSummary}`,
    }],
  };
}

async function socraticQuestioningAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const questionStrategy = selectTutorQuestionStrategy({
    request: state.request,
    codeHasError: state.codeHasError,
    predictionMismatch: state.predictionMismatch,
  });
  const recentTutorQuestions = state.request.conversation
    .filter((message) => message.role === "tutor")
    .slice(-5)
    .map((message) => message.content);
  const generationContext = {
    requiredQuestionStrategy: questionStrategy,
    context: taskContext(state.request),
    understanding: {
      score: state.understandingScore,
      dimensions: state.understandingDimensions,
      misconceptions: state.misconceptions,
      confidenceAssessment: state.confidenceAssessment,
      planStatus: state.planStatus,
      missingPlanElement: state.missingPlanElement,
    },
    codeAnalysis: {
      hasError: state.codeHasError,
      errorType: state.codeErrorType,
      errorLayer: state.errorLayer,
      likelyPattern: state.likelyErrorPattern,
      suspectedLineNumbers: state.suspectedLineNumbers,
      counterexample: state.counterexample,
      executionTrace: state.executionTrace,
      errorPatternHistory: state.errorPatternHistory,
      predictionMismatch: state.predictionMismatch,
      summary: state.codeAnalysisSummary,
      investigationFocus: state.codeInvestigationFocus,
    },
    metacognition: {
      confusionLevel: state.confusionLevel,
      isStuck: state.isStuck,
      reflectionFocus: state.reflectionFocus,
    },
    hintLevel: state.hintLevel,
    recentTutorQuestions,
  };
  const systemPrompt = `You are the student-facing Socratic Questioning Agent. Use exactly the required question strategy and produce exactly one warm, concise, actionable primary question in the student's language when clear. optionalPrompt may contain one short supportive statement but no additional question; use an empty string when it is unnecessary. Never provide the full answer or task-specific solution code. Follow exactly this support boundary: ${hintRules[state.hintLevel]}. Set supportType truthfully to metacognitive, concept, syntax_direction, or pseudocode. Treat confidence as self-report, never as proof of correctness. If confidence is higher than demonstrated understanding, ask for evidence around the weakest dimension without labeling the student as overconfident. If confidence is lower, briefly acknowledge a demonstrated strength before the next focused question.`;

  let output = await llm.generateJson<SocraticResponseOutput>({
    schema: socraticResponseSchema,
    responseSchemaName: "socratic_questioning",
    systemPrompt,
    userPrompt: JSON.stringify(generationContext),
  });
  let guard = evaluateTutorResponse({
    candidate: output,
    hintLevel: state.hintLevel,
    recentTutorQuestions,
  });
  let guardOutcome = "passed";

  if (!guard.safe) {
    const firstViolations = guard.violations;
    output = await llm.generateJson<SocraticResponseOutput>({
      schema: socraticResponseSchema,
      responseSchemaName: "socratic_questioning_revision",
      systemPrompt,
      userPrompt: JSON.stringify({
        ...generationContext,
        rejectedCandidate: output,
        guardViolations: firstViolations,
        revisionInstruction:
          "Rewrite the response once and remove every listed violation. Do not defend the rejected response.",
      }),
    });
    guard = evaluateTutorResponse({
      candidate: output,
      hintLevel: state.hintLevel,
      recentTutorQuestions,
    });
    guardOutcome = "rewritten";
  }

  if (!guard.safe) {
    output = {
      primaryQuestion: createSafeStrategyQuestion(
        questionStrategy,
        `${state.request.studentMessage} ${recentConversation(state.request).map((message) => message.content).join(" ")}`,
      ),
      optionalPrompt: "",
      supportType: "metacognitive",
      questionType:
        questionStrategy === "comparison"
          ? "strategy_comparison"
          : questionStrategy === "transfer"
            ? "transfer"
            : questionStrategy === "counterexample" || questionStrategy === "trace_execution"
              ? "debugging"
              : questionStrategy === "decomposition"
                ? "decomposition"
                : "reflection",
    };
    guardOutcome = "local_safe_fallback";
  }

  const finalContent = output.optionalPrompt.trim()
    ? `${output.primaryQuestion}\n\n${output.optionalPrompt}`
    : output.primaryQuestion;
  return {
    finalContent,
    questionType: output.questionType,
    questionStrategy,
    trace: [{
      agent: "socratic_questioning" as const,
      summary: `Used ${questionStrategy} at Hint Level ${state.hintLevel}; response guard ${guardOutcome}.`,
    }],
  };
}

async function assessmentAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const output = await llm.generateJson<AssessmentOutput>({
    schema: assessmentSchema,
    responseSchemaName: "assessment",
    systemPrompt:
      "You are the Assessment and Reflection Agent. Use only the supplied task, code-run evidence, conversation, and student reflection. For a reflection-summary request, write a short personalized learning summary covering understanding, strategy, debugging, and transfer. Otherwise ask one reflective question. Do not claim correctness without passing run evidence and do not provide solution code.",
    userPrompt: JSON.stringify({
      context: taskContext(state.request),
      priorAnalysis: state.analysisSummary,
      metacognitiveReason: state.metacognitiveReason,
      currentErrorPatternHistory: state.errorPatternHistory,
    }),
  });
  const summary = [
    output.strengths[0],
    output.growthArea,
    output.transferableIdea,
  ].filter(Boolean).join(" ");
  return {
    finalContent: output.content,
    questionType: output.questionType,
    taskFinished: output.taskFinished,
    trace: [{ agent: "assessment" as const, summary }],
  };
}

export type TutorStartRoute =
  | "problem_understanding_agent"
  | "code_analysis_agent"
  | "metacognitive_agent"
  | "assessment_agent";

export function routeTutorRequest(request: TutorRequest): TutorStartRoute {
  const { action, stage, latestRunResult, currentCode } = request;
  if (action === "generate_reflection_summary" || stage === "reflect") {
    return "assessment_agent";
  }
  if (["understand", "plan"].includes(stage) || ["review_plan", "rephrase"].includes(action)) {
    return "problem_understanding_agent";
  }
  if (
    latestRunResult ||
    currentCode.trim() ||
    ["debug", "check_edge_cases", "explain_success", "reflect_solution"].includes(action)
  ) {
    return "code_analysis_agent";
  }
  return "metacognitive_agent";
}

function routeTutorStart(state: TutorGraphState): TutorStartRoute {
  return routeTutorRequest(state.request);
}

function routeAfterMetacognition(state: TutorGraphState) {
  return state.taskFinished ? "assessment_agent" : "socratic_questioning_agent";
}

export function routeAfterCodeAnalysisLayer(errorLayer: TutorErrorLayer) {
  return errorLayer === "task_misunderstanding"
    ? "problem_understanding_agent"
    : "metacognitive_agent";
}

function routeAfterCodeAnalysis(state: TutorGraphState) {
  return routeAfterCodeAnalysisLayer(state.errorLayer);
}

const tutorGraph = new StateGraph(TutorState)
  .addNode("problem_understanding_agent", problemUnderstandingAgent)
  .addNode("code_analysis_agent", codeAnalysisAgent)
  .addNode("metacognitive_agent", metacognitiveAgent)
  .addNode("socratic_questioning_agent", socraticQuestioningAgent)
  .addNode("assessment_agent", assessmentAgent)
  .addConditionalEdges(START, routeTutorStart)
  .addEdge("problem_understanding_agent", "metacognitive_agent")
  .addConditionalEdges("code_analysis_agent", routeAfterCodeAnalysis)
  .addConditionalEdges("metacognitive_agent", routeAfterMetacognition)
  .addEdge("socratic_questioning_agent", END)
  .addEdge("assessment_agent", END)
  .compile();

export async function runTutorMultiAgent(
  request: TutorRequest,
): Promise<MultiAgentTutorResult | null> {
  const llm = createLlmClient();
  if (!llm.isConfigured) return null;

  const result = await tutorGraph.invoke({
    request,
    understandingScore: 0,
    understandingDimensions: {
      goal: 0,
      input: 0,
      output: 0,
      constraints: 0,
      stepOrder: 0,
    },
    misconceptions: [],
    confidenceAssessment: {
      studentConfidence: request.planningData?.confidenceRating ?? 0,
      normalizedConfidence: null,
      assessedUnderstanding: 0,
      gap: null,
      calibration: "not_provided",
    },
    planStatus: "missing",
    missingPlanElement: "",
    codeHasError: false,
    codeErrorType: "none",
    errorLayer: "none",
    likelyErrorPattern: "none",
    suspectedLineNumbers: [],
    counterexample: null,
    executionTrace: [],
    errorPatternHistory: {
      repeatedPattern: "none",
      occurrenceCount: 0,
      isRepeated: false,
    },
    predictionMismatch: false,
    analysisSummary: "",
    investigationFocus: "",
    codeAnalysisSummary: "",
    codeInvestigationFocus: "",
    confusionLevel: 0,
    isStuck: false,
    hintLevel: inferStoredHintLevel(request),
    metacognitiveReason: "",
    reflectionFocus: "",
    taskFinished: request.latestRunResult?.status === "success",
    finalContent: "",
    questionType: "understanding",
    questionStrategy: "explain_reasoning",
    trace: [],
  });
  if (!result.finalContent.trim()) {
    throw new Error("The tutor graph produced an empty response.");
  }
  const ranProblemUnderstanding = result.trace.some(
    (entry) => entry.agent === "problem_understanding",
  );
  const planReviewData: TutorPlanReview | undefined = ranProblemUnderstanding
    ? {
        understandingScore: result.understandingScore,
        missingSteps: result.missingPlanElement.trim()
          ? [result.missingPlanElement]
          : [],
        canEnterCoding:
          result.planStatus === "ready" && result.understandingScore >= 7,
      }
    : undefined;
  return {
    content: result.finalContent,
    questionType: result.questionType,
    questionStrategy: result.questionStrategy,
    hintLevel: result.hintLevel,
    trace: result.trace,
    understandingAssessment: ranProblemUnderstanding
      ? {
          dimensions: result.understandingDimensions,
          misconceptions: result.misconceptions,
          confidence: result.confidenceAssessment,
        }
      : undefined,
    planReview:
      planReviewData && request.action === "review_plan" && !request.studentMessage.trim()
        ? planReviewData
        : undefined,
    planInteraction:
      planReviewData && request.stage === "plan" && request.studentMessage.trim()
        ? { ...planReviewData, showReviewCard: false }
        : undefined,
    codeAnalysis: result.trace.some((entry) => entry.agent === "code_analysis")
      ? {
          hasError: result.codeHasError,
          errorType: result.codeErrorType,
          errorLayer: result.errorLayer,
          likelyPattern: result.likelyErrorPattern,
          suspectedLineNumbers: result.suspectedLineNumbers,
          counterexample: result.counterexample,
          executionTrace: result.executionTrace,
          patternHistory: result.errorPatternHistory,
          predictionMismatch: result.predictionMismatch,
          summary: result.codeAnalysisSummary,
          investigationFocus: result.codeInvestigationFocus,
        }
      : undefined,
  };
}

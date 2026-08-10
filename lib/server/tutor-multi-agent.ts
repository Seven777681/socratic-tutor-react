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
import { reconcileCodeAnalysisWithRunEvidence } from "@/lib/server/tutor-code-analysis-guard";
import {
  createInitialLearnerState,
  createUnderstandingLearnerState,
  mergeMonitoredLearnerState,
} from "@/lib/server/tutor-learner-state";
import {
  adaptSupportProfile,
  analyzeCodeChangeQuality,
  detectProductiveStruggle,
  preferredStrategyForIntervention,
  reconcileMetacognitiveDecision,
} from "@/lib/server/tutor-metacognitive-policy";
import {
  buildTutorAssessmentEvidence,
  reconcileUnderstandingVerdict,
  resolveAssessmentEvidence,
} from "@/lib/server/tutor-assessment-evidence";
import type {
  TutorAgentTrace,
  TutorCodeAnalysis,
  TutorErrorLayer,
  TutorErrorPatternHistory,
  TutorLearnerState,
  TutorLearningAssessment,
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
  learnerState: Annotation<TutorLearnerState>(),
  learningAssessment: Annotation<TutorLearningAssessment | undefined>(),
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
  learnerState: TutorLearnerState;
  learningAssessment?: TutorLearningAssessment;
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

export function buildTutorTaskContext(request: TutorRequest) {
  return {
    task: {
      title: request.taskTitle ?? "",
      description: request.taskDescription ?? "",
      teachingGuide: request.taskPedagogy ?? null,
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
      "You are the Problem Understanding Agent in a Socratic programming tutor. Evaluate the student's demonstrated understanding across five separate dimensions: goal, input, output, constraints, and step order. The task teachingGuide contains expected plan elements and common misconceptions; use it as an assessment rubric, never as evidence that the student understands something. Detect only misconceptions supported by the student's own plan or messages and include a short evidence statement for each one. An omitted idea is not automatically a misconception. Do not solve the task and do not write code. Scores must be evidence-based: 0 means no demonstrated understanding and 10 means complete, accurate understanding.",
    userPrompt: JSON.stringify(buildTutorTaskContext(state.request)),
  });
  const confidenceAssessment = calculateConfidenceAssessment({
    confidenceRating: state.request.planningData?.confidenceRating,
    dimensions: output.dimensions,
  });
  const misconceptionSummary = output.misconceptions.length
    ? ` Misconceptions: ${output.misconceptions.map((item) => item.type).join(", ")}.`
    : " No evidenced misconception was detected.";
  const learnerState = createUnderstandingLearnerState({
    request: state.request,
    output,
    hintLevel: state.hintLevel,
  });
  return {
    understandingScore: confidenceAssessment.assessedUnderstanding,
    understandingDimensions: output.dimensions,
    misconceptions: output.misconceptions,
    confidenceAssessment,
    planStatus: output.planStatus,
    missingPlanElement: output.missingPlanElement,
    analysisSummary: output.summary,
    investigationFocus: output.nextQuestionFocus,
    learnerState,
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
    userPrompt: JSON.stringify(buildTutorTaskContext(state.request)),
  });
  const guardedOutput = reconcileCodeAnalysisWithRunEvidence({
    request: state.request,
    analysis: output,
  });
  const errorPatternHistory = buildErrorPatternHistory({
    request: state.request,
    currentPattern: guardedOutput.likelyPattern,
  });
  const normalizedEvidence = normalizeCodeAnalysisEvidence({
    request: state.request,
    counterexample: guardedOutput.counterexample,
    executionTrace: guardedOutput.executionTrace,
  });
  const repeatedSummary = errorPatternHistory.isRepeated
    ? ` Repeated ${errorPatternHistory.repeatedPattern} pattern (${errorPatternHistory.occurrenceCount} occurrences).`
    : "";
  return {
    codeHasError: guardedOutput.hasError,
    codeErrorType: guardedOutput.errorType,
    errorLayer: guardedOutput.errorLayer,
    likelyErrorPattern: guardedOutput.likelyPattern,
    suspectedLineNumbers: guardedOutput.suspectedLineNumbers,
    counterexample: normalizedEvidence.counterexample,
    executionTrace: normalizedEvidence.executionTrace,
    errorPatternHistory,
    predictionMismatch: guardedOutput.predictionMismatch,
    analysisSummary: guardedOutput.summary,
    investigationFocus: guardedOutput.investigationFocus,
    codeAnalysisSummary: guardedOutput.summary,
    codeInvestigationFocus: guardedOutput.investigationFocus,
    taskFinished: state.request.latestRunResult?.status === "success" && !guardedOutput.hasError,
    trace: [{
      agent: "code_analysis" as const,
      summary: `${guardedOutput.summary} Error layer: ${guardedOutput.errorLayer}.${repeatedSummary}`,
    }],
  };
}

async function metacognitiveAgent(state: TutorGraphState) {
  const request = state.request;
  const currentHintLevel = inferStoredHintLevel(request);
  const previousLearnerState = state.learnerState;
  const learningSignals = analyzeTutorLearningSignals(
    request,
    previousLearnerState.supportProfile.preferredWaitTime,
  );
  const codeChangeQuality = analyzeCodeChangeQuality(
    request.previousCode,
    request.currentCode,
  );
  const deterministicProductiveStruggle = detectProductiveStruggle({
    codeChangeQuality,
    signals: learningSignals,
    attemptsOnFocus: previousLearnerState.attemptsOnFocus,
    profile: previousLearnerState.supportProfile,
  });
  const supportProfile = adaptSupportProfile({
    previous: previousLearnerState.supportProfile,
    signals: learningSignals,
    productiveStruggle: deterministicProductiveStruggle,
    request,
  });
  const llm = createLlmClient();
  const output = await llm.generateJson<MetacognitiveOutput>({
    schema: metacognitiveSchema,
    responseSchemaName: "metacognitive_monitor",
    systemPrompt:
      "You are the Metacognitive Monitoring Agent. Distinguish productive struggle from being stuck: repeated failure with meaningful code changes can be healthy exploration and should normally use intervention=wait. Judge codeChangeQuality only from the supplied deterministic value. Evaluate the latest answer using only supplied evidence. Maintain one currentFocus using the allowed vocabulary and select one intervention. Mark focusResolved only when the latest answer explicitly resolves that focus; do not infer mastery from the task or teaching guide. For plan_complete, keep that focus unless new evidence contradicts the plan. For code errors, use debugging; for reflection, use reflection_learning. Use the learner's supportProfile thresholds. Recommend decreasing help after recovery or independent progress. Do not diagnose personal traits, teach, ask a question, answer the task, or reveal code.",
    userPrompt: JSON.stringify({
      context: buildTutorTaskContext(request),
      learningSignals: {
        ...learningSignals,
        codeHasError: state.codeHasError,
        codeErrorType: state.codeErrorType,
        predictionMismatch: state.predictionMismatch,
        errorLayer: state.errorLayer,
        errorPatternHistory: state.errorPatternHistory,
      },
      currentHintLevel,
      previousLearnerState,
      codeChangeQuality,
      deterministicProductiveStruggle,
      supportProfile,
    }),
  });
  const planIsReady = request.stage === "plan" && state.planStatus === "ready";
  const decision = reconcileMetacognitiveDecision({
    request,
    modelLearningState: output.learningState,
    modelIntervention: output.intervention,
    modelProductiveStruggle: output.productiveStruggle,
    signals: learningSignals,
    codeChangeQuality,
    productiveStruggle: deterministicProductiveStruggle,
    previousLearningState: previousLearnerState.learningState,
    latestAnswerResolved: output.latestAnswer.focusResolved,
  });
  const attemptsRequireHelp =
    previousLearnerState.attemptsOnFocus >= supportProfile.typicalAttemptsBeforeHint;
  const shouldIncrease = !planIsReady && !decision.productiveStruggle && (
    request.action === "smaller_hint" ||
    decision.intervention === "increase_hint" ||
    attemptsRequireHelp ||
    (learningSignals.shouldEscalateHint && decision.learningState === "stuck") ||
    output.shouldIncreaseHint
  );
  const shouldDecrease = !shouldIncrease && (
    output.shouldDecreaseHint ||
    decision.learningState === "recovering" ||
    decision.learningState === "independent"
  );
  const hintLevel = calculateNextHintLevel({
    currentHintLevel,
    confusionLevel: output.confusionLevel,
    shouldIncrease,
    shouldDecrease,
  });
  const evidenceSummary = learningSignals.reasons.length
    ? ` Evidence: ${learningSignals.reasons.join("; ")}.`
    : "";
  const learnerState = mergeMonitoredLearnerState({
    request,
    baseState: state.learnerState,
    hintLevel,
    monitoring: {
      learningState: planIsReady ? "independent" : decision.learningState,
      currentFocus: planIsReady ? "plan_complete" : output.currentFocus,
      latestAnswer: output.latestAnswer,
      codeChangeQuality,
      productiveStruggle: decision.productiveStruggle,
      intervention: planIsReady ? "wait" : decision.intervention,
      supportProfile,
    },
  });
  return {
    confusionLevel: output.confusionLevel,
    isStuck: decision.learningState === "stuck" || (
      output.isStuck && !decision.productiveStruggle
    ),
    hintLevel,
    metacognitiveReason: output.reason,
    reflectionFocus: output.reflectionFocus,
    learnerState,
    trace: [{
      agent: "metacognitive_monitor" as const,
      summary: `${output.reason} Learning state: ${decision.learningState}; code change: ${codeChangeQuality}; productive struggle: ${decision.productiveStruggle}; intervention: ${decision.intervention}.${evidenceSummary}`,
    }],
  };
}

async function socraticQuestioningAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const preferredStrategy = preferredStrategyForIntervention(
    state.learnerState.intervention,
    state.learnerState,
  );
  const questionStrategy = selectTutorQuestionStrategy({
    request: state.request,
    codeHasError: state.codeHasError,
    predictionMismatch: state.predictionMismatch,
    planReady: state.planStatus === "ready",
    preferredStrategy,
  });
  const recentTutorQuestions = state.request.conversation
    .filter((message) => message.role === "tutor")
    .slice(-5)
    .map((message) => message.content);
  const generationContext = {
    requiredQuestionStrategy: questionStrategy,
    context: buildTutorTaskContext(state.request),
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
      learnerState: state.learnerState,
      intervention: state.learnerState.intervention,
      supportProfile: state.learnerState.supportProfile,
    },
    hintLevel: state.hintLevel,
    recentTutorQuestions,
  };
  const systemPrompt = `You are the student-facing Socratic Questioning Agent. Follow Agent 4's intervention and supportProfile while using exactly the required question strategy. intervention=wait means do not add a hint; ask only a light progress check. intervention=encourage means acknowledge progress without increasing technical help. intervention=return_to_plan means ask about the relevant plan assumption rather than repairing code. For action=idle_check_in, use one gentle check-in such as “Have you hit a sticking point, or are you still exploring?” without assuming failure. Produce exactly one warm, concise, actionable primary question in the student's language when clear. Set targetFocus to exactly metacognition.learnerState.currentFocus and make the question address that focus. Use the latest answer quality so you do not ask the student to repeat an idea already marked understood. When the plan status is ready, do not ask for plan revision; ask one short transition question about which existing plan step the student will implement or test first. optionalPrompt may contain one short supportive statement but no additional question; use an empty string when it is unnecessary. Never provide the full answer or task-specific solution code. Follow exactly this support boundary: ${hintRules[state.hintLevel]}. Set supportType truthfully to metacognitive, concept, syntax_direction, or pseudocode. Treat confidence as self-report, never as proof of correctness. If confidence is higher than demonstrated understanding, ask for evidence around the weakest dimension without labeling the student as overconfident. If confidence is lower, briefly acknowledge a demonstrated strength before the next focused question.`;

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
    currentFocus: state.learnerState.currentFocus,
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
      currentFocus: state.learnerState.currentFocus,
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
      targetFocus: state.learnerState.currentFocus,
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
  const evidencePacket = buildTutorAssessmentEvidence(state.request);
  const output = await llm.generateJson<AssessmentOutput>({
    schema: assessmentSchema,
    responseSchemaName: "assessment",
    systemPrompt:
      "You are the Assessment and Reflection Agent. Produce a six-dimensional learning assessment, evidence-based judgments, a chronological learning timeline, one similar-but-different transfer task, and a concise teacher report. Use only evidence records supplied by the system. Every evaluation and timeline item must cite valid evidenceIds exactly; never invent events, progress, mastery, or quotes. Passing tests alone is not proof of understanding: require planning, explanation, debugging, or reflection evidence for a demonstrated verdict. Capability scores are 0-5 and measure demonstrated evidence, not personality. The transfer task must practice the same difficult skill in a different surface problem, not repeat the original. For a reflection-summary request, content is a short personalized student-facing summary. Otherwise content is one reflective question. Teacher-only analysis stays in structured fields and must not appear in content. Do not provide solution code.",
    userPrompt: JSON.stringify({
      context: buildTutorTaskContext(state.request),
      priorAnalysis: state.analysisSummary,
      metacognitiveReason: state.metacognitiveReason,
      currentErrorPatternHistory: state.errorPatternHistory,
      evidencePacket,
    }),
  });
  const summary = [
    output.strengths[0],
    output.growthArea,
    output.transferableIdea,
  ].filter(Boolean).join(" ");
  const evidenceBasedEvaluation = output.evidenceBasedEvaluation.flatMap((item) => {
    const records = resolveAssessmentEvidence(item.evidenceIds, evidencePacket);
    return records.length ? [{
      dimension: item.dimension,
      judgment: item.judgment,
      evidence: records.map((record) => `[${record.source}] ${record.detail}`),
    }] : [];
  });
  const timeline = output.timeline
    .map((item) => ({
      item,
      record: resolveAssessmentEvidence([item.evidenceId], evidencePacket)[0],
    }))
    .filter((entry) => entry.record)
    .sort((left, right) =>
      evidencePacket.records.findIndex((record) => record.id === left.item.evidenceId) -
      evidencePacket.records.findIndex((record) => record.id === right.item.evidenceId),
    )
    .map((entry, index) => ({
      order: index + 1,
      event: entry.item.event,
      evidence: `[${entry.record!.source}] ${entry.record!.detail}`,
    }));
  const learningAssessment: TutorLearningAssessment = {
    capabilities: output.capabilities,
    evidenceBasedEvaluation,
    timeline,
    transferTask: {
      title: output.transferTask.title,
      objective: output.transferTask.objective,
      differenceFromCurrent: output.transferTask.differenceFromCurrent,
      reason: output.transferTask.reason,
      evidence: resolveAssessmentEvidence(
        output.transferTask.evidenceIds,
        evidencePacket,
      ).map((record) => `[${record.source}] ${record.detail}`),
      suggestedDifficulty: output.transferTask.suggestedDifficulty,
    },
    teacherReport: {
      commonDifficulties: evidencePacket.commonDifficultySignals,
      maxHintLevel: evidencePacket.maxHintLevel,
      aiReliance: evidencePacket.aiReliance,
      effectiveQuestionStrategies: evidencePacket.effectiveQuestionStrategies,
      ...(() => {
        const records = resolveAssessmentEvidence(
          output.teacherReport.understandingEvidenceIds,
          evidencePacket,
        );
        return {
          understandingVerdict: reconcileUnderstandingVerdict({
            requestedVerdict: output.teacherReport.understandingVerdict,
            evidence: records,
            hasPassingRun: state.request.latestRunResult?.status === "success",
          }),
          understandingEvidence: records
            .map((record) => `[${record.source}] ${record.detail}`)
            .join(" ") || "Insufficient matching evidence was available.",
        };
      })(),
    },
  };
  return {
    finalContent: output.content,
    questionType: output.questionType,
    taskFinished: output.taskFinished,
    learningAssessment,
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
  if (action === "generate_reflection_summary") {
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

export function routeAfterMetacognitionResult({
  taskFinished,
  stage,
}: {
  taskFinished: boolean;
  stage: TutorRequest["stage"];
}) {
  if (stage === "reflect") return "socratic_questioning_agent" as const;
  return taskFinished ? "assessment_agent" as const : "socratic_questioning_agent" as const;
}

function routeAfterMetacognition(state: TutorGraphState) {
  return routeAfterMetacognitionResult({
    taskFinished: state.taskFinished,
    stage: state.request.stage,
  });
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
    learnerState: createInitialLearnerState(request),
    learningAssessment: undefined,
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
    learnerState: result.learnerState,
    learningAssessment: result.learningAssessment,
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

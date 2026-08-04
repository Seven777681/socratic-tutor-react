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
import type {
  TutorAgentTrace,
  TutorQuestionType,
  TutorRequest,
} from "@/types/tutor";

const TutorState = Annotation.Root({
  request: Annotation<TutorRequest>(),
  understandingScore: Annotation<number>(),
  planStatus: Annotation<"missing" | "needs_revision" | "ready">(),
  missingPlanElement: Annotation<string>(),
  codeHasError: Annotation<boolean>(),
  codeErrorType: Annotation<string>(),
  predictionMismatch: Annotation<boolean>(),
  analysisSummary: Annotation<string>(),
  investigationFocus: Annotation<string>(),
  confusionLevel: Annotation<number>(),
  isStuck: Annotation<boolean>(),
  hintLevel: Annotation<number>(),
  metacognitiveReason: Annotation<string>(),
  reflectionFocus: Annotation<string>(),
  taskFinished: Annotation<boolean>(),
  finalContent: Annotation<string>(),
  questionType: Annotation<TutorQuestionType>(),
  trace: Annotation<TutorAgentTrace[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

type TutorGraphState = typeof TutorState.State;

export interface MultiAgentTutorResult {
  content: string;
  questionType: TutorQuestionType;
  hintLevel: number;
  trace: TutorAgentTrace[];
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

function hasRepeatedStudentMessage(request: TutorRequest) {
  const studentMessages = request.conversation
    .filter((message) => message.role === "student")
    .slice(-3)
    .map((message) => message.content.trim().toLowerCase());
  if (request.studentMessage.trim()) {
    studentMessages.push(request.studentMessage.trim().toLowerCase());
  }
  return studentMessages.length >= 2 && new Set(studentMessages.slice(-2)).size === 1;
}

async function problemUnderstandingAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const output = await llm.generateJson<ProblemUnderstandingOutput>({
    schema: problemUnderstandingSchema,
    responseSchemaName: "problem_understanding",
    systemPrompt:
      "You are the Problem Understanding Agent in a Socratic programming tutor. Evaluate whether the student understands the goal, inputs, outputs, and ordered approach. Do not solve the task and do not write code. Scores must be evidence-based: 0 means no demonstrated understanding and 10 means a complete, accurate plan.",
    userPrompt: JSON.stringify(taskContext(state.request)),
  });
  return {
    understandingScore: output.understandingScore,
    planStatus: output.planStatus,
    missingPlanElement: output.missingPlanElement,
    analysisSummary: output.summary,
    investigationFocus: output.nextQuestionFocus,
    trace: [{ agent: "problem_understanding" as const, summary: output.summary }],
  };
}

async function codeAnalysisAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const output = await llm.generateJson<CodeAnalysisOutput>({
    schema: codeAnalysisSchema,
    responseSchemaName: "code_analysis",
    systemPrompt:
      "You are the Code Analysis Agent. Analyze only the supplied code, prediction, and trusted run/test evidence. Classify the likely error and identify the first contradiction worth investigating. Do not execute code, invent test results, repair the code, or reveal a solution.",
    userPrompt: JSON.stringify(taskContext(state.request)),
  });
  return {
    codeHasError: output.hasError,
    codeErrorType: output.errorType,
    predictionMismatch: output.predictionMismatch,
    analysisSummary: output.summary,
    investigationFocus: output.investigationFocus,
    taskFinished: state.request.latestRunResult?.status === "success" && !output.hasError,
    trace: [{ agent: "code_analysis" as const, summary: output.summary }],
  };
}

async function metacognitiveAgent(state: TutorGraphState) {
  const request = state.request;
  const currentHintLevel = inferStoredHintLevel(request);
  const deterministicStuck =
    (request.idleSeconds ?? 0) >= 60 || hasRepeatedStudentMessage(request);
  const llm = createLlmClient();
  const output = await llm.generateJson<MetacognitiveOutput>({
    schema: metacognitiveSchema,
    responseSchemaName: "metacognitive_monitor",
    systemPrompt:
      "You are the Metacognitive Monitoring Agent. Judge struggle from the supplied evidence: uncertainty, repeated attempts, repeated errors, prediction mismatch, or at least 60 seconds of inactivity. Do not diagnose personal traits. Recommend the smallest useful support increase and one reflection focus. Do not answer the programming task.",
    userPrompt: JSON.stringify({
      context: taskContext(request),
      deterministicSignals: {
        idleSeconds: request.idleSeconds ?? 0,
        repeatedStudentMessage: hasRepeatedStudentMessage(request),
        codeHasError: state.codeHasError,
        codeErrorType: state.codeErrorType,
        predictionMismatch: state.predictionMismatch,
      },
      currentHintLevel,
    }),
  });
  const shouldIncrease =
    request.action === "smaller_hint" ||
    deterministicStuck ||
    output.shouldIncreaseHint;
  const hintLevel = Math.min(
    3,
    Math.max(
      currentHintLevel,
      output.confusionLevel,
      shouldIncrease ? currentHintLevel + 1 : currentHintLevel,
    ),
  );
  return {
    confusionLevel: output.confusionLevel,
    isStuck: deterministicStuck || output.isStuck,
    hintLevel,
    metacognitiveReason: output.reason,
    reflectionFocus: output.reflectionFocus,
    trace: [{ agent: "metacognitive_monitor" as const, summary: output.reason }],
  };
}

async function socraticQuestioningAgent(state: TutorGraphState) {
  const llm = createLlmClient();
  const output = await llm.generateJson<SocraticResponseOutput>({
    schema: socraticResponseSchema,
    responseSchemaName: "socratic_questioning",
    systemPrompt: `You are the student-facing Socratic Questioning Agent. Produce one warm, concise, actionable question in the student's language when clear. Never provide the full answer or task-specific solution code. Follow exactly this support boundary: ${hintRules[state.hintLevel]}. Match the current learning stage and ask the student to explain or test one next idea.`,
    userPrompt: JSON.stringify({
      context: taskContext(state.request),
      understanding: {
        score: state.understandingScore,
        planStatus: state.planStatus,
        missingPlanElement: state.missingPlanElement,
      },
      codeAnalysis: {
        hasError: state.codeHasError,
        errorType: state.codeErrorType,
        predictionMismatch: state.predictionMismatch,
        summary: state.analysisSummary,
        investigationFocus: state.investigationFocus,
      },
      metacognition: {
        confusionLevel: state.confusionLevel,
        isStuck: state.isStuck,
        reflectionFocus: state.reflectionFocus,
      },
      hintLevel: state.hintLevel,
    }),
  });
  return {
    finalContent: output.content,
    questionType: output.questionType,
    trace: [{
      agent: "socratic_questioning" as const,
      summary: `Generated a Level ${state.hintLevel} guiding question.`,
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

const tutorGraph = new StateGraph(TutorState)
  .addNode("problem_understanding_agent", problemUnderstandingAgent)
  .addNode("code_analysis_agent", codeAnalysisAgent)
  .addNode("metacognitive_agent", metacognitiveAgent)
  .addNode("socratic_questioning_agent", socraticQuestioningAgent)
  .addNode("assessment_agent", assessmentAgent)
  .addConditionalEdges(START, routeTutorStart)
  .addEdge("problem_understanding_agent", "metacognitive_agent")
  .addEdge("code_analysis_agent", "metacognitive_agent")
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
    planStatus: "missing",
    missingPlanElement: "",
    codeHasError: false,
    codeErrorType: "none",
    predictionMismatch: false,
    analysisSummary: "",
    investigationFocus: "",
    confusionLevel: 0,
    isStuck: false,
    hintLevel: inferStoredHintLevel(request),
    metacognitiveReason: "",
    reflectionFocus: "",
    taskFinished: request.latestRunResult?.status === "success",
    finalContent: "",
    questionType: "understanding",
    trace: [],
  });
  if (!result.finalContent.trim()) {
    throw new Error("The tutor graph produced an empty response.");
  }
  return {
    content: result.finalContent,
    questionType: result.questionType,
    hintLevel: result.hintLevel,
    trace: result.trace,
  };
}

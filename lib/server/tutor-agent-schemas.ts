import { z } from "zod";

export const tutorQuestionTypeSchema = z.enum([
  "understanding",
  "decomposition",
  "debugging",
  "reflection",
  "transfer",
  "strategy_comparison",
]);

export const problemUnderstandingSchema = z.object({
  dimensions: z.object({
    goal: z.number().int().min(0).max(10),
    input: z.number().int().min(0).max(10),
    output: z.number().int().min(0).max(10),
    constraints: z.number().int().min(0).max(10),
    stepOrder: z.number().int().min(0).max(10),
  }),
  misconceptions: z.array(z.object({
    type: z.enum([
      "task_goal",
      "input",
      "output",
      "constraint",
      "step_order",
      "algorithm",
    ]),
    evidence: z.string().min(1),
  })),
  planStatus: z.enum(["missing", "needs_revision", "ready"]),
  missingPlanElement: z.string(),
  summary: z.string(),
  nextQuestionFocus: z.string(),
});

export const codeAnalysisSchema = z.object({
  hasError: z.boolean(),
  errorType: z.enum(["none", "syntax", "runtime", "logic", "calculation", "loop", "timeout"]),
  errorLayer: z.enum([
    "none",
    "syntax",
    "implementation",
    "algorithm",
    "task_misunderstanding",
    "testing",
  ]),
  likelyPattern: z.enum([
    "none",
    "off_by_one",
    "wrong_initialization",
    "incorrect_condition",
    "state_update",
    "input_parsing",
    "output_format",
    "type_mismatch",
    "missing_case",
    "infinite_loop",
    "unknown",
  ]),
  suspectedLineNumbers: z.array(z.number().int().positive()),
  counterexample: z.object({
    input: z.string(),
    expectedBehavior: z.string(),
    investigationReason: z.string(),
    evidence: z.enum(["run_evidence", "static_inference"]),
  }).nullable(),
  executionTrace: z.array(z.object({
    step: z.number().int().positive(),
    lineNumber: z.number().int().positive().nullable(),
    variables: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })),
    observation: z.string(),
    evidence: z.enum([
      "run_evidence",
      "static_inference",
      "student_prediction",
    ]),
  })).max(8),
  predictionMismatch: z.boolean(),
  summary: z.string(),
  investigationFocus: z.string(),
});

export const tutorLearningFocusSchema = z.enum([
  "goal",
  "input",
  "output",
  "constraints",
  "step_order",
  "plan_complete",
  "coding_progress",
  "debugging",
  "reflection_learning",
]);

export const metacognitiveSchema = z.object({
  confusionLevel: z.number().int().min(0).max(3),
  isStuck: z.boolean(),
  shouldIncreaseHint: z.boolean(),
  shouldDecreaseHint: z.boolean(),
  reason: z.string(),
  reflectionFocus: z.string(),
  learningState: z.enum([
    "exploring",
    "uncertain",
    "stuck",
    "recovering",
    "independent",
  ]),
  productiveStruggle: z.boolean(),
  intervention: z.enum([
    "wait",
    "encourage",
    "ask_prediction",
    "break_down_problem",
    "show_counterexample",
    "increase_hint",
    "return_to_plan",
  ]),
  currentFocus: tutorLearningFocusSchema,
  latestAnswer: z.object({
    quality: z.enum(["correct", "partial", "off_target", "uncertain"]),
    focusResolved: z.boolean(),
    recognizedIdeas: z.array(z.string()).max(4),
    missingIdeas: z.array(z.string()).max(4),
    misconception: z.string(),
  }),
});

export const socraticResponseSchema = z.object({
  primaryQuestion: z.string().min(1).max(240),
  optionalPrompt: z.string().max(160),
  supportType: z.enum([
    "metacognitive",
    "concept",
    "syntax_direction",
    "pseudocode",
  ]),
  questionType: tutorQuestionTypeSchema,
  targetFocus: tutorLearningFocusSchema,
});

export const assessmentSchema = z.object({
  content: z.string().min(1),
  questionType: tutorQuestionTypeSchema,
  taskFinished: z.boolean(),
  strengths: z.array(z.string()),
  growthArea: z.string(),
  transferableIdea: z.string(),
  capabilities: z.object({
    problemUnderstanding: z.number().int().min(0).max(5),
    planning: z.number().int().min(0).max(5),
    implementation: z.number().int().min(0).max(5),
    debugging: z.number().int().min(0).max(5),
    reflection: z.number().int().min(0).max(5),
    independence: z.number().int().min(0).max(5),
  }),
  evidenceBasedEvaluation: z.array(z.object({
    dimension: z.enum([
      "problemUnderstanding",
      "planning",
      "implementation",
      "debugging",
      "reflection",
      "independence",
    ]),
    judgment: z.string(),
    evidenceIds: z.array(z.string()).min(1).max(4),
  })).length(6),
  timeline: z.array(z.object({
    event: z.string(),
    evidenceId: z.string(),
  })).max(10),
  transferTask: z.object({
    title: z.string(),
    objective: z.string(),
    differenceFromCurrent: z.string(),
    reason: z.string(),
    evidenceIds: z.array(z.string()).min(1).max(4),
    suggestedDifficulty: z.enum(["easier", "similar", "harder"]),
  }),
  teacherReport: z.object({
    commonDifficulties: z.array(z.string()).max(5),
    maxHintLevel: z.number().int().min(0).max(3),
    aiReliance: z.enum(["low", "moderate", "high"]),
    effectiveQuestionStrategies: z.array(z.enum([
      "prediction",
      "counterexample",
      "decomposition",
      "comparison",
      "trace_execution",
      "explain_reasoning",
      "transfer",
    ])).max(4),
    understandingVerdict: z.enum([
      "demonstrated",
      "partial",
      "insufficient_evidence",
    ]),
    understandingEvidenceIds: z.array(z.string()).min(1).max(4),
  }),
});

export type ProblemUnderstandingOutput = z.infer<typeof problemUnderstandingSchema>;
export type CodeAnalysisOutput = z.infer<typeof codeAnalysisSchema>;
export type MetacognitiveOutput = z.infer<typeof metacognitiveSchema>;
export type SocraticResponseOutput = z.infer<typeof socraticResponseSchema>;
export type AssessmentOutput = z.infer<typeof assessmentSchema>;

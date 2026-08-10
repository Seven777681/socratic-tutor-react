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

export const metacognitiveSchema = z.object({
  confusionLevel: z.number().int().min(0).max(3),
  isStuck: z.boolean(),
  shouldIncreaseHint: z.boolean(),
  reason: z.string(),
  reflectionFocus: z.string(),
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
});

export const assessmentSchema = z.object({
  content: z.string().min(1),
  questionType: tutorQuestionTypeSchema,
  taskFinished: z.boolean(),
  strengths: z.array(z.string()),
  growthArea: z.string(),
  transferableIdea: z.string(),
});

export type ProblemUnderstandingOutput = z.infer<typeof problemUnderstandingSchema>;
export type CodeAnalysisOutput = z.infer<typeof codeAnalysisSchema>;
export type MetacognitiveOutput = z.infer<typeof metacognitiveSchema>;
export type SocraticResponseOutput = z.infer<typeof socraticResponseSchema>;
export type AssessmentOutput = z.infer<typeof assessmentSchema>;

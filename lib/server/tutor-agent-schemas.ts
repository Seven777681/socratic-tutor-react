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
  understandingScore: z.number().int().min(0).max(10),
  planStatus: z.enum(["missing", "needs_revision", "ready"]),
  missingPlanElement: z.string(),
  summary: z.string(),
  nextQuestionFocus: z.string(),
});

export const codeAnalysisSchema = z.object({
  hasError: z.boolean(),
  errorType: z.enum(["none", "syntax", "runtime", "logic", "calculation", "loop", "timeout"]),
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
  content: z.string().min(1),
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

import assert from "node:assert/strict";
import test from "node:test";
import {
  assessmentSchema,
  codeAnalysisSchema,
  metacognitiveSchema,
  problemUnderstandingSchema,
} from "@/lib/server/tutor-agent-schemas";
import { calculateConfidenceAssessment } from "@/lib/server/tutor-understanding-assessment";

test("accepts evidence-based understanding dimensions and misconception labels", () => {
  const result = problemUnderstandingSchema.parse({
    dimensions: { goal: 8, input: 6, output: 7, constraints: 4, stepOrder: 5 },
    misconceptions: [{
      type: "constraint",
      evidence: "The plan assumes the input is always positive.",
    }],
    planStatus: "needs_revision",
    missingPlanElement: "Boundary handling",
    summary: "The main goal is understood, but constraints need attention.",
    nextQuestionFocus: "Test the plan with a boundary input.",
  });

  assert.equal(result.dimensions.goal, 8);
  assert.equal(result.misconceptions[0]?.type, "constraint");
});

test("accepts monitoring output in the canonical learner-state vocabulary", () => {
  const result = metacognitiveSchema.parse({
    confusionLevel: 1,
    isStuck: false,
    shouldIncreaseHint: false,
    shouldDecreaseHint: true,
    reason: "The latest answer resolves the goal but not the input.",
    reflectionFocus: "Explain the input before choosing syntax.",
    learningState: "recovering",
    productiveStruggle: false,
    intervention: "encourage",
    currentFocus: "input",
    latestAnswer: {
      quality: "correct",
      focusResolved: true,
      recognizedIdeas: ["program goal"],
      missingIdeas: ["input source"],
      misconception: "",
    },
  });

  assert.equal(result.currentFocus, "input");
  assert.equal(result.latestAnswer.focusResolved, true);
});

test("accepts layered code analysis with an inferred counterexample and trace", () => {
  const result = codeAnalysisSchema.parse({
    hasError: true,
    errorType: "logic",
    errorLayer: "implementation",
    likelyPattern: "off_by_one",
    suspectedLineNumbers: [4],
    counterexample: {
      input: "[1]",
      expectedBehavior: "The single value should be processed.",
      investigationReason: "A one-item input exposes the loop boundary.",
      evidence: "static_inference",
    },
    executionTrace: [{
      step: 1,
      lineNumber: 4,
      variables: [{ name: "i", value: "0" }],
      observation: "The condition is evaluated before the body runs.",
      evidence: "static_inference",
    }],
    predictionMismatch: true,
    summary: "The last item may be skipped.",
    investigationFocus: "Compare the boundary with the input length.",
  });

  assert.equal(result.errorLayer, "implementation");
  assert.equal(result.counterexample?.evidence, "static_inference");
  assert.equal(result.executionTrace[0]?.variables[0]?.name, "i");
});

test("accepts Agent 5's multidimensional evidence-based assessment", () => {
  const result = assessmentSchema.parse({
    content: "You improved your boundary-checking strategy.",
    questionType: "reflection",
    taskFinished: true,
    strengths: ["Revised the loop boundary"],
    growthArea: "Explain why the boundary is correct.",
    transferableIdea: "Test the smallest boundary input.",
    capabilities: {
      problemUnderstanding: 4,
      planning: 3,
      implementation: 4,
      debugging: 3,
      reflection: 3,
      independence: 2,
    },
    evidenceBasedEvaluation: [
      "problemUnderstanding",
      "planning",
      "implementation",
      "debugging",
      "reflection",
      "independence",
    ].map((dimension) => ({
      dimension,
      judgment: "Evidence-based judgment.",
      evidenceIds: ["student-1"],
    })),
    timeline: [{ event: "Identified a boundary issue", evidenceId: "diagnosis-2" }],
    transferTask: {
      title: "Find the first matching item",
      objective: "Practice a different loop boundary.",
      differenceFromCurrent: "Search rather than aggregate values.",
      reason: "Reuses boundary reasoning in a new setting.",
      evidenceIds: ["diagnosis-2"],
      suggestedDifficulty: "similar",
    },
    teacherReport: {
      commonDifficulties: ["off_by_one"],
      maxHintLevel: 2,
      aiReliance: "moderate",
      effectiveQuestionStrategies: ["prediction"],
      understandingVerdict: "partial",
      understandingEvidenceIds: ["student-1"],
    },
  });

  assert.equal(result.capabilities.debugging, 3);
  assert.equal(result.transferTask.suggestedDifficulty, "similar");
});

test("identifies confidence that is higher than demonstrated understanding", () => {
  const assessment = calculateConfidenceAssessment({
    confidenceRating: 5,
    dimensions: { goal: 5, input: 4, output: 5, constraints: 3, stepOrder: 4 },
  });

  assert.equal(assessment.assessedUnderstanding, 4);
  assert.equal(assessment.normalizedConfidence, 10);
  assert.equal(assessment.calibration, "overconfident");
});

test("identifies confidence that is lower than demonstrated understanding", () => {
  const assessment = calculateConfidenceAssessment({
    confidenceRating: 2,
    dimensions: { goal: 9, input: 8, output: 8, constraints: 7, stepOrder: 8 },
  });

  assert.equal(assessment.assessedUnderstanding, 8);
  assert.equal(assessment.normalizedConfidence, 2.5);
  assert.equal(assessment.calibration, "underconfident");
});

test("treats close self-rating and evidence score as well calibrated", () => {
  const assessment = calculateConfidenceAssessment({
    confidenceRating: 4,
    dimensions: { goal: 8, input: 7, output: 8, constraints: 7, stepOrder: 8 },
  });

  assert.equal(assessment.assessedUnderstanding, 8);
  assert.equal(assessment.calibration, "well_calibrated");
});

test("does not infer calibration when the student has not rated confidence", () => {
  const assessment = calculateConfidenceAssessment({
    dimensions: { goal: 6, input: 6, output: 6, constraints: 6, stepOrder: 6 },
  });

  assert.equal(assessment.calibration, "not_provided");
  assert.equal(assessment.gap, null);
});

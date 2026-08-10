import assert from "node:assert/strict";
import test from "node:test";
import {
  codeAnalysisSchema,
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

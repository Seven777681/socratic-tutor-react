import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TutorLearningReport } from "@/components/tutor/tutor-learning-report";
import type { TutorLearningAssessment } from "@/types/tutor";

const assessment: TutorLearningAssessment = {
  capabilities: {
    problemUnderstanding: 4,
    planning: 3,
    implementation: 4,
    debugging: 2,
    reflection: 3,
    independence: 2,
  },
  evidenceBasedEvaluation: [
    {
      dimension: "debugging",
      judgment: "Compared expected and actual behavior.",
      evidence: ["The student inspected the failed boundary test."],
    },
  ],
  timeline: [
    { order: 2, event: "Tested the first attempt", evidence: "One test failed." },
    { order: 1, event: "Created a plan", evidence: "Three steps were recorded." },
  ],
  transferTask: {
    title: "Boundary explorer",
    objective: "Apply the same reasoning to a different input shape.",
    differenceFromCurrent: "The new task uses strings instead of numbers.",
    reason: "It strengthens boundary-case debugging.",
    evidence: ["The boundary test was the hardest step."],
    suggestedDifficulty: "similar",
  },
  teacherReport: {
    commonDifficulties: ["TEACHER_ONLY_PRIVATE_DIFFICULTY"],
    maxHintLevel: 2,
    aiReliance: "moderate",
    effectiveQuestionStrategies: ["counterexample"],
    understandingVerdict: "partial",
    understandingEvidence: "TEACHER_ONLY_PRIVATE_EVIDENCE",
  },
};

test("renders the student learning report without teacher-only fields", () => {
  const html = renderToStaticMarkup(
    React.createElement(TutorLearningReport, { assessment }),
  );

  assert.match(html, /Learning report/);
  assert.match(html, /Problem understanding/);
  assert.match(html, /Created a plan/);
  assert.match(html, /Boundary explorer/);
  assert.doesNotMatch(html, /TEACHER_ONLY_PRIVATE_DIFFICULTY/);
  assert.doesNotMatch(html, /TEACHER_ONLY_PRIVATE_EVIDENCE/);
});

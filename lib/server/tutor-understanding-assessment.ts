import type { ProblemUnderstandingOutput } from "@/lib/server/tutor-agent-schemas";

export type ConfidenceCalibration =
  | "not_provided"
  | "well_calibrated"
  | "overconfident"
  | "underconfident";

export interface ConfidenceAssessment {
  studentConfidence: number;
  normalizedConfidence: number | null;
  assessedUnderstanding: number;
  gap: number | null;
  calibration: ConfidenceCalibration;
}

export function calculateConfidenceAssessment({
  confidenceRating,
  dimensions,
}: {
  confidenceRating?: number;
  dimensions: ProblemUnderstandingOutput["dimensions"];
}): ConfidenceAssessment {
  const dimensionScores = Object.values(dimensions);
  const assessedUnderstanding = Math.round(
    dimensionScores.reduce((sum, score) => sum + score, 0) /
      dimensionScores.length,
  );

  if (!confidenceRating || confidenceRating < 1 || confidenceRating > 5) {
    return {
      studentConfidence: 0,
      normalizedConfidence: null,
      assessedUnderstanding,
      gap: null,
      calibration: "not_provided",
    };
  }

  const normalizedConfidence = (confidenceRating - 1) * 2.5;
  const gap = Number((normalizedConfidence - assessedUnderstanding).toFixed(1));
  const calibration =
    gap > 2
      ? "overconfident"
      : gap < -2
        ? "underconfident"
        : "well_calibrated";

  return {
    studentConfidence: confidenceRating,
    normalizedConfidence,
    assessedUnderstanding,
    gap,
    calibration,
  };
}

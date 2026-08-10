import type { CodeAnalysisOutput } from "@/lib/server/tutor-agent-schemas";
import type { TutorRequest } from "@/types/tutor";

function normalizeInput(value: string) {
  return value.trim().replace(/\r\n/g, "\n");
}

export function normalizeCodeAnalysisEvidence({
  request,
  counterexample,
  executionTrace,
}: {
  request: TutorRequest;
  counterexample: CodeAnalysisOutput["counterexample"];
  executionTrace: CodeAnalysisOutput["executionTrace"];
}) {
  const trustedTestInputs = new Set(
    (request.latestRunResult?.tests ?? [])
      .filter((test) => test.input !== undefined && test.expectedOutput !== undefined)
      .map((test) => normalizeInput(test.input ?? "")),
  );
  const normalizedCounterexample = counterexample
    ? {
        ...counterexample,
        evidence: trustedTestInputs.has(normalizeInput(counterexample.input))
          ? "run_evidence" as const
          : "static_inference" as const,
      }
    : null;
  const normalizedTrace = executionTrace.map((step) => ({
    ...step,
    evidence:
      step.evidence === "student_prediction" && request.latestPrediction?.trim()
        ? "student_prediction" as const
        : "static_inference" as const,
  }));

  return {
    counterexample: normalizedCounterexample,
    executionTrace: normalizedTrace,
  };
}

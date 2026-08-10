import type { CodeAnalysisOutput } from "@/lib/server/tutor-agent-schemas";
import type { TutorRequest } from "@/types/tutor";

/**
 * Trusted executor/test evidence wins when it directly contradicts a model
 * classification. Static analysis remains available when the run did not
 * establish correctness or a concrete failure.
 */
export function reconcileCodeAnalysisWithRunEvidence({
  request,
  analysis,
}: {
  request: TutorRequest;
  analysis: CodeAnalysisOutput;
}): CodeAnalysisOutput {
  const run = request.latestRunResult;
  if (!run) return analysis;

  if (run.status === "timeout" || run.error?.type === "timeout") {
    return {
      ...analysis,
      hasError: true,
      errorType: "timeout",
      errorLayer: analysis.errorLayer === "none" ? "implementation" : analysis.errorLayer,
    };
  }

  if (run.error?.type === "syntax") {
    return {
      ...analysis,
      hasError: true,
      errorType: "syntax",
      errorLayer: "syntax",
    };
  }

  if (run.error?.type === "runtime" || run.status === "error") {
    return {
      ...analysis,
      hasError: true,
      errorType: "runtime",
      errorLayer: analysis.errorLayer === "none" ? "implementation" : analysis.errorLayer,
    };
  }

  const tests = run.tests ?? [];
  const hasFailedTest = tests.some((test) => !test.passed);
  if (run.status === "failed" || hasFailedTest) {
    return {
      ...analysis,
      hasError: true,
      errorType: analysis.errorType === "none" ? "logic" : analysis.errorType,
      errorLayer: analysis.errorLayer === "none" ? "implementation" : analysis.errorLayer,
    };
  }

  if (run.status === "success" && tests.length > 0 && tests.every((test) => test.passed)) {
    return {
      ...analysis,
      hasError: false,
      errorType: "none",
      errorLayer: "none",
      likelyPattern: "none",
      suspectedLineNumbers: [],
      counterexample: null,
      executionTrace: [],
      summary: "All supplied tests passed; trusted run evidence does not support a current error.",
      investigationFocus: "Explain why the approach should transfer to another valid input.",
    };
  }

  return analysis;
}

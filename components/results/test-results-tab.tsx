"use client";

import type { CodeRunResult } from "@/types/code-run";
import { RunResultsEmptyState } from "@/components/results/run-results-empty-state";
import { TestCaseResultCard } from "@/components/results/test-case-result-card";

export function TestResultsTab({
  result,
  isRunning,
}: {
  result?: CodeRunResult;
  isRunning: boolean;
}) {
  if (!result || isRunning) {
    return (
      <div
        role="tabpanel"
        id="run-result-panel-tests"
        aria-labelledby="run-result-tab-tests"
      >
        <RunResultsEmptyState isRunning={isRunning} />
      </div>
    );
  }

  const totalTests = result.tests.length;
  const passedTests = result.tests.filter((test) => test.passed).length;
  const passRate = totalTests === 0 ? 0 : Math.round((passedTests / totalTests) * 100);
  const passRateClass =
    passRate >= 100 ? "w-full" : passRate >= 75 ? "w-3/4" : passRate >= 50 ? "w-1/2" : passRate > 0 ? "w-1/4" : "w-0";

  return (
    <div
      role="tabpanel"
      id="run-result-panel-tests"
      aria-labelledby="run-result-tab-tests"
      className="grid gap-3"
    >
      <div className="rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-extrabold text-[#101426]">
              {passedTests} of {totalTests} checks passed
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {result.summary}
            </p>
          </div>
          <span className="text-sm font-extrabold text-[#6255f6]">
            {passRate}%
          </span>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDF0FB]"
          role="progressbar"
          aria-valuenow={passRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${passRate}% of tests passed`}
        >
          <div
            className={`h-full rounded-full bg-[linear-gradient(90deg,#22C55E,#4F7CFF)] transition-all duration-300 motion-reduce:transition-none ${passRateClass}`}
          />
        </div>
      </div>

      {totalTests > 0 ? (
        <div className="grid gap-3">
          {result.tests.map((test) => (
            <TestCaseResultCard key={test.id} test={test} />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-3 py-4 text-sm font-semibold text-slate-500">
          No test details are available for this run.
        </p>
      )}
    </div>
  );
}

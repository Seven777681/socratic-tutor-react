"use client";

import type { CodeRunResult } from "@/types/code-run";
import {
  CheckCircleIcon,
  TriangleAlertIcon,
} from "@/components/dashboard/dashboard-icons";

export function ErrorDetailsTab({
  result,
  isRunning,
  onRunAgain,
  onGoToLine,
}: {
  result?: CodeRunResult;
  isRunning: boolean;
  onRunAgain: () => void;
  onGoToLine: (lineNumber: number) => void;
}) {
  const error = result?.error;

  return (
    <div
      role="tabpanel"
      id="run-result-panel-errors"
      aria-labelledby="run-result-tab-errors"
    >
      {!error || isRunning ? (
        <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-4 py-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircleIcon className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-extrabold text-[#101426]">
            No error details
          </p>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
            Error guidance appears here when the mock runner returns a syntax,
            runtime, timeout, or system issue.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-rose-700">
              <TriangleAlertIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-rose-800">
                {error.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-rose-700">
                {error.message}
              </p>
              {error.lineNumber ? (
                <p className="mt-2 text-xs font-bold text-rose-700">
                  Line {error.lineNumber}
                </p>
              ) : null}
              {error.hint ? (
                <p className="mt-3 rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm leading-6 text-slate-700">
                  {error.hint}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onRunAgain}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-3 text-sm font-extrabold text-white shadow-md shadow-indigo-200/70 transition hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
                >
                  Try Again
                </button>
                {error.lineNumber ? (
                  <button
                    type="button"
                    onClick={() => onGoToLine(error.lineNumber as number)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white px-3 text-sm font-extrabold text-[#6255f6] transition hover:border-indigo-200 hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
                  >
                    Go to line
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

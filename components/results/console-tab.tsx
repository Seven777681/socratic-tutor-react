"use client";

import type { CodeRunResult } from "@/types/code-run";
import { RunResultsEmptyState } from "@/components/results/run-results-empty-state";

export function ConsoleTab({
  result,
  stdin,
  isRunning,
  onStdinChange,
}: {
  result?: CodeRunResult;
  stdin: string;
  isRunning: boolean;
  onStdinChange: (stdin: string) => void;
}) {
  return (
    <div
      role="tabpanel"
      id="run-result-panel-console"
      aria-labelledby="run-result-tab-console"
      className="grid min-h-0 gap-3 lg:grid-cols-[240px_minmax(0,1fr)]"
    >
      <div>
        <label
          htmlFor="program-input"
          className="text-xs font-extrabold uppercase tracking-normal text-slate-500"
        >
          Program Input
        </label>
        <textarea
          id="program-input"
          value={stdin}
          onChange={(event) => onStdinChange(event.target.value)}
          rows={5}
          className="mt-2 w-full resize-none rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-3 py-2 font-mono text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          placeholder="Enter stdin for the mock run"
        />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-normal text-slate-500">
          Output
        </p>
        {result || isRunning ? (
          <div className="mt-2 grid gap-3">
            <pre className="max-h-32 overflow-auto rounded-xl border border-[#E4E7F0] bg-[#F8FAFF] px-3 py-2 text-sm leading-6 text-[#101426]">
              <code>
                {isRunning
                  ? "Running mock result..."
                  : result?.stdout || "No stdout was produced."}
              </code>
            </pre>
            {result?.stderr ? (
              <pre className="max-h-24 overflow-auto rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-700">
                <code>{result.stderr}</code>
              </pre>
            ) : null}
          </div>
        ) : (
          <RunResultsEmptyState isRunning={false} />
        )}
      </div>
    </div>
  );
}

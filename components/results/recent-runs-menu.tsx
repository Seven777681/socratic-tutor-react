"use client";

import type { CodeRunResult } from "@/types/code-run";
import { HistoryIcon } from "@/components/dashboard/dashboard-icons";
import { RunStatusBadge } from "@/components/results/run-status-badge";

export function RecentRunsMenu({
  runs,
  onSelectRun,
}: {
  runs: CodeRunResult[];
  onSelectRun: (run: CodeRunResult) => void;
}) {
  if (runs.length === 0) {
    return null;
  }

  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-xs font-extrabold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
        <HistoryIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Recent</span>
      </summary>
      <div className="absolute right-0 top-11 z-30 w-72 rounded-2xl border border-[#E4E7F0] bg-white p-2 shadow-[0_18px_45px_rgba(78,91,130,0.14)]">
        <p className="px-2 py-1 text-xs font-extrabold uppercase tracking-normal text-slate-500">
          Recent Runs
        </p>
        <div className="mt-1 grid gap-1">
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => onSelectRun(run)}
              className="rounded-xl px-2 py-2 text-left transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
            >
              <div className="flex items-center justify-between gap-2">
                <RunStatusBadge status={run.status} />
                <span className="text-xs font-bold text-slate-500">
                  {run.elapsedMs}ms
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                {new Date(run.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
}

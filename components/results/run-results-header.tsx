"use client";

import type { CodeRunResult, RunStatus } from "@/types/code-run";
import {
  ChevronDownIcon,
  CopyIcon,
  TerminalIcon,
  TrashIcon,
} from "@/components/dashboard/dashboard-icons";
import { RecentRunsMenu } from "@/components/results/recent-runs-menu";
import { RunStatusBadge } from "@/components/results/run-status-badge";

export function RunResultsHeader({
  status,
  elapsedMs,
  isOpen,
  recentRuns,
  onCopy,
  onClear,
  onOpenChange,
  onSelectRun,
}: {
  status: RunStatus;
  elapsedMs?: number;
  isOpen: boolean;
  recentRuns: CodeRunResult[];
  onCopy: () => void;
  onClear: () => void;
  onOpenChange: (isOpen: boolean) => void;
  onSelectRun: (run: CodeRunResult) => void;
}) {
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-[#E4E7F0] bg-[#FBFCFF] px-4 py-2">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        className="flex min-w-0 items-center gap-2 rounded-lg text-left transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
      >
        <TerminalIcon className="h-5 w-5 shrink-0 text-[#6255f6]" />
        <span className="truncate text-sm font-extrabold text-[#101426]">
          Run Results
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-500 transition duration-200 motion-reduce:transition-none ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className="flex items-center gap-2">
        <RunStatusBadge status={status} />
        {elapsedMs ? (
          <span className="hidden text-xs font-bold text-slate-500 sm:inline">
            {elapsedMs}ms
          </span>
        ) : null}
        <RecentRunsMenu runs={recentRuns} onSelectRun={onSelectRun} />
        <button
          type="button"
          onClick={onCopy}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-xs font-extrabold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
          aria-label="Copy output"
        >
          <CopyIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Copy</span>
        </button>
        <button
          type="button"
          onClick={onClear}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-xs font-extrabold text-slate-600 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-100 active:scale-[0.99]"
          aria-label="Clear run result"
        >
          <TrashIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>
    </div>
  );
}

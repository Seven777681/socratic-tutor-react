"use client";

import { PlayCircleIcon, TerminalIcon } from "@/components/dashboard/dashboard-icons";

export function RunResultsEmptyState({
  isRunning,
}: {
  isRunning: boolean;
}) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-[#D9DDF0] bg-[#FBFCFF] px-4 py-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        {isRunning ? (
          <TerminalIcon className="h-5 w-5" />
        ) : (
          <PlayCircleIcon className="h-5 w-5" />
        )}
      </span>
      <p className="mt-3 text-sm font-extrabold text-[#101426]">
        {isRunning ? "Mock run in progress" : "Run your code"}
      </p>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
        {isRunning
          ? "The result panel will update shortly. Your code is not executed in the browser."
          : "Use Run Code to see console output, tests, and helpful error details from the mock runner."}
      </p>
    </div>
  );
}

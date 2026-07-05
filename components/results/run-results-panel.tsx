"use client";

import type { CodeRunResult, RunStatus } from "@/types/code-run";
import { ConsoleTab } from "@/components/results/console-tab";
import { ErrorDetailsTab } from "@/components/results/error-details-tab";
import {
  RunResultTabs,
  type RunResultTab,
} from "@/components/results/run-result-tabs";
import { RunResultsHeader } from "@/components/results/run-results-header";
import { TestResultsTab } from "@/components/results/test-results-tab";

export function RunResultsPanel({
  status,
  result,
  stdin,
  activeTab,
  isOpen,
  isRunning,
  recentRuns,
  onStdinChange,
  onActiveTabChange,
  onOpenChange,
  onClear,
  onRunAgain,
  onSelectRecentRun,
}: {
  status: RunStatus;
  result?: CodeRunResult;
  stdin: string;
  activeTab: RunResultTab;
  isOpen: boolean;
  isRunning: boolean;
  recentRuns: CodeRunResult[];
  onStdinChange: (stdin: string) => void;
  onActiveTabChange: (tab: RunResultTab) => void;
  onOpenChange: (isOpen: boolean) => void;
  onClear: () => void;
  onRunAgain: () => void;
  onSelectRecentRun: (run: CodeRunResult) => void;
}) {
  const copyOutput = () => {
    const text = [result?.stdout, result?.stderr].filter(Boolean).join("\n");
    if (text) {
      void navigator.clipboard?.writeText(text);
    }
  };

  return (
    <section
      className={`overflow-hidden rounded-[18px] border border-[#E4E7F0] bg-white shadow-[0_14px_40px_rgba(78,91,130,0.07)] transition-[max-height] duration-300 motion-reduce:transition-none ${
        isOpen ? "max-h-[280px]" : "max-h-[52px]"
      }`}
    >
      <RunResultsHeader
        status={status}
        elapsedMs={result?.elapsedMs}
        isOpen={isOpen}
        recentRuns={recentRuns}
        onCopy={copyOutput}
        onClear={onClear}
        onOpenChange={onOpenChange}
        onSelectRun={onSelectRecentRun}
      />

      {isOpen ? (
        <div className="grid max-h-[228px] min-h-0 gap-3 overflow-auto p-3 motion-safe:animate-[fadeIn_200ms_ease-out]">
          <RunResultTabs
            activeTab={activeTab}
            onActiveTabChange={onActiveTabChange}
          />
          {activeTab === "console" ? (
            <ConsoleTab
              result={result}
              stdin={stdin}
              isRunning={isRunning}
              onStdinChange={onStdinChange}
            />
          ) : null}
          {activeTab === "tests" ? (
            <TestResultsTab result={result} isRunning={isRunning} />
          ) : null}
          {activeTab === "errors" ? (
            <ErrorDetailsTab
              result={result}
              isRunning={isRunning}
              onRunAgain={onRunAgain}
              onGoToLine={() => undefined}
            />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

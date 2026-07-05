"use client";

import { useState } from "react";
import type { EditorPreferences, SaveStatus } from "@/types/task";
import type { RunScenario } from "@/types/code-run";
import {
  CheckCircleIcon,
  CircleIcon,
  FileCodeIcon,
  LoaderCircleIcon,
  PlayCircleIcon,
  RotateCcwIcon,
  SettingsIcon,
} from "@/components/dashboard/dashboard-icons";
import { EditorSettingsMenu } from "@/components/editor/editor-settings-menu";

function SaveStatusView({ status }: { status: SaveStatus }) {
  const className = "h-4 w-4";

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-700">
        <LoaderCircleIcon className={`${className} motion-safe:animate-spin`} />
        Saving...
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <CircleIcon className={className} />
        Unsaved
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-emerald-700">
      <CheckCircleIcon className={className} />
      Saved
    </span>
  );
}

export function EditorToolbar({
  lineCount,
  saveStatus,
  preferences,
  onPreferencesChange,
  onReset,
  onRun,
  isRunning,
  demoRunScenario,
  onDemoRunScenarioChange,
}: {
  lineCount: number;
  saveStatus: SaveStatus;
  preferences: EditorPreferences;
  onPreferencesChange: (preferences: EditorPreferences) => void;
  onReset: () => void;
  onRun: () => void;
  isRunning: boolean;
  demoRunScenario: RunScenario;
  onDemoRunScenarioChange: (scenario: RunScenario) => void;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-[#E4E7F0] bg-[#FBFCFF] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <FileCodeIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-extrabold text-[#101426]">
              main.py
            </p>
            <span className="hidden rounded-full bg-[#eceaff] px-2 py-0.5 text-xs font-bold text-[#6255f6] sm:inline-flex">
              Python
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            {lineCount} lines
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <p className="hidden text-xs font-bold sm:block">
          <SaveStatusView status={saveStatus} />
        </p>
        <button
          type="button"
          onClick={onReset}
          disabled={isRunning}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E4E7F0] bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Reset code"
          title="Reset code"
        >
          <RotateCcwIcon className="h-4 w-4" />
          <span className="hidden xl:inline">Reset Code</span>
        </button>
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-3 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
          aria-label="Run code mock"
          title="Run code. Ctrl or Cmd + Enter"
        >
          {isRunning ? (
            <LoaderCircleIcon className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <PlayCircleIcon className="h-4 w-4" />
          )}
          <span className="hidden xl:inline">
            {isRunning ? "Running..." : "Run Code"}
          </span>
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsSettingsOpen((current) => !current)}
            aria-label="Editor settings"
            aria-expanded={isSettingsOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
          {isSettingsOpen ? (
            <EditorSettingsMenu
              preferences={preferences}
              onPreferencesChange={onPreferencesChange}
              demoRunScenario={demoRunScenario}
              onDemoRunScenarioChange={onDemoRunScenarioChange}
              onClose={() => setIsSettingsOpen(false)}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

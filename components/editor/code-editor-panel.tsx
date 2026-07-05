"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeRunResult, RunScenario, RunStatus } from "@/types/code-run";
import type {
  CodeEditorPanelProps,
  EditorPreferences,
} from "@/types/task";
import type { CursorPosition } from "@/components/editor/editor-types";
import { EditorFooterBar } from "@/components/editor/editor-footer-bar";
import { EditorResetDialog } from "@/components/editor/editor-reset-dialog";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { RunResultsPanel } from "@/components/results/run-results-panel";
import type { RunResultTab } from "@/components/results/run-result-tabs";
import { useCodeAutosave } from "@/hooks/use-code-autosave";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { mockRunCode } from "@/services/mock-code-runner";

function trackLearningEvent({
  eventType,
  taskId,
  metadata,
}: {
  eventType:
    | "code_changed"
    | "code_run"
    | "run_success"
    | "run_failed"
    | "run_error"
    | "run_timeout";
  taskId: string;
  metadata: Record<string, number | string>;
}) {
  if (process.env.NODE_ENV === "development") {
    console.info("learning_event", {
      eventType,
      taskId,
      timestamp: new Date().toISOString(),
      sessionId: "mock-session",
      metadata,
    });
  }
}

export function CodeEditorPanel({
  taskId,
  starterCode,
  language,
  onRun,
  onCodeChange,
  onRunResultChange,
}: CodeEditorPanelProps) {
  const [preferences, setPreferences] = useState<EditorPreferences>({
    fontSize: 16,
    wordWrap: false,
    minimapEnabled: false,
  });
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({
    lineNumber: 1,
    column: 1,
  });
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [stdin, setStdin] = useState("5");
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runResult, setRunResult] = useState<CodeRunResult | undefined>();
  const [activeResultTab, setActiveResultTab] = useState<RunResultTab>("console");
  const [isResultsOpen, setIsResultsOpen] = useState(true);
  const [recentRuns, setRecentRuns] = useState<CodeRunResult[]>([]);
  const [demoRunScenario, setDemoRunScenario] =
    useState<RunScenario>("failed");
  const {
    currentCode,
    saveStatus,
    updateCode,
    saveNow,
    resetCode,
  } = useCodeAutosave({ taskId, starterCode });

  const lineCount = useMemo(
    () => Math.max(1, currentCode.split("\n").length),
    [currentCode],
  );

  useEffect(() => {
    onCodeChange?.(currentCode);
  }, [currentCode, onCodeChange]);

  const handleRun = useCallback(async () => {
    if (runStatus === "running") {
      return;
    }

    saveNow();
    onRun?.(currentCode);
    setRunStatus("running");
    setIsResultsOpen(true);
    setActiveResultTab("console");
    trackLearningEvent({
      eventType: "code_run",
      taskId,
      metadata: {
        codeLength: currentCode.length,
        stdinLength: stdin.length,
        scenario: demoRunScenario,
      },
    });

    const result = await mockRunCode({
      taskId,
      code: currentCode,
      stdin,
      scenario: demoRunScenario,
    });

    setRunResult(result);
    setRunStatus(result.status);
    onRunResultChange?.(result);
    setRecentRuns((runs) => [result, ...runs].slice(0, 5));

    if (result.status === "success" || result.status === "failed") {
      setActiveResultTab("tests");
    } else {
      setActiveResultTab("errors");
    }

    trackLearningEvent({
      eventType:
        result.status === "success"
          ? "run_success"
          : result.status === "failed"
            ? "run_failed"
            : result.status === "timeout"
              ? "run_timeout"
              : "run_error",
      taskId,
      metadata: {
        status: result.status,
        elapsedMs: result.elapsedMs,
        tests: result.tests.length,
      },
    });
  }, [
    currentCode,
    demoRunScenario,
    onRun,
    onRunResultChange,
    runStatus,
    saveNow,
    stdin,
    taskId,
  ]);

  useEditorShortcuts({
    onSave: saveNow,
    onRun: () => {
      void handleRun();
    },
  });

  const handleChange = (code: string) => {
    updateCode(code);
    trackLearningEvent({
      eventType: "code_changed",
      taskId,
      metadata: { codeLength: code.length },
    });
  };

  return (
    <section className="flex h-full min-h-[520px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#E4E7F0] bg-white shadow-[0_14px_40px_rgba(78,91,130,0.07)]">
      <EditorToolbar
        lineCount={lineCount}
        saveStatus={saveStatus}
        preferences={preferences}
        onPreferencesChange={setPreferences}
        onReset={() => setIsResetOpen(true)}
        onRun={() => {
          void handleRun();
        }}
        isRunning={runStatus === "running"}
        demoRunScenario={demoRunScenario}
        onDemoRunScenarioChange={setDemoRunScenario}
      />

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(360px,1fr)_auto] gap-3 bg-[#F5F7FF] p-3">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#E4E7F0] bg-[#FBFCFF]">
          <MonacoCodeEditor
            value={currentCode}
            preferences={preferences}
            onChange={handleChange}
            onCursorChange={setCursorPosition}
          />
          <EditorFooterBar
            cursorPosition={cursorPosition}
            saveStatus={saveStatus}
          />
        </div>
        <RunResultsPanel
          status={runStatus}
          result={runResult}
          stdin={stdin}
          activeTab={activeResultTab}
          isOpen={isResultsOpen}
          isRunning={runStatus === "running"}
          recentRuns={recentRuns}
          onStdinChange={setStdin}
          onActiveTabChange={setActiveResultTab}
          onOpenChange={setIsResultsOpen}
          onClear={() => {
            setRunStatus("idle");
            setRunResult(undefined);
            setActiveResultTab("console");
          }}
          onRunAgain={() => {
            void handleRun();
          }}
          onSelectRecentRun={(run) => {
            setRunResult(run);
            setRunStatus(run.status);
            setStdin(run.stdin);
            setIsResultsOpen(true);
            setActiveResultTab(
              run.status === "success" || run.status === "failed"
                ? "tests"
                : "errors",
            );
          }}
        />
      </div>

      {isResetOpen ? (
        <EditorResetDialog
          onCancel={() => setIsResetOpen(false)}
          onConfirm={() => {
            resetCode();
            setIsResetOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

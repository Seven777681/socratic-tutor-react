"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodeRunResult, RunScenario, RunStatus } from "@/types/code-run";
import type {
  CodeEditorPanelProps,
  EditorPreferences,
} from "@/types/task";
import {
  BookOpenIcon,
  ClockIcon,
  GaugeIcon,
  XIcon,
} from "@/components/dashboard/dashboard-icons";
import type { CursorPosition } from "@/components/editor/editor-types";
import { EditorFooterBar } from "@/components/editor/editor-footer-bar";
import { EditorResetDialog } from "@/components/editor/editor-reset-dialog";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { MonacoCodeEditor } from "@/components/editor/monaco-code-editor";
import { RunResultsPanel } from "@/components/results/run-results-panel";
import type { RunResultTab } from "@/components/results/run-result-tabs";
import { TaskExample } from "@/components/workspace/task-example";
import { PlanningPanel } from "@/components/workspace/planning-panel";
import { ReflectionPanel } from "@/components/workspace/reflection-panel";
import { useCodeAutosave } from "@/hooks/use-code-autosave";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { useTaskLearningState } from "@/hooks/use-task-learning-state";
import type { PlanningDraft } from "@/hooks/use-task-learning-state";
import { runCode } from "@/services/code-runner-service";
import {
  difficultyLabels,
  topicLabels,
} from "@/components/tasks/task-formatters";

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
  task,
  taskId,
  starterCode,
  language,
  onRun,
  onCodeChange,
  onRunResultChange,
  planInteraction,
  onReviewPlanInTutor,
  onLearningContextChange,
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
  const [hasRunCode, setHasRunCode] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [planningErrors, setPlanningErrors] = useState<
    Partial<Record<"approach" | "steps", string>>
  >({});
  const [isReviewingPlan, setIsReviewingPlan] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
  const lastReflectionSignatureRef = useRef("");
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
  const { state: learningState, updateState } = useTaskLearningState(taskId);
  const firstPlanningFieldRef = useRef<HTMLInputElement>(null);
  const runResultsRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(
    () => Math.max(1, currentCode.split("\n").length),
    [currentCode],
  );

  useEffect(() => {
    onCodeChange?.(currentCode);
  }, [currentCode, onCodeChange]);

  useEffect(() => {
    if (!planInteraction) {
      return;
    }

    const nextStatus = planInteraction.canEnterCoding ? "ready" : "needs_revision";
    if (learningState.planningDraft.status === nextStatus) {
      return;
    }

    updateState({
      planningDraft: {
        ...learningState.planningDraft,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  }, [learningState.planningDraft, planInteraction, updateState]);

  useEffect(() => {
    onLearningContextChange?.({
      planningStatus: learningState.planningDraft.status,
      planningApproach: learningState.planningDraft.approach,
      planningSteps: learningState.planningDraft.steps,
      latestPrediction: learningState.prediction,
      hintLevel: 0,
    });
  }, [
    learningState.planningDraft.approach,
    learningState.planningDraft.status,
    learningState.planningDraft.steps,
    learningState.prediction,
    onLearningContextChange,
  ]);

  useEffect(() => {
    if (!isDetailsOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDetailsOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isDetailsOpen]);

  useEffect(() => {
    if (!hasRunCode || !isResultsOpen) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      runResultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [hasRunCode, isResultsOpen, runStatus]);

  const handleRun = useCallback(async () => {
    if (runStatus === "running") {
      return;
    }

    const hasPlan =
      learningState.planningDraft.approach.trim() ||
      learningState.planningDraft.steps.some((step) => step.trim());

    setPlanningErrors(
      hasPlan ? {} : { approach: "Try writing a short plan before running your code." },
    );
    saveNow();
    onRun?.(currentCode);
    setHasRunCode(true);
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

    const result = await runCode({
      taskId,
      code: currentCode,
      stdin,
      testCases: task.examples.map((example) => ({
        id: example.id,
        name: example.id,
        input: example.input,
        expectedOutput: example.output,
      })),
    });


    setRunResult(result);
    setRunStatus(result.status);
    updateState({
      hasRunCode: true,
      runStatus: result.status,
      latestRunResult: result,
    });
    onRunResultChange?.(result);
    setRecentRuns((runs) => [result, ...runs].slice(0, 5));

    if (result.status === "error" || result.status === "timeout" || result.status === "system_error") {
      setActiveResultTab("errors");
    } else {
      setActiveResultTab("console");
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
    learningState.planningDraft,
    onRun,
    onRunResultChange,
    runStatus,
    saveNow,
    stdin,
    task.examples,
    taskId,
    updateState,
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

  const validatePlanningDraft = (draft: PlanningDraft) => {
    const nextErrors: Partial<Record<"approach" | "steps", string>> = {};
    if (!draft.approach.trim()) {
      nextErrors.approach = "Add a short approach.";
    }
    if (!draft.steps[0].trim() || !draft.steps[1].trim()) {
      nextErrors.steps = "Add at least two steps.";
    }
    return nextErrors;
  };

  const reviewPlan = async () => {
    if (isReviewingPlan) {
      return;
    }

    const errors = validatePlanningDraft(learningState.planningDraft);
    setPlanningErrors(errors);
    if (Object.keys(errors).length > 0) {
      window.setTimeout(() => firstPlanningFieldRef.current?.focus(), 0);
      return;
    }

    setIsReviewingPlan(true);
    updateState({
      planningDraft: {
        ...learningState.planningDraft,
        status: "reviewing",
        updatedAt: new Date().toISOString(),
      },
    });

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      onReviewPlanInTutor?.({
        planningStatus: "reviewing",
        planningApproach: learningState.planningDraft.approach,
        planningSteps: learningState.planningDraft.steps,
        latestPrediction: learningState.prediction,
        hintLevel: 0,
      });
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "reviewing",
          reviewBypassed: false,
          updatedAt: new Date().toISOString(),
        },
      });
    } finally {
      setIsReviewingPlan(false);
    }
  };

  const updatePlanningDraft = (planningDraft: PlanningDraft) => {
    setPlanningErrors({});
    updateState({
      planningDraft: {
        ...planningDraft,
        status:
          planningDraft.status === "ready" ||
          planningDraft.status === "needs_revision"
            ? "editing"
            : planningDraft.status === "not_started"
              ? "editing"
              : planningDraft.status,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const editPlanning = () => {
    updateState({
      planningDraft: {
        ...learningState.planningDraft,
        status: "editing",
        updatedAt: new Date().toISOString(),
      },
    });
    window.setTimeout(() => firstPlanningFieldRef.current?.focus(), 0);
  };

  const generateReflectionSummary = useCallback(async () => {
    if (isGeneratingReflection) {
      return;
    }

    setIsGeneratingReflection(true);

    try {
      const response = await fetch("/api/tutor/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          studentMessage: Object.values(learningState.reflectionAnswers).join("\n"),
          currentCode,
          latestRunResult: learningState.latestRunResult,
          conversationId: `reflection-${taskId}`,
          stage: "reflect",
          mode: "run_and_reflect",
          conversation: [],
          action: "generate_reflection_summary",
        }),
      });

      if (!response.ok) {
        throw new Error("Reflection summary failed");
      }

      const data = (await response.json()) as {
        message?: { content?: string };
      };
      updateState({
        reflectionSummary:
          data.message?.content ??
          "You practiced using input values and formatting output. You strengthened your ability to connect user input with a clear printed message.",
      });
    } catch {
      updateState({
        reflectionSummary:
          "You practiced using input values and formatting output. You strengthened your ability to connect user input with a clear printed message.",
      });
    } finally {
      setIsGeneratingReflection(false);
    }
  }, [
    currentCode,
    isGeneratingReflection,
    learningState.latestRunResult,
    learningState.reflectionAnswers,
    taskId,
    updateState,
  ]);

  const reflectionSignature = useMemo(
    () =>
      Object.values(learningState.reflectionAnswers)
        .map((answer) => answer.trim())
        .join("\u001f"),
    [learningState.reflectionAnswers],
  );
  const isReflectionComplete = useMemo(
    () =>
      Object.values(learningState.reflectionAnswers).every(
        (answer) => answer.trim().length > 0,
      ),
    [learningState.reflectionAnswers],
  );

  useEffect(() => {
    if (!isReflectionComplete || isGeneratingReflection) {
      return;
    }

    if (
      learningState.reflectionSummary.trim() &&
      !lastReflectionSignatureRef.current
    ) {
      lastReflectionSignatureRef.current = reflectionSignature;
      return;
    }

    if (lastReflectionSignatureRef.current === reflectionSignature) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      lastReflectionSignatureRef.current = reflectionSignature;
      void generateReflectionSummary();
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [
    generateReflectionSummary,
    isGeneratingReflection,
    isReflectionComplete,
    learningState.reflectionSummary,
    reflectionSignature,
  ]);

  const shouldShowReflection =
    runResult?.status === "success" ||
    learningState.latestRunResult?.status === "success";

  return (
    <>
      <section className="flex min-h-[640px] min-w-0 flex-col overflow-x-hidden overflow-y-auto rounded-[22px] border border-[#E4E7F0] bg-white shadow-[0_16px_45px_rgba(78,91,130,0.08)] lg:h-[calc(100dvh-108px)] lg:min-h-0">
      <div className="border-b border-[#E4E7F0] bg-white px-5 py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">
              Problem
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-normal text-[#101426]">
              {task.title}
            </h2>
            <p className="mt-2 max-w-[840px] text-sm leading-6 text-slate-600">
              {task.description[0]}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
                <BookOpenIcon className="h-3.5 w-3.5" />
                {topicLabels[task.concept]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                <GaugeIcon className="h-3.5 w-3.5" />
                {difficultyLabels[task.thinkingDepth]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                <ClockIcon className="h-3.5 w-3.5" />
                {task.estimatedMinutes} min
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="inline-flex h-10 w-fit shrink-0 items-center justify-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
          >
            View details
          </button>
        </div>
      </div>

      <PlanningPanel
        value={learningState.planningDraft}
        errors={planningErrors}
        isReviewing={isReviewingPlan}
        isCollapsed={
          learningState.planningDraft.status === "ready" &&
          !isReviewingPlan
        }
        approachPlaceholder={
          task.concept
            ? `Briefly describe the main idea you will use for this ${topicLabels[task.concept].toLowerCase()} task.`
            : "Briefly describe the main idea you will use."
        }
        firstInvalidRef={firstPlanningFieldRef}
        onChange={updatePlanningDraft}
        onReviewPlan={() => {
          void reviewPlan();
        }}
        onEditPlan={editPlanning}
      />

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

      <div className="grid min-h-[280px] flex-1 bg-[#F5F7FF] p-3">
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
      </div>

      {hasRunCode || runStatus === "running" ? (
        <div
          ref={runResultsRef}
          className="scroll-mt-4 border-t border-[#E4E7F0] bg-[#FBFCFF] p-3"
        >
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
              setHasRunCode(true);
              setRunResult(run);
              setRunStatus(run.status);
              setStdin(run.stdin);
              setIsResultsOpen(true);
              setActiveResultTab(
                run.status === "error" ||
                  run.status === "timeout" ||
                  run.status === "system_error"
                  ? "errors"
                  : "console",
              );
            }}
          />
        </div>
      ) : null}
      </section>

      {shouldShowReflection ? (
        <ReflectionPanel
          answers={learningState.reflectionAnswers}
          summary={learningState.reflectionSummary}
          isGenerating={isGeneratingReflection}
          onAnswersChange={(reflectionAnswers) =>
            updateState({ reflectionAnswers, reflectionSummary: "" })
          }
        />
      ) : null}

      {isResetOpen ? (
        <EditorResetDialog
          onCancel={() => setIsResetOpen(false)}
          onConfirm={() => {
            resetCode();
            setIsResetOpen(false);
          }}
        />
      ) : null}

      {isDetailsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-0 backdrop-blur-sm motion-safe:animate-[fadeIn_160ms_ease-out] sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="problem-details-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDetailsOpen(false);
            }
          }}
        >
          <section className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] border border-[#E4E7F0] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:max-w-[860px] sm:rounded-[22px]">
            <div className="flex items-start justify-between gap-4 border-b border-[#E4E7F0] bg-[#FBFCFF] px-5 py-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">
                  Problem Details
                </p>
                <h2
                  id="problem-details-title"
                  className="mt-1 text-xl font-extrabold text-[#101426]"
                >
                  {task.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
                aria-label="Close problem details"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 overflow-y-auto p-5">
              <section className="rounded-[16px] border border-[#E4E7F0] bg-white p-4">
                <h3 className="text-sm font-extrabold text-[#101426]">
                  Problem Description
                </h3>
                <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                  {task.description.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-[16px] border border-[#E4E7F0] bg-[#FBFCFF] p-4">
                  <h3 className="text-sm font-extrabold text-[#101426]">Input</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {task.inputDescription}
                  </p>
                </section>
                <section className="rounded-[16px] border border-[#E4E7F0] bg-[#FBFCFF] p-4">
                  <h3 className="text-sm font-extrabold text-[#101426]">Output</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {task.outputDescription}
                  </p>
                </section>
              </div>

              <section className="rounded-[16px] border border-[#E4E7F0] bg-white p-4">
                <h3 className="text-sm font-extrabold text-[#101426]">Examples</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {task.examples.map((example, index) => (
                    <TaskExample
                      key={example.id}
                      example={example}
                      label={`Example ${index + 1}`}
                    />
                  ))}
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

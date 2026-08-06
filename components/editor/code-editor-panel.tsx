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
import { MonitoringPrediction } from "@/components/workspace/monitoring-prediction";
import { PlanningPanel } from "@/components/workspace/planning-panel";
import { ReflectionPanel } from "@/components/workspace/reflection-panel";
import { useCodeAutosave } from "@/hooks/use-code-autosave";
import { useEditorShortcuts } from "@/hooks/use-editor-shortcuts";
import { useTaskLearningState } from "@/hooks/use-task-learning-state";
import type { PlanningDraft, PlanningReview } from "@/hooks/use-task-learning-state";
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
  const [predictionWarning, setPredictionWarning] = useState("");
  const [isReviewingPlan, setIsReviewingPlan] = useState(false);
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false);
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

  const lineCount = useMemo(
    () => Math.max(1, currentCode.split("\n").length),
    [currentCode],
  );

  useEffect(() => {
    onCodeChange?.(currentCode);
  }, [currentCode, onCodeChange]);

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
    setPredictionWarning(
      learningState.prediction.trim()
        ? ""
        : "Predicting the output can help you monitor your reasoning.",
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
    learningState.planningDraft,
    learningState.prediction,
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

  const normalizePlanText = (text: string) =>
    text.trim().toLowerCase().replace(/\s+/g, " ");

  const createPlanningReview = (draft: PlanningDraft): PlanningReview => {
    const approach = normalizePlanText(draft.approach);
    const steps = draft.steps.map(normalizePlanText);
    const title = normalizePlanText(task.title);
    const descriptionText = normalizePlanText(task.description.join(" "));
    const copiedTitle =
      approach === title || steps.some((step) => step && step === title);
    const duplicateSteps = Boolean(steps[0] && steps[0] === steps[1]);
    const approachTooShort = draft.approach.trim().split(/\s+/).filter(Boolean).length < 5;
    const usefulActionPattern =
      /\b(read|get|take|ask|store|keep|set|start|check|compare|loop|repeat|calculate|count|sum|add|find|return|print|output|update|convert|split|join|sort|filter|call|use|create|build|validate|track|remember)\b/i;
    const hasActionOrder =
      draft.steps.slice(0, 2).every((step) => usefulActionPattern.test(step));
    const copiesDescription =
      descriptionText.includes(approach) && approach.length > 40;

    const strengths: string[] = [];
    if (!approachTooShort && !copiedTitle) {
      strengths.push("Your approach identifies a clear strategy.");
    } else {
      strengths.push("You identified the main goal.");
    }
    if (!duplicateSteps && hasActionOrder) {
      strengths.push("Your steps are in a logical order.");
    }

    if (approachTooShort) {
      return {
        status: "needs_revision",
        strengths,
        improvement: "Your approach is a little too short to guide your coding yet.",
        question: "What main idea will your program use before writing the first line of code?",
      };
    }

    if (copiedTitle || copiesDescription) {
      return {
        status: "needs_revision",
        strengths,
        improvement: "Your plan mostly repeats the task text right now.",
        question: "What action will your program do with the input values?",
      };
    }

    if (duplicateSteps) {
      return {
        status: "needs_revision",
        strengths,
        improvement: "Your first two steps are the same, so the order is not clear yet.",
        question: "What should happen after the first step is finished?",
      };
    }

    if (!hasActionOrder) {
      return {
        status: "needs_revision",
        strengths,
        improvement: "Your steps do not yet describe clear actions for the program.",
        question: `For this ${task.concept} task, what should the program remember or change as it works?`,
      };
    }

    return {
      status: "ready",
      strengths: strengths.length
        ? strengths
        : ["Your approach identifies a clear strategy."],
      improvement: "Your plan is clear enough to start coding.",
    };
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
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const tutorReview = createPlanningReview(learningState.planningDraft);
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: tutorReview.status,
          tutorReview,
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

  const collapsePlanning = (reviewBypassed = false) => {
    updateState({
      planningDraft: {
        ...learningState.planningDraft,
        status: "ready",
        reviewBypassed,
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

  const generateReflectionSummary = async () => {
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
  };

  const shouldShowReflection =
    runResult?.status === "success" ||
    learningState.latestRunResult?.status === "success";

  return (
    <>
      <section className="flex min-h-[640px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-[#E4E7F0] bg-white shadow-[0_16px_45px_rgba(78,91,130,0.08)] lg:h-full">
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
        onStartCoding={() => collapsePlanning(false)}
        onUpdatePlan={editPlanning}
        onContinueAnyway={() => collapsePlanning(true)}
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

      <div className="grid min-h-0 flex-1 bg-[#F5F7FF] p-3">
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

      <MonitoringPrediction
        value={learningState.prediction}
        warning={predictionWarning}
        onChange={(prediction) => {
          setPredictionWarning("");
          updateState({ prediction });
        }}
        onSave={() => {
          setPredictionWarning("");
          updateState({ prediction: learningState.prediction });
        }}
      />
      </section>

      {hasRunCode || runStatus === "running" ? (
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
              run.status === "success" || run.status === "failed"
                ? "tests"
                : "errors",
            );
          }}
        />
      ) : null}

      {shouldShowReflection ? (
        <ReflectionPanel
          answers={learningState.reflectionAnswers}
          summary={learningState.reflectionSummary}
          isGenerating={isGeneratingReflection}
          onAnswersChange={(reflectionAnswers) => updateState({ reflectionAnswers })}
          onGenerateSummary={() => {
            void generateReflectionSummary();
          }}
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

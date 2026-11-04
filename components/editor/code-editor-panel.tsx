"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodeRunResult, RunScenario, RunStatus } from "@/types/code-run";
import type {
  CodeEditorPanelProps,
  EditorPreferences,
} from "@/types/task";
import {
  BookOpenIcon,
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
import { ensureStudySession } from "@/services/study-session";
import {
  difficultyLabels,
  topicLabels,
} from "@/components/tasks/task-formatters";
import { getTaskKnowledge } from "@/data/course-content";
import { getAuthToken } from "@/lib/auth/client-auth";
import { invalidateStudyProgress } from "@/services/study-progress";
import { useLanguage } from "@/components/i18n/language-provider";

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

function getExampleProgramInput(input: string | undefined) {
  const value = (input ?? "").trim();
  if (value.startsWith("[") && value.endsWith("]")) {
    return value.slice(1, -1).replace(/,/g, " ").replace(/\s+/g, " ").trim();
  }
  return value;
}

export function CodeEditorPanel({
  task,
  taskId,
  starterCode,
  language,
  aiTutorEnabled = true,
  onRun,
  onCodeChange,
  onRunResultChange,
  planInteraction,
  onReviewPlanInTutor,
  onLearningContextChange,
  nextTask,
  entryPath,
  onEntryPathChange,
  planningMode = "required",
}: CodeEditorPanelProps) {
  const { language: uiLanguage, t } = useLanguage();
  const sourceKnowledge = getTaskKnowledge(task);
  const knowledge = uiLanguage === "zh"
    ? {
        ...sourceKnowledge,
        title: `${task.title}相关知识`,
        points: task.learningObjectives,
        reminder: "先明确读取的内容、处理步骤和准确输出，再开始编写代码。",
      }
    : sourceKnowledge;
  const firstExampleInput = task.examples[0]?.input;
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
  const [stdin, setStdin] = useState(() =>
    getExampleProgramInput(task.examples[0]?.input),
  );
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
  const showPlan =
    entryPath === "plan" && learningState.planningDraft.status !== "ready";
  const canEnterCoding =
    planningMode === "direct" || learningState.planningDraft.status === "ready";
  const visibleStepCount = planningMode === "required" ? 3 : planningMode === "short" ? 2 : 1;
  const requiredStepCount = planningMode === "required" ? 2 : 1;

  useEffect(() => {
    setStdin(getExampleProgramInput(firstExampleInput));
  }, [firstExampleInput, taskId]);

  useEffect(() => {
    if (!getAuthToken()) return;
    void ensureStudySession().catch((error) => {
      console.warn("Study session could not be prepared.", error);
    });
  }, []);

  const chooseLearningPath = (path: "understand" | "plan" | "code") => {
    if (
      path === "plan" &&
      !aiTutorEnabled &&
      learningState.planningDraft.status === "ready"
    ) {
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "editing",
          updatedAt: new Date().toISOString(),
        },
      });
    }
    if (path === "code") {
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "ready",
          reviewBypassed: true,
          updatedAt: new Date().toISOString(),
        },
      });
    } else if (learningState.planningDraft.status === "not_started") {
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "editing",
          reviewBypassed: false,
          updatedAt: new Date().toISOString(),
        },
      });
    }
    onEntryPathChange(path);
  };

  const lineCount = useMemo(
    () => Math.max(1, currentCode.split("\n").length),
    [currentCode],
  );

  useEffect(() => {
    onCodeChange?.(currentCode);
  }, [currentCode, onCodeChange]);

  useEffect(() => {
    if (!runResult?.codeSnapshot || runResult.codeSnapshot === currentCode) {
      return;
    }

    setRunResult(undefined);
    setRunStatus("idle");
    onRunResultChange?.(undefined);
    updateState({ latestRunResult: undefined, runStatus: "idle" });
  }, [currentCode, onRunResultChange, runResult, updateState]);

  useEffect(() => {
    if (planningMode !== "direct") {
      return;
    }

    if (learningState.planningDraft.status !== "ready") {
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "ready",
          reviewBypassed: true,
          updatedAt: new Date().toISOString(),
        },
      });
    }
    if (entryPath !== "code") {
      onEntryPathChange("code");
    }
  }, [
    entryPath,
    learningState.planningDraft,
    onEntryPathChange,
    planningMode,
    updateState,
  ]);

  useEffect(() => {
    if (
      aiTutorEnabled &&
      planningMode !== "direct" &&
      planningMode !== "optional" &&
      learningState.planningDraft.status === "ready" &&
      learningState.planningDraft.reviewBypassed
    ) {
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "editing",
          reviewBypassed: false,
          updatedAt: new Date().toISOString(),
        },
      });
      onEntryPathChange("plan");
    }
  }, [
    aiTutorEnabled,
    learningState.planningDraft,
    onEntryPathChange,
    planningMode,
    updateState,
  ]);

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
      testCases: task.testCases
        ? task.testCases.map((testCase) => ({
            id: testCase.id,
            name: testCase.name,
            input: testCase.input,
            expectedOutput: testCase.output,
            visibility: testCase.visibility,
            misconceptionTag: testCase.misconceptionTag,
          }))
        : task.examples.map((example) => ({
            id: example.id,
            name: example.id,
            input: example.input,
            expectedOutput: example.output,
            visibility: "public" as const,
          })),
    });


    const recordedResult = { ...result, codeSnapshot: currentCode };
    setRunResult(recordedResult);
    setRunStatus(result.status);
    updateState({
      hasRunCode: true,
      runStatus: result.status,
      latestRunResult: recordedResult,
    });
    onRunResultChange?.(recordedResult);
    setRecentRuns((runs) => [recordedResult, ...runs].slice(0, 20));

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
    task.testCases,
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
    const hasRequiredSteps = draft.steps
      .slice(0, requiredStepCount)
      .every((step) => step.trim());
    if (!hasRequiredSteps) {
      nextErrors.steps = requiredStepCount === 1
        ? "Add at least one step."
        : "Add at least two steps.";
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

    if (!aiTutorEnabled) {
      const studySessionId = window.sessionStorage.getItem("socratic-study-session-id");
      if (!studySessionId) {
        window.alert(t("No participant session was found. Please return to the login page."));
        return;
      }
      const response = await fetch("/api/assessment/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          studySessionId,
          plan: {
            approach: learningState.planningDraft.approach,
            steps: learningState.planningDraft.steps,
          },
        }),
      });
      if (!response.ok) {
        window.alert(t("Your plan could not be saved. Please try again."));
        return;
      }
      const saved = await response.json();
      updateState({
        planningDraft: {
          ...learningState.planningDraft,
          status: "ready",
          reviewBypassed: true,
          updatedAt: saved.lockedAt ?? new Date().toISOString(),
        },
      });
      onEntryPathChange("code");
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

    if (!aiTutorEnabled) {
      try {
        const response = await fetch("/api/assessment/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId,
            studySessionId: window.sessionStorage.getItem("socratic-study-session-id"),
            taskTitle: task.title,
            taskDescription: task.description,
            plan: {
              approach: learningState.planningDraft.approach,
              steps: learningState.planningDraft.steps,
              lockedAt: learningState.planningDraft.updatedAt,
            },
            code: currentCode,
            runs: recentRuns,
            reflection: {},
          }),
        });
        if (!response.ok) {
          throw new Error("Assessment submission failed");
        }
        invalidateStudyProgress();
        window.location.assign(nextTask?.href ?? "/tasks");
      } catch {
        window.alert(t("Your assessment could not be saved. Please keep this page open and try again."));
      } finally {
        setIsGeneratingReflection(false);
      }
      return;
    }

    try {
      const response = await fetch("/api/tutor/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken() ?? ""}`,
        },
        body: JSON.stringify({
          taskId,
          taskTitle: task.title,
          taskDescription: task.description.join("\n"),
          taskPedagogy: task.pedagogy,
          studySessionId: window.sessionStorage.getItem("socratic-study-session-id"),
          studentMessage: Object.values(learningState.reflectionAnswers).join("\n"),
          currentCode,
          latestRunResult: learningState.latestRunResult,
          conversationId: `reflection-${taskId}`,
          stage: "reflect",
          entryPath: entryPath === "undecided" ? "code" : entryPath,
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
    aiTutorEnabled,
    currentCode,
    entryPath,
    isGeneratingReflection,
    learningState.latestRunResult,
    learningState.reflectionAnswers,
    learningState.planningDraft.approach,
    learningState.planningDraft.steps,
    learningState.planningDraft.updatedAt,
    recentRuns,
    nextTask,
    task.description,
    task.pedagogy,
    task.title,
    taskId,
    t,
    updateState,
  ]);

  const completeTaskAndContinue = useCallback(async () => {
    if (isGeneratingReflection) return;
    setIsGeneratingReflection(true);
    try {
      const studySessionId = await ensureStudySession();
      const response = await fetch("/api/study/task/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          studySessionId,
          entryPath,
          plan: {
            status: learningState.planningDraft.status,
            approach: learningState.planningDraft.approach,
            steps: learningState.planningDraft.steps,
          },
          code: currentCode,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string; detail?: string }
          | null;
        throw new Error(payload?.detail || payload?.error || "Task completion failed");
      }
      invalidateStudyProgress();
      window.location.assign(nextTask?.href ?? "/tasks");
    } catch (error) {
      window.alert(error instanceof Error
        ? t(
          `Your work is saved locally, but the task was not marked complete: ${error.message}`,
          `你的内容已保存在本地，但题目未能标记为完成：${error.message}`,
        )
        : t("Your work is saved locally, but the task was not marked complete. Please try again."));
    } finally {
      setIsGeneratingReflection(false);
    }
  }, [
    currentCode,
    entryPath,
    isGeneratingReflection,
    learningState.planningDraft,
    nextTask,
    taskId,
    t,
  ]);

  const isReflectionComplete = useMemo(
    () =>
      Object.values(learningState.reflectionAnswers).every(
        (answer) => answer.trim().length > 0,
      ),
    [learningState.reflectionAnswers],
  );

  const shouldShowReflection = !aiTutorEnabled
    ? hasRunCode || learningState.hasRunCode
    : runResult?.status === "success" ||
      learningState.latestRunResult?.status === "success";

  return (
    <>
      <section className="flex min-h-[640px] min-w-0 flex-col overflow-x-hidden overflow-y-auto rounded-[22px] border border-[#E4E7F0] bg-white shadow-[0_16px_45px_rgba(78,91,130,0.08)] lg:h-[calc(100dvh-108px)] lg:min-h-0">
      <div className="border-b border-[#E4E7F0] bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">
              Problem
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#101426] sm:text-2xl">
              {task.title}
            </h2>
            <div className="mt-3 max-w-[1120px] border-l-[3px] border-[#8b7cf6] pl-4">
              <p className="text-base font-medium leading-7 text-slate-700">
                {task.description.join(" ")}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceaff] px-2.5 py-0.5 text-[11px] font-bold text-[#6255f6]">
                <BookOpenIcon className="h-3.5 w-3.5" />
                {topicLabels[task.concept]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                <GaugeIcon className="h-3.5 w-3.5" />
                {difficultyLabels[task.thinkingDepth]}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className="inline-flex h-8 w-fit shrink-0 items-center justify-center rounded-lg px-2.5 text-xs font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            View details
          </button>
        </div>

        <section className="mt-4 max-w-[920px]">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
            Examples
          </p>
          {task.examples.map((example, index) => (
            <article
              key={example.id}
              className="grid gap-2 border-t border-[#E4E7F0] py-2.5 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-start sm:gap-4"
            >
              <p className="text-xs font-extrabold text-[#6255f6]">
                #{index + 1}
              </p>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500">Input</p>
                <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap font-mono text-sm font-medium leading-5 text-[#20263a]"><code>{example.input}</code></pre>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-500">Output</p>
                <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap font-mono text-sm font-medium leading-5 text-[#20263a]"><code>{example.output}</code></pre>
              </div>
            </article>
          ))}
        </section>

        {entryPath === "undecided" ? (
          <section className="mt-5 w-full max-w-[920px] rounded-xl border border-[#d9d5ff] bg-[linear-gradient(135deg,#f8f7ff,#eef2ff)] px-4 py-4">
            <h3 className="text-base font-extrabold text-slate-700 sm:text-lg">
              {aiTutorEnabled
                ? planningMode === "optional"
                  ? "How would you like to begin?"
                  : planningMode === "short"
                    ? "Write a quick plan before coding"
                    : "Plan this challenge before coding"
                : "Ready to plan your solution?"}
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500 sm:text-sm">
              {aiTutorEnabled
                ? planningMode === "optional"
                  ? "This Apply task is small enough to code directly. You can also make a simple plan with the AI Tutor."
                  : planningMode === "short"
                    ? "One clear approach and one required step are enough for this Combine task."
                    : "This Solve task combines several ideas. Write an approach and at least two steps, then review it with the Tutor."
                : "Write your plan independently before you begin coding. No AI feedback is provided for this assessment task."}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {!aiTutorEnabled ? (
                <button
                  type="button"
                  onClick={() => chooseLearningPath("plan")}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6C4CF5,#536DFE)] px-5 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(98,85,246,0.2)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20"
                >
                  Start Planning
                </button>
              ) : <>
              <button
                type="button"
                onClick={() => chooseLearningPath(
                  planningMode === "optional" ? "code" : "plan",
                )}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6C4CF5,#536DFE)] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(98,85,246,0.2)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20"
              >
                {planningMode === "optional"
                  ? "Start Coding"
                  : planningMode === "short"
                    ? "Write a Short Plan"
                    : "Build My Plan"}
              </button>
              <button
                type="button"
                onClick={() => chooseLearningPath(
                  planningMode === "optional" ? "plan" : "understand",
                )}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#b9b2ff] bg-white px-4 text-sm font-extrabold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
              >
                {planningMode === "optional"
                  ? "Plan with AI Tutor"
                  : "Help Me Understand"}
              </button>
              </>}
            </div>
          </section>
        ) : null}
      </div>

      {showPlan ? <PlanningPanel
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
        visibleStepCount={visibleStepCount}
        requiredStepCount={requiredStepCount}
        onChange={updatePlanningDraft}
        onReviewPlan={() => {
          void reviewPlan();
        }}
        submitLabel={aiTutorEnabled
          ? planningMode === "optional"
            ? "Review Optional Plan"
            : planningMode === "short"
              ? "Review Short Plan"
              : "Review My Plan"
          : "Start Coding"}
        onEditPlan={editPlanning}
      /> : null}

      {canEnterCoding ? <>
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
      </> : null}
      </section>

      {shouldShowReflection ? (
        <ReflectionPanel
          answers={learningState.reflectionAnswers}
          summary={learningState.reflectionSummary}
          isGenerating={isGeneratingReflection}
          isComplete={isReflectionComplete}
          onAnswersChange={(reflectionAnswers) =>
            updateState({ reflectionAnswers, reflectionSummary: "" })
          }
          onSubmit={() => {
            void generateReflectionSummary();
          }}
          onContinue={() => {
            void completeTaskAndContinue();
          }}
          nextTask={nextTask}
          assessmentOnly={!aiTutorEnabled}
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

              <details className="group rounded-[16px] border border-[#d9d5ff] bg-[#f7f6ff]" open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-extrabold text-[#101426]">
                  Knowledge for This Task
                  <span className="text-xs font-bold text-[#6255f6] group-open:hidden">Show</span>
                  <span className="hidden text-xs font-bold text-[#6255f6] group-open:inline">Hide</span>
                </summary>
                <div className="space-y-4 border-t border-[#d9d5ff] px-4 py-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#101426]">{knowledge.title}</h3>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {knowledge.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Small example</p>
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-[#161b2d] p-4 text-sm leading-6 text-indigo-100"><code>{knowledge.example}</code></pre>
                  </div>
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">Think first: {knowledge.reminder}</p>
                </div>
              </details>

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

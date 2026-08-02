"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeRunResult, RunStatus } from "@/types/code-run";

export interface PlanningDraft {
  approach: string;
  steps: [string, string, string];
  status: PlanningStatus;
  tutorReview?: PlanningReview;
  reviewBypassed?: boolean;
  updatedAt?: string;
}

export type PlanningStatus =
  | "not_started"
  | "editing"
  | "reviewing"
  | "needs_revision"
  | "ready";

export interface PlanningReview {
  status: "ready" | "needs_revision";
  strengths: string[];
  improvement?: string;
  question?: string;
}

export interface ReflectionAnswers {
  understanding: string;
  strategy: string;
  debugging: string;
  transfer: string;
}

export interface TaskLearningState {
  planningDraft: PlanningDraft;
  prediction: string;
  latestRunResult?: CodeRunResult;
  hasRunCode: boolean;
  runStatus: RunStatus;
  reflectionAnswers: ReflectionAnswers;
  reflectionSummary: string;
  progress: number;
}

const emptyPlanningDraft: PlanningDraft = {
  approach: "",
  steps: ["", "", ""],
  status: "not_started",
};

const emptyReflectionAnswers: ReflectionAnswers = {
  understanding: "",
  strategy: "",
  debugging: "",
  transfer: "",
};

function createInitialState(): TaskLearningState {
  return {
    planningDraft: emptyPlanningDraft,
    prediction: "",
    hasRunCode: false,
    runStatus: "idle",
    reflectionAnswers: emptyReflectionAnswers,
    reflectionSummary: "",
    progress: 0,
  };
}

function storageKey(taskId: string) {
  return `socratic-task-learning-state:${taskId}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function calculateProgress(state: TaskLearningState) {
  let progress = 0;
  const hasPlan =
    state.planningDraft.approach.trim() ||
    state.planningDraft.steps.some((step) => step.trim());
  const hasReflection = Object.values(state.reflectionAnswers).some((answer) =>
    answer.trim(),
  );

  if (hasPlan) progress += 25;
  if (state.prediction.trim()) progress += 15;
  if (state.hasRunCode) progress += 20;
  if (state.latestRunResult?.status === "success") progress += 25;
  if (hasReflection || state.reflectionSummary.trim()) progress += 15;

  return Math.min(100, progress);
}

export function loadTaskLearningState(taskId: string): TaskLearningState {
  if (!canUseStorage()) {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(storageKey(taskId));
  if (!raw) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TaskLearningState>;
    const parsedPlanning = parsed.planningDraft as
      | Partial<PlanningDraft> & {
          problemGoal?: string;
          planFeedback?: string;
        }
      | undefined;
    const migratedSteps = parsedPlanning?.steps?.slice(0, 3) ?? ["", "", ""];
    const steps: [string, string, string] = [
      migratedSteps[0] ?? "",
      migratedSteps[1] ?? "",
      migratedSteps[2] ?? "",
    ];
    const approach = parsedPlanning?.approach ?? parsedPlanning?.problemGoal ?? "";
    const hasPlanContent = approach.trim() || steps.some((step) => step.trim());
    const status =
      parsedPlanning?.status ??
      (hasPlanContent ? "editing" : "not_started");
    const state: TaskLearningState = {
      ...createInitialState(),
      ...parsed,
      planningDraft: {
        ...emptyPlanningDraft,
        ...parsedPlanning,
        approach,
        steps,
        status,
      },
      reflectionAnswers: {
        ...emptyReflectionAnswers,
        ...parsed.reflectionAnswers,
      },
    };
    return { ...state, progress: calculateProgress(state) };
  } catch {
    return createInitialState();
  }
}

export function saveTaskLearningState(taskId: string, state: TaskLearningState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(
    storageKey(taskId),
    JSON.stringify({ ...state, progress: calculateProgress(state) }),
  );
}

export function clearTaskLearningState(taskId: string) {
  if (canUseStorage()) {
    window.localStorage.removeItem(storageKey(taskId));
  }
}

export function useTaskLearningState(taskId: string) {
  const [state, setState] = useState<TaskLearningState>(() => createInitialState());

  useEffect(() => {
    setState(loadTaskLearningState(taskId));
  }, [taskId]);

  useEffect(() => {
    saveTaskLearningState(taskId, state);
  }, [state, taskId]);

  const updateState = useCallback((patch: Partial<TaskLearningState>) => {
    setState((current) => {
      const next = { ...current, ...patch };
      return { ...next, progress: calculateProgress(next) };
    });
  }, []);

  return useMemo(
    () => ({ state, updateState, setState }),
    [state, updateState],
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeRunResult, RunStatus } from "@/types/code-run";

export interface PlanningDraft {
  problemGoal: string;
  input: string;
  output: string;
  steps: string[];
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
  problemGoal: "",
  input: "",
  output: "",
  steps: ["", "", ""],
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
    state.planningDraft.problemGoal.trim() ||
    state.planningDraft.input.trim() ||
    state.planningDraft.output.trim() ||
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
    const state: TaskLearningState = {
      ...createInitialState(),
      ...parsed,
      planningDraft: {
        ...emptyPlanningDraft,
        ...parsed.planningDraft,
        steps: parsed.planningDraft?.steps?.slice(0, 3) ?? ["", "", ""],
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

"use client";

import type { TutorConversation, TutorMode } from "@/types/tutor";

const TUTOR_STORAGE_VERSION = 4;

export function getTutorStorageKey(taskId: string) {
  return `socratic-tutor-${taskId}`;
}

export function getTutorModeStorageKey(taskId: string) {
  return `socratic-tutor-mode-${taskId}`;
}

export function loadTutorMode(taskId: string): TutorMode | undefined {
  if (typeof window === "undefined") return undefined;
  const mode = window.localStorage.getItem(getTutorModeStorageKey(taskId));
  return mode === "step_by_step" ||
    mode === "explore_strategies" ||
    mode === "run_and_reflect"
    ? mode
    : undefined;
}

export function saveTutorMode(taskId: string, mode: TutorMode) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(getTutorModeStorageKey(taskId), mode);
  }
}

export function loadTutorConversation(taskId: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  const stored = window.localStorage.getItem(getTutorStorageKey(taskId));
  if (!stored) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(stored) as TutorConversation & {
      schemaVersion?: number;
    };
    if (parsed.schemaVersion !== TUTOR_STORAGE_VERSION) {
      window.localStorage.removeItem(getTutorStorageKey(taskId));
      return undefined;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(getTutorStorageKey(taskId));
    return undefined;
  }
}

export function saveTutorConversation(conversation: TutorConversation) {
  if (typeof window === "undefined") {
    return;
  }

  const safeConversation: TutorConversation & { schemaVersion: number } = {
    ...conversation,
    schemaVersion: TUTOR_STORAGE_VERSION,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      stage: message.stage,
      questionType: message.questionType,
      questionStrategy: message.questionStrategy,
      hintLevel: message.hintLevel,
      learnerState: message.learnerState,
      actionType: message.actionType,
      mode: message.mode,
      choicePrompt: message.choicePrompt,
      agentTrace: message.agentTrace,
      planReview: message.planReview,
      planInteraction: message.planInteraction,
      understandingAssessment: message.understandingAssessment,
      codeAnalysis: message.codeAnalysis,
    })),
  };

  window.localStorage.setItem(
    getTutorStorageKey(conversation.taskId),
    JSON.stringify(safeConversation),
  );
}

export function clearTutorConversation(taskId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(getTutorStorageKey(taskId));
  }
}

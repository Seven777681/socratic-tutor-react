"use client";

import type { TutorConversation } from "@/types/tutor";

export function getTutorStorageKey(taskId: string) {
  return `socratic-tutor-${taskId}`;
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
    return JSON.parse(stored) as TutorConversation;
  } catch {
    window.localStorage.removeItem(getTutorStorageKey(taskId));
    return undefined;
  }
}

export function saveTutorConversation(conversation: TutorConversation) {
  if (typeof window === "undefined") {
    return;
  }

  const safeConversation: TutorConversation = {
    ...conversation,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      stage: message.stage,
      questionType: message.questionType,
      actionType: message.actionType,
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

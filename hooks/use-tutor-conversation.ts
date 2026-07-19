"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type {
  GuidanceStage,
  TutorActionType,
  TutorConversation,
  TutorMessage,
  TutorMode,
  TutorStatus,
} from "@/types/tutor";
import {
  createInitialTutorMessages,
  createSystemTutorMessage,
} from "@/data/mock-tutor-conversations";
import { getTutorResponse } from "@/services/tutor-service";
import {
  clearTutorConversation,
  loadTutorConversation,
  loadTutorMode,
  saveTutorConversation,
  saveTutorMode,
} from "@/hooks/use-tutor-storage";

function createConversation(taskId: string, stage: GuidanceStage, mode: TutorMode): TutorConversation {
  const timestamp = new Date().toISOString();
  return {
    id: `conversation-${taskId}-${Date.now()}`,
    taskId,
    stage,
    mode,
    messages: createInitialTutorMessages(stage, mode),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createStudentMessage(content: string, stage: GuidanceStage): TutorMessage {
  return {
    id: `student-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    role: "student",
    content,
    timestamp: new Date().toISOString(),
    stage,
    actionType: "message",
  };
}

function trackTutorEvent({
  eventType,
  taskId,
  metadata,
}: {
  eventType:
    | "tutor_message_sent"
    | "tutor_response_received"
    | "hint_level_requested"
    | "tutor_rephrase_requested"
    | "reasoning_check_requested";
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

export function useTutorConversation({
  taskId,
  currentCode,
  latestRunResult,
  stage,
}: {
  taskId: string;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  stage: GuidanceStage;
}) {
  const [conversation, setConversation] = useState<TutorConversation>(() =>
    createConversation(taskId, stage, "run_and_reflect"),
  );
  const [tutorMode, setTutorMode] = useState<TutorMode>("run_and_reflect");
  const [status, setStatus] = useState<TutorStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastHandledRunId, setLastHandledRunId] = useState<string | undefined>();

  useEffect(() => {
    const stored = loadTutorConversation(taskId);
    const storedMode = loadTutorMode(taskId) ?? "run_and_reflect";
    setTutorMode(storedMode);
    if (stored) {
      setConversation({ ...stored, stage, mode: storedMode });
      return;
    }

    setConversation(createConversation(taskId, stage, storedMode));
  }, [stage, taskId]);

  useEffect(() => {
    saveTutorConversation(conversation);
  }, [conversation]);

  useEffect(() => {
    setConversation((current) => {
      if (current.stage === stage) {
        return current;
      }

      return {
        ...current,
        stage,
        updatedAt: new Date().toISOString(),
        messages: [
          ...current.messages,
          createSystemTutorMessage(`Current stage is now ${stage}.`, stage),
        ],
      };
    });
  }, [stage]);

  useEffect(() => {
    if (!latestRunResult || latestRunResult.id === lastHandledRunId) {
      return;
    }

    setLastHandledRunId(latestRunResult.id);
    setConversation((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      messages: [
        ...current.messages,
        createSystemTutorMessage(
          "The tutor is now using your latest run result.",
          stage,
        ),
      ],
    }));
  }, [lastHandledRunId, latestRunResult, stage]);

  const hasStudentMessage = useMemo(
    () => conversation.messages.some((message) => message.role === "student"),
    [conversation.messages],
  );

  const requestTutorResponse = useCallback(
    async ({
      studentMessage,
      action,
    }: {
      studentMessage: string;
      action: TutorActionType;
    }) => {
      setStatus("thinking");
      setErrorMessage("");

      try {
        const response = await getTutorResponse({
          taskId,
          studentMessage,
          currentCode,
          latestRunResult,
          stage,
          conversationId: conversation.id,
          conversation: conversation.messages,
          action,
          mode: tutorMode,
        });

        setConversation((current) => ({
          ...current,
          updatedAt: new Date().toISOString(),
          messages: [...current.messages, { ...response, actionType: action }],
        }));
        setStatus("ready");
        trackTutorEvent({
          eventType: "tutor_response_received",
          taskId,
          metadata: { stage, action },
        });
      } catch {
        setStatus("ready");
        setErrorMessage(
          "The tutor could not respond just now. Your message has been kept. Please try again.",
        );
      }
    },
    [
      conversation.messages,
      currentCode,
      latestRunResult,
      stage,
      taskId,
      tutorMode,
    ],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || status === "thinking") {
        return;
      }

      const studentMessage = createStudentMessage(trimmed, stage);
      setConversation((current) => ({
        ...current,
        updatedAt: new Date().toISOString(),
        messages: [...current.messages, studentMessage],
      }));
      trackTutorEvent({
        eventType: "tutor_message_sent",
        taskId,
        metadata: { messageLength: trimmed.length, stage },
      });

      await requestTutorResponse({
        studentMessage: trimmed,
        action: "message",
      });
    },
    [requestTutorResponse, stage, status, taskId],
  );

  const triggerAction = useCallback(
    async (action: Exclude<TutorActionType, "message">) => {
      if (status === "thinking") {
        return;
      }

      const eventType =
        action === "rephrase"
          ? "tutor_rephrase_requested"
          : action === "smaller_hint"
            ? "hint_level_requested"
            : "reasoning_check_requested";
      trackTutorEvent({
        eventType,
        taskId,
        metadata: { stage },
      });

      await requestTutorResponse({
        studentMessage: "",
        action,
      });
    },
    [requestTutorResponse, stage, status, taskId],
  );

  const startNewConversation = useCallback(() => {
    clearTutorConversation(taskId);
    setConversation(createConversation(taskId, stage, tutorMode));
    setErrorMessage("");
  }, [stage, taskId, tutorMode]);

  const clearConversation = useCallback(() => {
    clearTutorConversation(taskId);
    const timestamp = new Date().toISOString();
    setConversation({
      id: `conversation-${taskId}-${Date.now()}`,
      taskId,
      stage,
      mode: tutorMode,
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setErrorMessage("");
  }, [stage, taskId, tutorMode]);

  const changeTutorMode = useCallback((nextMode: TutorMode) => {
    if (nextMode === tutorMode) return;
    const modeCopy: Record<TutorMode, string> = {
      step_by_step: "Guidance mode changed to Step-by-Step Guide.\nThe tutor will break the task into smaller learning steps.",
      explore_strategies: "Guidance mode changed to Explore Strategies.\nThe tutor will help you compare possible approaches.",
      run_and_reflect: "Guidance mode changed to Run & Reflect.\nThe tutor will now use your latest code and run result as context.",
    };
    setTutorMode(nextMode);
    saveTutorMode(taskId, nextMode);
    setConversation((current) => ({
      ...current,
      mode: nextMode,
      updatedAt: new Date().toISOString(),
      messages: [...current.messages, { ...createSystemTutorMessage(modeCopy[nextMode], stage), mode: nextMode }],
    }));
    if (process.env.NODE_ENV === "development") {
      console.info("learning_event", {
        eventType: "tutor_mode_changed",
        taskId,
        timestamp: new Date().toISOString(),
        sessionId: "mock-session",
        metadata: { mode: nextMode },
      });
    }
  }, [stage, taskId, tutorMode]);

  const beginWithQuestion = useCallback(() => {
    setConversation((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      messages: [
        ...current.messages,
        {
          id: `tutor-${Date.now()}`,
          role: "tutor",
          content: "What part of this task feels most uncertain right now?",
          timestamp: new Date().toISOString(),
          questionType: "understanding",
          stage,
        },
      ],
    }));
  }, [stage]);

  return {
    conversation,
    tutorMode,
    changeTutorMode,
    status,
    errorMessage,
    hasStudentMessage,
    sendMessage,
    triggerAction,
    startNewConversation,
    clearConversation,
    beginWithQuestion,
  };
}

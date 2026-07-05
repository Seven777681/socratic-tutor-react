"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type {
  GuidanceStage,
  TutorActionType,
  TutorConversation,
  TutorMessage,
  TutorStatus,
} from "@/types/tutor";
import {
  createInitialTutorMessages,
  createSystemTutorMessage,
} from "@/data/mock-tutor-conversations";
import { getMockTutorResponse } from "@/services/mock-tutor-service";
import {
  clearTutorConversation,
  loadTutorConversation,
  saveTutorConversation,
} from "@/hooks/use-tutor-storage";

function createConversation(taskId: string, stage: GuidanceStage): TutorConversation {
  const timestamp = new Date().toISOString();
  return {
    id: `conversation-${taskId}-${Date.now()}`,
    taskId,
    stage,
    messages: createInitialTutorMessages(stage),
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
    createConversation(taskId, stage),
  );
  const [status, setStatus] = useState<TutorStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastHandledRunId, setLastHandledRunId] = useState<string | undefined>();

  useEffect(() => {
    const stored = loadTutorConversation(taskId);
    if (stored) {
      setConversation({ ...stored, stage });
      return;
    }

    setConversation(createConversation(taskId, stage));
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
        const response = await getMockTutorResponse({
          taskId,
          studentMessage,
          currentCode,
          latestRunResult,
          stage,
          conversation: conversation.messages,
          action,
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
    setConversation(createConversation(taskId, stage));
    setErrorMessage("");
  }, [stage, taskId]);

  const clearConversation = useCallback(() => {
    clearTutorConversation(taskId);
    const timestamp = new Date().toISOString();
    setConversation({
      id: `conversation-${taskId}-${Date.now()}`,
      taskId,
      stage,
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setErrorMessage("");
  }, [stage, taskId]);

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

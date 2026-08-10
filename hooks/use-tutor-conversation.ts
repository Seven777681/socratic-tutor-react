"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type {
  GuidanceStage,
  TutorActionType,
  TutorConversation,
  TutorLearningContext,
  TutorMessage,
  TutorMode,
  TutorPlanInteraction,
  TutorStatus,
} from "@/types/tutor";
import { getTutorResponse } from "@/services/tutor-service";
import {
  clearTutorConversation,
  loadTutorConversation,
  saveTutorConversation,
} from "@/hooks/use-tutor-storage";

const INTERNAL_TUTOR_MODE: TutorMode = "run_and_reflect";

function handledRunStorageKey(taskId: string) {
  return `socratic-tutor-handled-run:${taskId}`;
}

function createPlanningEntryMessage(stage: GuidanceStage): TutorMessage {
  return {
    id: `tutor-entry-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    role: "tutor",
    content: "Before planning, do you already have an approach?",
    timestamp: new Date().toISOString(),
    questionType: "understanding",
    stage,
    mode: INTERNAL_TUTOR_MODE,
    choicePrompt: "planning_entry",
  };
}

function createConversation({
  taskId,
  stage,
}: {
  taskId: string;
  stage: GuidanceStage;
}): TutorConversation {
  const timestamp = new Date().toISOString();
  return {
    id: `conversation-${taskId}-${Date.now()}`,
    taskId,
    stage,
    mode: INTERNAL_TUTOR_MODE,
    messages: stage === "plan" ? [createPlanningEntryMessage(stage)] : [],
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
    | "reasoning_check_requested"
    | "problem_understanding_requested";
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
  taskTitle,
  taskDescription,
  currentCode,
  latestRunResult,
  learningContext,
  stage,
  onPlanInteraction,
  onHintLevelChange,
}: {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  learningContext: TutorLearningContext;
  stage: GuidanceStage;
  onPlanInteraction?: (review: TutorPlanInteraction) => void;
  onHintLevelChange?: (hintLevel: number) => void;
}) {
  const [conversation, setConversation] = useState<TutorConversation>(() =>
    createConversation({ taskId, stage }),
  );
  const [status, setStatus] = useState<TutorStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const initialStage = stage;
    if (latestRunResult?.id) {
      window.sessionStorage.setItem(
        handledRunStorageKey(taskId),
        latestRunResult.id,
      );
    }
    const stored = loadTutorConversation(taskId);
    if (stored) {
      const storedMessages = stored.messages.filter((message) => message.role !== "system");
      setConversation({
        ...stored,
        stage: initialStage,
        mode: INTERNAL_TUTOR_MODE,
        messages:
          storedMessages.length > 0
            ? storedMessages
            : initialStage === "plan"
              ? [createPlanningEntryMessage(initialStage)]
              : [],
      });
      setStatus("ready");
      setErrorMessage("");
      return;
    }

    setConversation(createConversation({ taskId, stage: initialStage }));
    setStatus("ready");
    setErrorMessage("");
    // Initialization belongs to a task change. Stage/run changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    saveTutorConversation(conversation);
  }, [conversation]);

  useEffect(() => {
    setConversation((current) =>
      current.stage === stage
        ? current
        : { ...current, stage, updatedAt: new Date().toISOString() },
    );
  }, [stage]);

  const hasStudentMessage = useMemo(
    () => conversation.messages.some((message) => message.role === "student"),
    [conversation.messages],
  );
  const hasUnresolvedPlanReview = useMemo(() => {
    const latestPlanMessage = [...conversation.messages]
      .reverse()
      .find(
        (message) =>
          message.role === "tutor" &&
          (message.planInteraction || message.planReview),
      );
    const latestPlanState =
      latestPlanMessage?.planInteraction ?? latestPlanMessage?.planReview;

    return Boolean(latestPlanState && !latestPlanState.canEnterCoding);
  }, [conversation.messages]);

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
        const requestConversation = [...conversation.messages];
        if (
          studentMessage.trim() &&
          !(
            requestConversation.at(-1)?.role === "student" &&
            requestConversation.at(-1)?.content.trim() === studentMessage.trim()
          )
        ) {
          requestConversation.push(createStudentMessage(studentMessage.trim(), stage));
        }

        const response = await getTutorResponse({
          taskId,
          taskTitle,
          taskDescription,
          studentMessage,
          currentCode,
          latestRunResult,
          planningData: {
            status: learningContext.planningStatus,
            approach: learningContext.planningApproach,
            steps: learningContext.planningSteps,
          },
          latestPrediction: learningContext.latestPrediction,
          hintLevel: learningContext.hintLevel,
          stage,
          conversationId: conversation.id,
          conversation: requestConversation.filter((message) => message.role !== "system"),
          action,
          mode: INTERNAL_TUTOR_MODE,
        });

        setConversation((current) => ({
          ...current,
          updatedAt: new Date().toISOString(),
          messages: [...current.messages, { ...response, actionType: action }],
        }));
        const planState = response.planInteraction ?? response.planReview;
        if (planState) {
          onPlanInteraction?.({
            ...planState,
            showReviewCard: Boolean(response.planReview),
          });
        }
        if (typeof response.hintLevel === "number") {
          onHintLevelChange?.(response.hintLevel);
        }
        setStatus("ready");
        trackTutorEvent({
          eventType: "tutor_response_received",
          taskId,
          metadata: { stage, action },
        });
      } catch (error) {
        setStatus("ready");
        setErrorMessage(
          error instanceof Error
            ? `${error.message} Your message has been kept. Please try again.`
            : "The tutor could not respond just now. Your message has been kept. Please try again.",
        );
      }
    },
    [
      conversation.messages,
      conversation.id,
      currentCode,
      learningContext.hintLevel,
      learningContext.latestPrediction,
      learningContext.planningApproach,
      learningContext.planningStatus,
      learningContext.planningSteps,
      latestRunResult,
      onPlanInteraction,
      onHintLevelChange,
      stage,
      taskId,
      taskDescription,
      taskTitle,
    ],
  );

  useEffect(() => {
    if (!latestRunResult) {
      return;
    }

    const storageKey = handledRunStorageKey(taskId);
    if (window.sessionStorage.getItem(storageKey) === latestRunResult.id) {
      return;
    }

    window.sessionStorage.setItem(storageKey, latestRunResult.id);
    setConversation((current) => ({
      ...current,
      stage,
      updatedAt: new Date().toISOString(),
    }));

    if (latestRunResult.status !== "success") {
      void requestTutorResponse({
        studentMessage: "",
        action: "debug",
      });
    }
  }, [latestRunResult, requestTutorResponse, stage, taskId]);

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
        action:
          stage === "plan" && hasUnresolvedPlanReview
            ? "review_plan"
            : "message",
      });
    },
    [hasUnresolvedPlanReview, requestTutorResponse, stage, status, taskId],
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
    setConversation(createConversation({ taskId, stage }));
    setErrorMessage("");
  }, [latestRunResult, stage, taskId, taskTitle]);

  const clearConversation = useCallback(() => {
    clearTutorConversation(taskId);
    const timestamp = new Date().toISOString();
    setConversation({
      id: `conversation-${taskId}-${Date.now()}`,
      taskId,
      stage,
      mode: INTERNAL_TUTOR_MODE,
      messages: stage === "plan" ? [createPlanningEntryMessage(stage)] : [],
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
        createStudentMessage("No, help me understand.", stage),
      ],
    }));
    void requestTutorResponse({
      studentMessage: "I don't know how to start.",
      action: "understand_problem",
    });
  }, [requestTutorResponse, stage]);

  const beginWithPlan = useCallback(() => {
    setConversation((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      messages: [
        ...current.messages,
        createStudentMessage("Yes, I have an idea.", stage),
        {
          id: `tutor-${Date.now()}`,
          role: "tutor",
          content: `Great. Write your approach and steps in the Plan section, then use Review My Plan when you want a quick check.`,
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
    beginWithPlan,
  };
}

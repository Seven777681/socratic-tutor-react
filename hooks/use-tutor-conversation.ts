"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { TaskPedagogy } from "@/types/task";
import type { TaskEntryPath } from "@/types/task";
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
import { getParticipantTaskStorageKey } from "@/lib/participant-storage";
import { useLanguage } from "@/components/i18n/language-provider";

const INTERNAL_TUTOR_MODE: TutorMode = "run_and_reflect";

interface ConversationSyncPayload {
  taskId: string;
  studySessionId: string;
  messages: TutorMessage[];
  stage: GuidanceStage;
  entryPath: Exclude<TaskEntryPath, "undecided">;
}

async function syncConversationSnapshot(
  payload: ConversationSyncPayload,
  retriesRemaining = 2,
) {
  try {
    const response = await fetch("/api/study/conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok) throw new Error(`Conversation sync failed (${response.status}).`);
  } catch (error) {
    if (retriesRemaining > 0) {
      window.setTimeout(
        () => void syncConversationSnapshot(payload, retriesRemaining - 1),
        750,
      );
      return;
    }
    console.error("Tutor conversation could not be saved.", error);
  }
}

function handledRunStorageKey(taskId: string) {
  return getParticipantTaskStorageKey("socratic-tutor-handled-run", taskId);
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
    messages: [],
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
  taskPedagogy,
  currentCode,
  latestRunResult,
  learningContext,
  stage,
  entryPath,
  onPlanInteraction,
  onHintLevelChange,
}: {
  taskId: string;
  taskTitle: string;
  taskDescription: string;
  taskPedagogy?: TaskPedagogy;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  learningContext: TutorLearningContext;
  stage: GuidanceStage;
  entryPath: Exclude<TaskEntryPath, "undecided">;
  onPlanInteraction?: (review: TutorPlanInteraction) => void;
  onHintLevelChange?: (hintLevel: number) => void;
}) {
  const { language: uiLanguage, t } = useLanguage();
  const [conversation, setConversation] = useState<TutorConversation>(() =>
    createConversation({ taskId, stage }),
  );
  const [status, setStatus] = useState<TutorStatus>("ready");
  const [errorMessage, setErrorMessage] = useState("");
  const [hydratedTaskId, setHydratedTaskId] = useState<string | null>(null);
  const latestSyncPayloadRef = useRef<ConversationSyncPayload | null>(null);
  useEffect(() => {
    const initialStage = stage;
    const stored = loadTutorConversation(taskId);
    if (stored) {
      const storedMessages = stored.messages.filter(
        (message) =>
          message.role !== "system" && message.choicePrompt !== "planning_entry",
      );
      setConversation({
        ...stored,
        stage: initialStage,
        mode: INTERNAL_TUTOR_MODE,
        messages: storedMessages,
      });
      setStatus("ready");
      setErrorMessage("");
      setHydratedTaskId(taskId);
      return;
    }

    setConversation(createConversation({ taskId, stage: initialStage }));
    setStatus("ready");
    setErrorMessage("");
    setHydratedTaskId(taskId);
    // Initialization belongs to a task change. Stage/run changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  useEffect(() => {
    if (hydratedTaskId !== taskId || conversation.taskId !== taskId) return;

    saveTutorConversation(conversation);
    const studySessionId = window.sessionStorage.getItem("socratic-study-session-id");
    if (!studySessionId || conversation.messages.length === 0) return;

    const payload: ConversationSyncPayload = {
      taskId,
      studySessionId,
      messages: conversation.messages.filter((message) => message.role !== "system"),
      stage: conversation.stage,
      entryPath,
    };
    latestSyncPayloadRef.current = payload;
    void syncConversationSnapshot(payload);
  }, [conversation, entryPath, hydratedTaskId, taskId]);

  useEffect(() => {
    const flushLatestConversation = () => {
      const payload = latestSyncPayloadRef.current;
      if (payload?.taskId === taskId && payload.messages.length > 0) {
        void syncConversationSnapshot(payload);
      }
    };
    window.addEventListener("pagehide", flushLatestConversation);
    return () => {
      window.removeEventListener("pagehide", flushLatestConversation);
      flushLatestConversation();
    };
  }, [taskId]);

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
      idleDurationMs = 0,
    }: {
      studentMessage: string;
      action: TutorActionType;
      idleDurationMs?: number;
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
          uiLanguage,
          taskId,
          taskTitle,
          taskDescription,
          taskPedagogy,
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
          idleDurationMs,
          stage,
          entryPath,
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
        setErrorMessage(error instanceof Error
          ? `${error.message} ${t("Your message was kept. Please try again.", "你的消息已保留，请重试。")}`
          : t(
            "The AI tutor cannot respond right now. Your message was kept. Please try again.",
            "AI 导师暂时无法回复。你的消息已保留，请重试。",
          ));
      }
    },
    [
      conversation.messages,
      conversation.id,
      currentCode,
      entryPath,
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
      taskPedagogy,
      taskTitle,
      t,
      uiLanguage,
    ],
  );

  useEffect(() => {
    if (
      !latestRunResult ||
      hydratedTaskId !== taskId ||
      conversation.taskId !== taskId ||
      status === "thinking"
    ) {
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
    void requestTutorResponse({
      studentMessage: "",
      action: latestRunResult.status === "success" ? "explain_success" : "debug",
    });
  }, [
    conversation.taskId,
    hydratedTaskId,
    latestRunResult,
    requestTutorResponse,
    stage,
    status,
    taskId,
  ]);

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
    async (
      action: Exclude<TutorActionType, "message">,
      options?: { idleDurationMs?: number },
    ) => {
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
        idleDurationMs: options?.idleDurationMs,
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
      messages: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    setErrorMessage("");
  }, [stage, taskId]);

  const beginWithQuestion = useCallback(() => {
    const timestamp = new Date().toISOString();
    setConversation((current) => ({
      ...current,
      updatedAt: timestamp,
      messages: [
        ...current.messages,
        {
          id: `tutor-local-understanding-${Date.now()}`,
          role: "tutor",
          content: "先不用写代码。请用自己的话说一说：这道题要求你从输入中找出或计算什么？",
          timestamp,
          questionType: "understanding",
          stage,
          actionType: "understand_problem",
        },
      ],
    }));
  }, [stage]);

  const beginWithPlan = useCallback(() => {
    setConversation((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      messages: [
        ...current.messages,
        createStudentMessage("我有思路，开始写代码。", stage),
        {
          id: `tutor-${Date.now()}`,
          role: "tutor",
          content: `请先写下你的解题思路和步骤，完成后可以让 AI 导师检查计划。`,
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

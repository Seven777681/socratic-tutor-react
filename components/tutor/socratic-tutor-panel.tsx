"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type {
  GuidanceStage,
  TutorContextSnapshot,
  TutorPlanInteraction,
  TutorLearningContext,
} from "@/types/tutor";
import type { ProgrammingTaskDetail, TaskEntryPath } from "@/types/task";
import { TutorClearDialog } from "@/components/tutor/tutor-clear-dialog";
import { TutorComposer } from "@/components/tutor/tutor-composer";
import { TutorContextSummary } from "@/components/tutor/tutor-context-summary";
import { TutorConversation } from "@/components/tutor/tutor-conversation";
import { TutorGuidelinesDialog } from "@/components/tutor/tutor-guidelines-dialog";
import { TutorHeader } from "@/components/tutor/tutor-header";
import { MemoryDebugPanel } from "@/components/tutor/memory-debug-panel";
import { useTutorConversation } from "@/hooks/use-tutor-conversation";
import { useLanguage } from "@/components/i18n/language-provider";

const IDLE_NUDGE_DELAY_MS = 60_000;

function getGuidanceStage({
  latestRunResult,
  planningStatus,
}: {
  latestRunResult?: CodeRunResult;
  planningStatus: string;
}): GuidanceStage {
  // Planning is a hard pedagogical gate. Restored editor drafts, whitespace,
  // or accidental code edits must not move the tutor into coding guidance.
  if (planningStatus !== "ready") {
    return "plan";
  }

  if (latestRunResult) {
    return latestRunResult.status === "success" ? "reflect" : "debug";
  }

  return "code";
}

export function SocraticTutorPanel({
  task,
  currentCode,
  latestRunResult,
  learningContext,
  planReviewRequestId,
  onPlanInteraction,
  onHintLevelChange,
  entryPath,
  onEnterPlanning,
}: {
  task: ProgrammingTaskDetail;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  learningContext: TutorLearningContext;
  planReviewRequestId?: number;
  onPlanInteraction?: (review: TutorPlanInteraction) => void;
  onHintLevelChange?: (hintLevel: number) => void;
  entryPath: TaskEntryPath;
  onEnterPlanning: () => void;
}) {
  const { t } = useLanguage();
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [showIdleNudge, setShowIdleNudge] = useState(false);
  const [lastLearningActivityAt, setLastLearningActivityAt] = useState(() => Date.now());
  const stage = getGuidanceStage({
    latestRunResult,
    planningStatus: learningContext.planningStatus,
  });
  const {
    conversation,
    status,
    errorMessage,
    sendMessage,
    triggerAction,
    startNewConversation,
    clearConversation,
    beginWithQuestion,
    beginWithPlan,
  } = useTutorConversation({
    taskId: task.id,
    taskTitle: task.title,
    taskDescription: task.description.join("\n"),
    taskPedagogy: task.pedagogy,
    currentCode,
    latestRunResult,
    learningContext,
    stage,
    entryPath: entryPath === "undecided" ? "understand" : entryPath,
    onPlanInteraction,
    onHintLevelChange,
  });
  const lastHandledPlanReviewId = useRef(planReviewRequestId ?? 0);
  const planningHelpStartedRef = useRef(false);

  const markLearningActivity = useCallback(() => {
    setLastLearningActivityAt(Date.now());
    setShowIdleNudge(false);
  }, []);

  useEffect(() => {
    markLearningActivity();
  }, [
    conversation.updatedAt,
    currentCode,
    latestRunResult?.id,
    markLearningActivity,
    stage,
    task.id,
  ]);

  useEffect(() => {
    if (
      (stage !== "code" && stage !== "debug") ||
      status !== "ready" ||
      entryPath === "undecided" ||
      showIdleNudge
    ) {
      return;
    }

    const elapsed = Date.now() - lastLearningActivityAt;
    const timeoutId = window.setTimeout(
      () => setShowIdleNudge(true),
      Math.max(0, IDLE_NUDGE_DELAY_MS - elapsed),
    );
    return () => window.clearTimeout(timeoutId);
  }, [entryPath, lastLearningActivityAt, showIdleNudge, stage, status]);

  useEffect(() => {
    planningHelpStartedRef.current = false;
  }, [task.id]);

  useEffect(() => {
    if (
      entryPath !== "understand" ||
      planningHelpStartedRef.current ||
      conversation.messages.length > 0
    ) {
      return;
    }

    planningHelpStartedRef.current = true;
    beginWithQuestion();
  }, [beginWithQuestion, conversation.messages.length, entryPath]);

  useEffect(() => {
    if (!planReviewRequestId || planReviewRequestId === lastHandledPlanReviewId.current) {
      return;
    }

    lastHandledPlanReviewId.current = planReviewRequestId;
    void triggerAction("review_plan");
  }, [planReviewRequestId, triggerAction]);

  const context = useMemo<TutorContextSnapshot>(
    () => ({
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description[0] ?? "",
      topic: task.topic,
      stage,
      planningStatus: learningContext.planningStatus,
      latestPrediction: learningContext.latestPrediction,
      currentCodeLineCount: Math.max(1, currentCode.split("\n").length),
      latestRunResult,
      latestError: latestRunResult?.error?.message,
      hintLevel: learningContext.hintLevel,
      lastActivity: latestRunResult ? "Code run" : "Code edited",
    }),
    [
      currentCode,
      latestRunResult,
      learningContext.hintLevel,
      learningContext.latestPrediction,
      learningContext.planningStatus,
      stage,
      task.description,
      task.id,
      task.title,
      task.topic,
    ],
  );
  const composerPlaceholder =
    stage === "plan"
      ? "说说你对计划中哪一部分还不确定……"
      : stage === "debug"
        ? "说说你原本希望代码实现什么效果……"
        : stage === "reflect"
          ? "说说你从这个解法中学到了什么……"
          : "可以询问题目、代码或下一步怎么做……";

  return (
    <section className="flex min-h-[620px] w-full min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#E4E7F0] bg-white shadow-[0_14px_40px_rgba(78,91,130,0.07)] lg:h-full lg:min-h-0">
      <TutorHeader
        status={status}
        onStartNew={startNewConversation}
        onClear={() => setIsClearOpen(true)}
        onGuidelines={() => setIsGuidelinesOpen(true)}
      />
      <TutorContextSummary context={context} />
      {entryPath === "undecided" ? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center">
          <div className="max-w-xs rounded-2xl border border-dashed border-[#D9DDF0] bg-[#FBFCFF] px-5 py-6">
            <p className="text-sm font-extrabold text-[#101426]">
              {t("Read the problem first", "请先阅读题目")}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              {t(
                "Choose your learning path below the problem. The Tutor will join when you need guidance.",
                "请在题目下方选择学习路径。需要帮助时，AI 导师会加入并提供引导。",
              )}
            </p>
          </div>
        </div>
      ) : (
        <>
          <TutorConversation
            messages={conversation.messages}
            status={status}
            onBegin={beginWithQuestion}
            onHasIdea={beginWithPlan}
          />
          {entryPath === "understand" &&
          status === "ready" &&
          conversation.messages.some((message) => message.role === "tutor") ? (
            <div className="border-t border-[#E8EAF3] bg-[#FBFCFF] px-4 py-3">
              <p className="mb-2 text-xs font-semibold leading-5 text-slate-500">
                Continue asking questions until the problem is clear. When you can explain the goal and inputs, move on to your plan.
              </p>
              <button
                type="button"
                onClick={onEnterPlanning}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6C4CF5,#536DFE)] px-4 text-sm font-extrabold text-white shadow-[0_8px_18px_rgba(98,85,246,0.2)] transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20"
              >
                I understand — continue to Planning
              </button>
            </div>
          ) : null}
        </>
      )}
      {errorMessage ? (
        <div role="alert" className="mx-4 mb-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold leading-6 text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      {process.env.NODE_ENV === "development" ? (
        <MemoryDebugPanel
          taskId={task.id}
          conversationId={conversation.id}
          messageCount={conversation.messages.length}
        />
      ) : null}
      {showIdleNudge && (stage === "code" || stage === "debug") ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-4 mb-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 shadow-sm"
        >
          <p className="text-sm font-extrabold text-amber-900">
            {t("Need a little help?", "需要一点提示吗？")}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-amber-800/80">
            {t(
              "You can keep thinking, or ask the AI Tutor for one small next step.",
              "你可以继续思考，也可以让 AI 导师只提示下一小步。",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={status === "thinking"}
              onClick={() => {
                const idleDurationMs = Date.now() - lastLearningActivityAt;
                markLearningActivity();
                void triggerAction("idle_help", { idleDurationMs });
              }}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-500 px-4 text-xs font-extrabold text-white transition hover:bg-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-wait disabled:opacity-60"
            >
              {t("Give me one hint", "给我一个提示")}
            </button>
            <button
              type="button"
              onClick={markLearningActivity}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-amber-200 bg-white px-4 text-xs font-bold text-amber-800 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              {t("Not now", "暂时不用")}
            </button>
          </div>
        </div>
      ) : null}
      {entryPath !== "undecided" ? (
        <TutorComposer
          status={status}
          placeholder={composerPlaceholder}
          onSend={sendMessage}
          showHint={stage === "code" || stage === "debug"}
          hintLevel={learningContext.hintLevel}
          onHint={() => void triggerAction("smaller_hint")}
          onActivity={markLearningActivity}
        />
      ) : null}

      {isGuidelinesOpen ? (
        <TutorGuidelinesDialog onClose={() => setIsGuidelinesOpen(false)} />
      ) : null}
      {isClearOpen ? (
        <TutorClearDialog
          onCancel={() => setIsClearOpen(false)}
          onConfirm={() => {
            clearConversation();
            setIsClearOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

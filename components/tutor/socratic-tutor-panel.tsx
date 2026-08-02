"use client";

import { useMemo, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { GuidanceStage, TutorContextSnapshot, TutorLearningContext } from "@/types/tutor";
import type { ProgrammingTaskDetail } from "@/types/task";
import { TutorClearDialog } from "@/components/tutor/tutor-clear-dialog";
import { TutorComposer } from "@/components/tutor/tutor-composer";
import { TutorContextSummary } from "@/components/tutor/tutor-context-summary";
import { TutorConversation } from "@/components/tutor/tutor-conversation";
import { TutorGuidelinesDialog } from "@/components/tutor/tutor-guidelines-dialog";
import { TutorHeader } from "@/components/tutor/tutor-header";
import { TutorQuickActions } from "@/components/tutor/tutor-quick-actions";
import { useTutorConversation } from "@/hooks/use-tutor-conversation";

function getGuidanceStage({
  currentCode,
  starterCode,
  latestRunResult,
}: {
  currentCode: string;
  starterCode: string;
  latestRunResult?: CodeRunResult;
}): GuidanceStage {
  if (!latestRunResult && currentCode.trim() === starterCode.trim()) {
    return "plan";
  }

  if (!latestRunResult) {
    return "code";
  }

  if (latestRunResult.status === "success") {
    return "reflect";
  }

  return "debug";
}

export function SocraticTutorPanel({
  task,
  currentCode,
  latestRunResult,
  learningContext,
}: {
  task: ProgrammingTaskDetail;
  currentCode: string;
  latestRunResult?: CodeRunResult;
  learningContext: TutorLearningContext;
}) {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const stage = getGuidanceStage({
    currentCode,
    starterCode: task.starterCode,
    latestRunResult,
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
  } = useTutorConversation({
    taskId: task.id,
    taskTitle: task.title,
    taskDescription: task.description.join("\n"),
    currentCode,
    latestRunResult,
    learningContext,
    stage,
  });

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
  const hasEditedCode = currentCode.trim() !== task.starterCode.trim();
  const composerPlaceholder =
    stage === "plan"
      ? "Describe the part of the plan you are unsure about..."
      : stage === "debug"
        ? "Explain what you expected your code to do..."
        : stage === "reflect"
          ? "Describe what you learned from this solution..."
          : "Ask about the task, your code, or the next small step...";

  return (
    <section className="flex min-h-[620px] w-full flex-col overflow-hidden rounded-[18px] border border-[#E4E7F0] bg-white shadow-[0_14px_40px_rgba(78,91,130,0.07)] lg:h-full lg:min-h-0">
      <TutorHeader
        status={status}
        onStartNew={startNewConversation}
        onClear={() => setIsClearOpen(true)}
        onGuidelines={() => setIsGuidelinesOpen(true)}
      />
      <TutorContextSummary context={context} />
      <TutorConversation
        messages={conversation.messages}
        status={status}
        onBegin={beginWithQuestion}
      />
      {errorMessage ? (
        <div role="alert" className="mx-4 mb-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm font-semibold leading-6 text-rose-700">
          {errorMessage}
        </div>
      ) : null}
      <TutorQuickActions
        status={status}
        stage={stage}
        hasEditedCode={hasEditedCode}
        latestRunStatus={latestRunResult?.status}
        onAction={triggerAction}
      />
      <TutorComposer
        status={status}
        placeholder={composerPlaceholder}
        onSend={sendMessage}
      />

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

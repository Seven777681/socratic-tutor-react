"use client";

import { useMemo, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { GuidanceStage, TutorContextSnapshot } from "@/types/tutor";
import type { ProgrammingTaskDetail } from "@/types/task";
import { GuidanceStageView } from "@/components/tutor/guidance-stage";
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
}: {
  task: ProgrammingTaskDetail;
  currentCode: string;
  latestRunResult?: CodeRunResult;
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
    currentCode,
    latestRunResult,
    stage,
  });

  const context = useMemo<TutorContextSnapshot>(
    () => ({
      taskId: task.id,
      taskTitle: task.title,
      topic: task.topic,
      stage,
      currentCodeLineCount: Math.max(1, currentCode.split("\n").length),
      latestRunResult,
      lastActivity: latestRunResult ? "Code run" : "Code edited",
    }),
    [currentCode, latestRunResult, stage, task.id, task.title, task.topic],
  );

  return (
    <section className="flex h-full min-h-[620px] flex-col overflow-hidden rounded-[18px] border border-[#E4E7F0] bg-white shadow-[0_14px_40px_rgba(78,91,130,0.07)]">
      <TutorHeader
        status={status}
        onStartNew={startNewConversation}
        onClear={() => setIsClearOpen(true)}
        onGuidelines={() => setIsGuidelinesOpen(true)}
      />
      <GuidanceStageView stage={conversation.stage} />
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
        stage={conversation.stage}
        status={status}
        onAction={triggerAction}
      />
      <TutorComposer status={status} onSend={sendMessage} />

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

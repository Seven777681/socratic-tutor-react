"use client";

import type { TutorMessage as TutorMessageType } from "@/types/tutor";
import { BotIcon } from "@/components/dashboard/dashboard-icons";

function renderInlineCode(content: string) {
  const parts = content.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded bg-white/70 px-1 py-0.5 font-mono text-[0.92em] font-semibold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

const questionTypeLabels = {
  understanding: "AI 导师",
  decomposition: "AI 导师",
  debugging: "调试提示",
  reflection: "学习反思",
  transfer: "边界情况提示",
  strategy_comparison: "AI 导师",
};

export function TutorMessage({
  message,
  onBeginPlanningHelp,
  onHasPlanningIdea,
  canChoosePlanningPath = false,
}: {
  message: TutorMessageType;
  onBeginPlanningHelp?: () => void;
  onHasPlanningIdea?: () => void;
  canChoosePlanningPath?: boolean;
}) {
  if (message.role === "system") {
    return null;
  }

  if (message.role === "student") {
    return (
      <article className="ml-auto max-w-[85%] rounded-2xl bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-3 py-2 text-sm font-semibold leading-6 text-white shadow-sm shadow-indigo-200/70">
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <time className="sr-only" dateTime={message.timestamp}>
          {message.timestamp}
        </time>
      </article>
    );
  }

  return (
    <article className="flex max-w-[92%] items-start gap-2">
      <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <BotIcon className="h-4 w-4" />
      </span>
      <div className="rounded-2xl border border-[#E4E7F0] bg-[#F7F8FF] px-3 py-2 text-sm leading-6 text-slate-700">
        {message.questionType ? (
          <p className="mb-1 text-xs font-extrabold text-[#6255f6]">
            {questionTypeLabels[message.questionType]}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">
          {renderInlineCode(message.content)}
        </p>
        {message.choicePrompt === "planning_entry" && canChoosePlanningPath ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onHasPlanningIdea}
              className="rounded-lg border border-[#b9b2ff] bg-white px-3 py-2 text-xs font-extrabold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
            >
              我有思路，开始写代码
            </button>
            <button
              type="button"
              onClick={onBeginPlanningHelp}
              className="rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-3 py-2 text-xs font-extrabold text-white shadow-sm shadow-indigo-200/70 transition hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
            >
              我还不会，帮我梳理
            </button>
          </div>
        ) : null}
        <time className="sr-only" dateTime={message.timestamp}>
          {message.timestamp}
        </time>
      </div>
    </article>
  );
}

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
  understanding: "Understanding Question",
  decomposition: "Decomposition Question",
  debugging: "Debugging Question",
  reflection: "Reflection Question",
  transfer: "Transfer Question",
};

export function TutorMessage({ message }: { message: TutorMessageType }) {
  if (message.role === "system") {
    return (
      <div className="mx-auto max-w-[95%] rounded-full bg-slate-100 px-3 py-1.5 text-center text-xs font-semibold leading-5 text-slate-600">
        {message.content}
      </div>
    );
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
        <time className="sr-only" dateTime={message.timestamp}>
          {message.timestamp}
        </time>
      </div>
    </article>
  );
}

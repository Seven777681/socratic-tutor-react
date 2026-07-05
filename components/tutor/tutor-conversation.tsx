"use client";

import { useEffect, useRef } from "react";
import type { TutorMessage as TutorMessageType, TutorStatus } from "@/types/tutor";
import { TutorEmptyState } from "@/components/tutor/tutor-empty-state";
import { TutorMessage } from "@/components/tutor/tutor-message";
import { TutorThinkingIndicator } from "@/components/tutor/tutor-thinking-indicator";

export function TutorConversation({
  messages,
  status,
  onBegin,
}: {
  messages: TutorMessageType[];
  status: TutorStatus;
  onBegin: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status]);

  if (messages.length === 0) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <TutorEmptyState onBegin={onBegin} />
      </div>
    );
  }

  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
      aria-live="polite"
    >
      <div className="grid gap-3">
        {messages.map((message) => (
          <TutorMessage key={message.id} message={message} />
        ))}
        {status === "thinking" ? <TutorThinkingIndicator /> : null}
        <div ref={endRef} />
      </div>
    </div>
  );
}

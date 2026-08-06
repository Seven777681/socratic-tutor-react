"use client";

import { useEffect, useRef } from "react";
import type { TutorMessage as TutorMessageType, TutorStatus } from "@/types/tutor";
import { TutorMessage } from "@/components/tutor/tutor-message";
import { TutorThinkingIndicator } from "@/components/tutor/tutor-thinking-indicator";

export function TutorConversation({
  messages,
  status,
  onBegin,
  onHasIdea,
}: {
  messages: TutorMessageType[];
  status: TutorStatus;
  onBegin: () => void;
  onHasIdea: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, status]);

  return (
    <div
      className="tutor-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4"
      aria-live="polite"
    >
      <div className="grid gap-3">
        {messages.map((message, index) => (
          <TutorMessage
            key={message.id}
            message={message}
            onBeginPlanningHelp={onBegin}
            onHasPlanningIdea={onHasIdea}
            canChoosePlanningPath={index === messages.length - 1}
          />
        ))}
        {status === "thinking" ? <TutorThinkingIndicator /> : null}
        <div ref={endRef} />
      </div>
    </div>
  );
}

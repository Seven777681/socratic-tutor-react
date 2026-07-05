"use client";

export function TutorThinkingIndicator() {
  return (
    <div className="flex max-w-[92%] items-center gap-2 rounded-2xl border border-[#E4E7F0] bg-[#F7F8FF] px-3 py-3 text-sm font-semibold text-slate-600">
      <span className="sr-only">Thinking about your reasoning...</span>
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-[#6255f6] motion-safe:animate-bounce" />
        <span className="h-2 w-2 rounded-full bg-[#6255f6] motion-safe:animate-bounce [animation-delay:120ms]" />
        <span className="h-2 w-2 rounded-full bg-[#6255f6] motion-safe:animate-bounce [animation-delay:240ms]" />
      </span>
      Thinking about your reasoning...
    </div>
  );
}

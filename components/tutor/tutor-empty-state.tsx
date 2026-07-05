"use client";

import { BotIcon } from "@/components/dashboard/dashboard-icons";

export function TutorEmptyState({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9DDF0] bg-[#FBFCFF] px-4 py-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <BotIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-base font-extrabold text-[#101426]">
        Start with your current thinking
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Describe what you understand, what you tried, or where you feel stuck.
        The tutor will guide you with questions.
      </p>
      <button
        type="button"
        onClick={onBegin}
        className="mt-4 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 py-2 text-sm font-extrabold text-white shadow-md shadow-indigo-200/70 transition hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
      >
        Begin with a Question
      </button>
    </div>
  );
}

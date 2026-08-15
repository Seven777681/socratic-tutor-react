"use client";

import { BotIcon } from "@/components/dashboard/dashboard-icons";

export function TutorEmptyState({
  onBegin,
  onHasIdea,
}: {
  onBegin: () => void;
  onHasIdea: () => void;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9DDF0] bg-[#FBFCFF] px-4 py-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <BotIcon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-base font-extrabold text-[#101426]">
        你已经有解决这道题的思路了吗？
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        根据你目前的理解选择下一步。
      </p>
      <div className="mt-4 grid w-full gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onHasIdea}
          className="rounded-lg border border-[#b9b2ff] bg-white px-3 py-2 text-sm font-extrabold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
        >
          我有思路，开始写代码
        </button>
        <button
          type="button"
          onClick={onBegin}
          className="rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-3 py-2 text-sm font-extrabold text-white shadow-md shadow-indigo-200/70 transition hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
        >
          我还不会，帮我梳理
        </button>
      </div>
    </div>
  );
}

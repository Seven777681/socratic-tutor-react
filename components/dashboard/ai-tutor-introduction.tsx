"use client";

import Link from "next/link";
import { BrainIcon, BugIcon, CheckCircleIcon, LightbulbIcon, RobotLogo } from "@/components/dashboard/dashboard-icons";
import { useLanguage } from "@/components/i18n/language-provider";

const stages = ["Understand", "Identify input & output", "Plan", "Check readiness", "Code & debug", "Reflect"];

export function AiTutorIntroduction() {
  const { t } = useLanguage();
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#d9d5ff] bg-[linear-gradient(135deg,#ffffff_0%,#f1efff_55%,#edf6ff_100%)] shadow-[0_22px_70px_rgba(78,91,130,0.11)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-center">
        <div>
          <div className="flex items-center gap-3"><RobotLogo /><p className="text-sm font-extrabold text-[#6255f6]">Meet your Socratic AI Tutor</p></div>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-[#101426]">It helps you think—not copy an answer.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">The Tutor asks one useful question at a time, reads your plan and code, and adjusts its hints when you are stuck. Full solutions are not the starting point.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[{ icon: BrainIcon, title: "Plan first", text: "Turn the problem into small steps." }, { icon: LightbulbIcon, title: "Hints grow", text: "Get stronger support only when needed." }, { icon: BugIcon, title: "Debug evidence", text: "Use errors and tests to reason." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-white/80 bg-white/75 p-4"><Icon className="h-5 w-5 text-[#6255f6]" /><p className="mt-3 text-sm font-extrabold">{t(item.title)}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{t(item.text)}</p></div>; })}
          </div>
          <Link href="/tasks/qb-string-formatter" className="mt-6 inline-flex rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-200">Try the Tutor in Task 01 →</Link>
        </div>

        <div className="rounded-[20px] border border-white/90 bg-white/80 p-5 shadow-[0_18px_50px_rgba(78,91,130,0.09)] backdrop-blur sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">How a tutoring session flows</p>
          <ol className="mt-5 grid gap-3">
            {stages.map((stage, index) => <li key={stage} className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-xs font-extrabold text-[#6255f6]">{index + 1}</span><span className="flex-1 rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-4 py-3 text-sm font-bold text-slate-700">{t(stage)}</span>{index === stages.length - 1 ? <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> : null}</li>)}
          </ol>
        </div>
      </div>
    </section>
  );
}

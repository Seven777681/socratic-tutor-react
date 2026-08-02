"use client";

import { useEffect, useState } from "react";
import type { TutorContextSnapshot } from "@/types/tutor";
import {
  BookOpenIcon,
  BugIcon,
  ChevronDownIcon,
  CodeIcon,
  LightbulbIcon,
  TestTubeIcon,
} from "@/components/dashboard/dashboard-icons";

export function TutorContextSummary({
  context,
}: {
  context: TutorContextSnapshot;
}) {
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(false);
  }, [context.taskId]);

  const passed = context.latestRunResult
    ? context.latestRunResult.tests.filter((test) => test.passed).length
    : 0;
  const total = context.latestRunResult?.tests.length ?? 0;
  const latestRun =
    total > 0
      ? `${passed} of ${total} checks passed`
      : context.latestRunResult?.status
        ? context.latestRunResult.status.replace("_", " ")
        : "Not run yet";

  return (
    <section className="border-b border-[#E4E7F0] px-4 py-3">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#F5F7FF] px-3 py-2 text-left transition hover:bg-[#eceaff] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
      >
        <span className="text-sm font-extrabold text-[#101426]">
          Current context
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center gap-2 rounded-xl bg-[#FBFCFF] px-3 py-2">
            <BookOpenIcon className="h-4 w-4 text-[#6255f6]" />
            <dt className="font-bold text-slate-500">Current problem</dt>
            <dd className="ml-auto truncate font-semibold text-[#101426]">
              {context.taskTitle}
            </dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#FBFCFF] px-3 py-2">
            <BugIcon className="h-4 w-4 text-[#6255f6]" />
            <dt className="font-bold text-slate-500">Planning status</dt>
            <dd className="ml-auto font-semibold capitalize text-[#101426]">
              {context.planningStatus.replace("_", " ")}
            </dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#FBFCFF] px-3 py-2">
            <TestTubeIcon className="h-4 w-4 text-[#6255f6]" />
            <dt className="font-bold text-slate-500">Last run result</dt>
            <dd className="ml-auto font-semibold text-[#101426]">
              {latestRun}
            </dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#FBFCFF] px-3 py-2">
            <CodeIcon className="h-4 w-4 text-[#6255f6]" />
            <dt className="font-bold text-slate-500">Latest code available</dt>
            <dd className="ml-auto font-semibold text-[#101426]">
              {context.currentCodeLineCount} lines
            </dd>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#FBFCFF] px-3 py-2">
            <LightbulbIcon className="h-4 w-4 text-[#6255f6]" />
            <dt className="font-bold text-slate-500">Current hint level</dt>
            <dd className="ml-auto font-semibold text-[#101426]">
              Level {context.hintLevel}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}

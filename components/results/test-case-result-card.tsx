"use client";

import type { TestCaseResult } from "@/types/code-run";
import {
  CheckCircleIcon,
  CircleXIcon,
  LockIcon,
} from "@/components/dashboard/dashboard-icons";

export function TestCaseResultCard({ test }: { test: TestCaseResult }) {
  const isHidden = test.visibility === "hidden";

  return (
    <article className="rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-extrabold ${
                test.passed
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {test.passed ? (
                <CheckCircleIcon className="h-3.5 w-3.5" />
              ) : (
                <CircleXIcon className="h-3.5 w-3.5" />
              )}
              {test.passed ? "Passed" : "Failed"}
            </span>
            {isHidden ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                <LockIcon className="h-3.5 w-3.5" />
                Hidden
              </span>
            ) : null}
          </div>
          <h4 className="mt-2 text-sm font-extrabold text-[#101426]">
            {test.name}
          </h4>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {test.feedback}
          </p>
        </div>
      </div>

      {!isHidden ? (
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <div className="rounded-lg bg-white px-2 py-2">
            <p className="font-extrabold text-slate-500">Input</p>
            <pre className="mt-1 overflow-auto font-mono text-[#101426]">
              <code>{test.input || "-"}</code>
            </pre>
          </div>
          <div className="rounded-lg bg-white px-2 py-2">
            <p className="font-extrabold text-slate-500">Expected</p>
            <pre className="mt-1 overflow-auto font-mono text-[#101426]">
              <code>{test.expectedOutput || "-"}</code>
            </pre>
          </div>
          <div className="rounded-lg bg-white px-2 py-2">
            <p className="font-extrabold text-slate-500">Actual</p>
            <pre className="mt-1 overflow-auto font-mono text-[#101426]">
              <code>{test.actualOutput || "-"}</code>
            </pre>
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500">
          Hidden tests protect the full evaluation set, so expected output is
          not shown.
        </p>
      )}
    </article>
  );
}

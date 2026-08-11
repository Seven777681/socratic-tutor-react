"use client";

import Link from "next/link";
import type { ReflectionAnswers } from "@/hooks/use-task-learning-state";
import { ArrowRightIcon } from "@/components/dashboard/dashboard-icons";

const questions: Array<{
  id: keyof ReflectionAnswers;
  label: string;
  prompt: string;
}> = [
  {
    id: "understanding",
    label: "Understanding",
    prompt: "What was the most challenging part?",
  },
  {
    id: "strategy",
    label: "Strategy",
    prompt: "What strategy helped you solve the problem?",
  },
  {
    id: "debugging",
    label: "Debugging",
    prompt: "How did you identify and fix errors?",
  },
  {
    id: "transfer",
    label: "Transfer",
    prompt: "Where else could you apply this idea?",
  },
];

export function ReflectionPanel({
  answers,
  summary,
  isGenerating,
  isComplete,
  onAnswersChange,
  onSubmit,
  nextTask,
}: {
  answers: ReflectionAnswers;
  summary: string;
  isGenerating: boolean;
  isComplete: boolean;
  onAnswersChange: (answers: ReflectionAnswers) => void;
  onSubmit: () => void;
  nextTask?: {
    href: string;
    title: string;
  };
}) {
  return (
    <section className="rounded-[18px] border border-[#E4E7F0] bg-white p-5 shadow-[0_14px_40px_rgba(78,91,130,0.07)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#101426]">
            Reflect on Your Learning
          </h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Capture what changed in your thinking before moving on.
          </p>
        </div>
        {isGenerating ? (
          <p className="text-sm font-bold text-[#6255f6]">Generating summary...</p>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {questions.map((question) => (
          <label key={question.id} className="grid gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
              {question.label}
            </span>
            <textarea
              value={answers[question.id]}
              onChange={(event) =>
                onAnswersChange({ ...answers, [question.id]: event.target.value })
              }
              placeholder={question.prompt}
              className="min-h-[84px] resize-none rounded-xl border border-[#E4E7F0] bg-[#FBFCFF] px-3 py-2 text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {!isComplete ? (
          <p className="text-xs font-bold text-slate-500 sm:mr-auto">
            Complete all four reflection questions before submitting.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isComplete || isGenerating}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#6255f6] px-4 text-sm font-extrabold text-white shadow-sm shadow-indigo-200 transition hover:bg-[#5146d8] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? "Submitting..." : summary ? "Resubmit Reflection" : "Submit Reflection"}
        </button>
      </div>

      {summary ? (
        <div className="mt-4 rounded-xl border border-[#d9d5ff] bg-[#f4f2ff] px-4 py-3">
          <p className="text-sm font-extrabold text-[#101426]">
            Learning Reflection Summary
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#4f46d8]">
            {summary}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 border-t border-[#E4E7F0] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-extrabold text-[#101426]">
            {nextTask ? "Ready for the next challenge?" : "You reached the end of this task list."}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {nextTask ? nextTask.title : "Return to Tasks to review your progress."}
          </p>
        </div>
        <Link
          href={nextTask?.href ?? "/tasks"}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#6C4CF5,#536DFE)] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(98,85,246,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(98,85,246,0.3)] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20 active:translate-y-0"
        >
          {nextTask ? "Next Task" : "Back to Tasks"}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

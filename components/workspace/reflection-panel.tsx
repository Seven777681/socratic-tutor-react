"use client";

import type { ReflectionAnswers } from "@/hooks/use-task-learning-state";

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
  onAnswersChange,
}: {
  answers: ReflectionAnswers;
  summary: string;
  isGenerating: boolean;
  onAnswersChange: (answers: ReflectionAnswers) => void;
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
    </section>
  );
}

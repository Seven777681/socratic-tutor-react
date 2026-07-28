"use client";

import type { PlanningDraft } from "@/hooks/use-task-learning-state";
import { BrainIcon } from "@/components/dashboard/dashboard-icons";

export function PlanningPanel({
  value,
  warning,
  isReviewing,
  reviewMessage,
  onChange,
  onReviewPlan,
}: {
  value: PlanningDraft;
  warning?: string;
  isReviewing: boolean;
  reviewMessage: string;
  onChange: (value: PlanningDraft) => void;
  onReviewPlan: () => void;
}) {
  const updateStep = (index: number, step: string) => {
    const steps = [...value.steps];
    steps[index] = step;
    onChange({ ...value, steps });
  };

  return (
    <section className="border-b border-[#E4E7F0] bg-[#FBFCFF] px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-extrabold text-[#101426]">
            Plan Your Solution
          </h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Before coding, explain what the program needs to do.
          </p>
        </div>
        <button
          type="button"
          onClick={onReviewPlan}
          disabled={isReviewing}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 disabled:cursor-wait disabled:opacity-70"
        >
          <BrainIcon className="h-4 w-4" />
          {isReviewing ? "Reviewing..." : "Ask Tutor to Review My Plan"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
            What is the problem asking?
          </span>
          <textarea
            value={value.problemGoal}
            onChange={(event) =>
              onChange({ ...value, problemGoal: event.target.value })
            }
            placeholder="Describe the goal in your own words."
            className="min-h-[74px] resize-none rounded-xl border border-[#E4E7F0] bg-white px-3 py-2 text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
            Input
          </span>
          <textarea
            value={value.input}
            onChange={(event) => onChange({ ...value, input: event.target.value })}
            placeholder="What information does the program need?"
            className="min-h-[74px] resize-none rounded-xl border border-[#E4E7F0] bg-white px-3 py-2 text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
            Output
          </span>
          <textarea
            value={value.output}
            onChange={(event) => onChange({ ...value, output: event.target.value })}
            placeholder="What should the program produce?"
            className="min-h-[74px] resize-none rounded-xl border border-[#E4E7F0] bg-white px-3 py-2 text-sm leading-6 text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {value.steps.map((step, index) => (
          <input
            key={`step-${index + 1}`}
            value={step}
            onChange={(event) => updateStep(index, event.target.value)}
            placeholder={`Step ${index + 1}`}
            className="h-10 rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        ))}
      </div>

      {warning ? (
        <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
          {warning}
        </p>
      ) : null}
      {reviewMessage ? (
        <p className="mt-3 rounded-xl border border-[#d9d5ff] bg-[#f4f2ff] px-3 py-2 text-sm font-semibold leading-6 text-[#4f46d8]">
          {reviewMessage}
        </p>
      ) : null}
    </section>
  );
}

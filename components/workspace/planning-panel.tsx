"use client";

import type { RefObject } from "react";
import type { PlanningDraft } from "@/hooks/use-task-learning-state";
import {
  BrainIcon,
  CheckCircleIcon,
} from "@/components/dashboard/dashboard-icons";

type PlanningErrors = Partial<Record<"approach" | "steps" | "confidence", string>>;

export function PlanningPanel({
  value,
  errors,
  isReviewing,
  isCollapsed,
  approachPlaceholder,
  firstInvalidRef,
  onChange,
  onReviewPlan,
  onEditPlan,
}: {
  value: PlanningDraft;
  errors: PlanningErrors;
  isReviewing: boolean;
  isCollapsed: boolean;
  approachPlaceholder: string;
  firstInvalidRef: RefObject<HTMLInputElement>;
  onChange: (value: PlanningDraft) => void;
  onReviewPlan: () => void;
  onEditPlan: () => void;
}) {
  const updateStep = (index: number, step: string) => {
    const steps: [string, string, string] = [...value.steps];
    steps[index] = step;
    onChange({ ...value, steps });
  };

  if (isCollapsed) {
    return (
      <section className="border-b border-[#E4E7F0] bg-[#FBFCFF] px-5 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" />
              Plan Ready
            </p>
            <p className="mt-1 line-clamp-2 max-w-[760px] text-sm font-semibold leading-6 text-[#101426]">
              {value.approach || "Your plan is ready for coding."}
            </p>
          </div>
          <button
            type="button"
            onClick={onEditPlan}
            className="inline-flex h-9 w-fit shrink-0 items-center justify-center rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Edit Plan
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-[#E4E7F0] bg-[#FBFCFF] px-5 py-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-extrabold uppercase tracking-normal text-[#101426]">
          Plan Your Solution
        </h3>
        <p className="text-sm font-semibold leading-6 text-slate-500">
          Write a quick plan before you start coding.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-1.5" htmlFor="planning-approach">
          <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
            1. My Approach
          </span>
          <span className="text-sm font-semibold text-slate-600">
            I plan to solve this problem by...
          </span>
          <input
            id="planning-approach"
            ref={firstInvalidRef}
            value={value.approach}
            onChange={(event) =>
              onChange({ ...value, approach: event.target.value })
            }
            placeholder={approachPlaceholder}
            aria-describedby={errors.approach ? "planning-approach-error" : undefined}
            aria-invalid={Boolean(errors.approach)}
            className="h-10 rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
          {errors.approach ? (
            <p id="planning-approach-error" className="text-xs font-bold text-rose-600">
              {errors.approach}
            </p>
          ) : null}
        </label>

        <div className="grid gap-2">
          <h4 className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
            2. My Steps
          </h4>
          {value.steps.map((step, index) => {
            const stepId = `planning-step-${index + 1}`;
            const isOptional = index === 2;
            return (
              <label
                key={stepId}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-2"
                htmlFor={stepId}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eceaff] text-xs font-extrabold text-[#6255f6]">
                  {index + 1}
                </span>
                <span className="sr-only">
                  {`Step ${index + 1}${isOptional ? " optional" : ""}`}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      id={stepId}
                      value={step}
                      onChange={(event) => updateStep(index, event.target.value)}
                      placeholder={`Step ${index + 1}`}
                      aria-describedby={
                        errors.steps && index < 2 ? "planning-steps-error" : undefined
                      }
                      aria-invalid={Boolean(errors.steps && index < 2)}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-semibold text-[#101426] outline-none transition placeholder:text-slate-400 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
                    />
                    {isOptional ? (
                      <span className="shrink-0 text-xs font-bold text-slate-400">
                        Optional
                      </span>
                    ) : null}
                  </div>
                </div>
              </label>
            );
          })}
          {errors.steps ? (
            <p id="planning-steps-error" className="pl-10 text-xs font-bold text-rose-600">
              {errors.steps}
            </p>
          ) : null}
        </div>

        <fieldset className="grid gap-2">
          <legend className="text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
            3. My Confidence
          </legend>
          <p className="text-sm font-semibold text-slate-600">
            How confident are you that your plan will solve the problem?
          </p>
          <div className="flex flex-wrap gap-2" aria-describedby={errors.confidence ? "planning-confidence-error" : undefined}>
            {[1, 2, 3, 4, 5].map((rating) => {
              const selected = value.confidenceRating === rating;
              return (
                <button
                  key={rating}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ ...value, confidenceRating: rating })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-extrabold transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
                    selected
                      ? "border-[#6255f6] bg-[#6255f6] text-white"
                      : "border-[#d9dce8] bg-white text-slate-600 hover:border-[#6255f6] hover:text-[#6255f6]"
                  }`}
                >
                  {rating}
                </button>
              );
            })}
          </div>
          <div className="flex max-w-[248px] justify-between text-xs font-bold text-slate-400">
            <span>Not confident</span>
            <span>Very confident</span>
          </div>
          {errors.confidence ? (
            <p id="planning-confidence-error" className="text-xs font-bold text-rose-600">
              {errors.confidence}
            </p>
          ) : null}
        </fieldset>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onReviewPlan}
          disabled={isReviewing}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-[#6255f6] px-4 text-sm font-bold text-white shadow-sm shadow-indigo-200 transition hover:bg-[#5146d8] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20 disabled:cursor-wait disabled:opacity-70"
        >
          <BrainIcon className="h-4 w-4" />
          {isReviewing ? "Reviewing..." : "Review My Plan"}
        </button>
      </div>
    </section>
  );
}

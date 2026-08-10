import React from "react";

import type {
  TutorCapabilityDimension,
  TutorLearningAssessment,
} from "@/types/tutor";

const capabilityLabels: Array<{
  dimension: TutorCapabilityDimension;
  label: string;
}> = [
  { dimension: "problemUnderstanding", label: "Problem understanding" },
  { dimension: "planning", label: "Planning" },
  { dimension: "implementation", label: "Implementation" },
  { dimension: "debugging", label: "Debugging" },
  { dimension: "reflection", label: "Reflection" },
  { dimension: "independence", label: "Independence" },
];

const capabilityLabelByDimension = Object.fromEntries(
  capabilityLabels.map(({ dimension, label }) => [dimension, label]),
) as Record<TutorCapabilityDimension, string>;

const difficultyLabels = {
  easier: "Gentle practice",
  similar: "Similar challenge",
  harder: "Stretch challenge",
};

function clampScore(score: number) {
  return Math.max(0, Math.min(5, score));
}

function scoreTone(score: number) {
  if (score >= 4) {
    return {
      bar: "bg-emerald-500",
      score: "text-emerald-700",
    };
  }
  if (score >= 3) {
    return {
      bar: "bg-[#6255f6]",
      score: "text-[#5548db]",
    };
  }
  return {
    bar: "bg-amber-400",
    score: "text-amber-700",
  };
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6255f6]">
        {eyebrow}
      </p>
      <h3 className="mt-0.5 text-sm font-black text-slate-900">{title}</h3>
    </div>
  );
}

export function TutorLearningReport({
  assessment,
}: {
  assessment: TutorLearningAssessment;
}) {
  const timeline = [...assessment.timeline].sort((a, b) => a.order - b.order);

  return (
    <section
      aria-label="Learning report"
      className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100/70"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 bg-[linear-gradient(135deg,#f1efff,#eef5ff)] px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#6255f6] shadow-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
            >
              <path
                d="M5 19V9m7 10V5m7 14v-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="m4 5 5 3 5-5 6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#6255f6]">
              Agent 5 · Assessment
            </p>
            <h2 className="text-base font-black text-slate-900">Learning report</h2>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">
              A snapshot based on evidence from this learning session.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-indigo-100 bg-white/90 px-2.5 py-1 text-[10px] font-extrabold text-[#6255f6]">
          Evidence-based
        </span>
      </header>

      <div className="space-y-5 px-4 py-4">
        <section aria-labelledby="capability-heading">
          <div id="capability-heading">
            <SectionTitle eyebrow="Six dimensions" title="Capability snapshot" />
          </div>
          <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {capabilityLabels.map(({ dimension, label }) => {
              const score = clampScore(assessment.capabilities[dimension]);
              const tone = scoreTone(score);

              return (
                <div key={dimension}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-slate-700">{label}</span>
                    <span className={`font-black tabular-nums ${tone.score}`}>
                      {score}/5
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={label}
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={score}
                    className="h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className={`h-full rounded-full transition-[width] ${tone.bar}`}
                      style={{ width: `${score * 20}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {assessment.evidenceBasedEvaluation.length > 0 ? (
          <section aria-labelledby="evidence-heading" className="border-t border-slate-100 pt-4">
            <div id="evidence-heading">
              <SectionTitle eyebrow="Why these scores" title="Evidence and feedback" />
            </div>
            <div className="mt-3 space-y-2">
              {assessment.evidenceBasedEvaluation.map((evaluation, index) => (
                <details
                  key={`${evaluation.dimension}-${index}`}
                  className="group rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2"
                >
                  <summary className="cursor-pointer list-none pr-5 text-xs font-extrabold text-slate-800 marker:content-none">
                    <span className="flex items-center justify-between gap-3">
                      {capabilityLabelByDimension[evaluation.dimension]}
                      <span className="text-base font-normal text-slate-400 transition group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">
                    {evaluation.judgment}
                  </p>
                  {evaluation.evidence.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
                      {evaluation.evidence.map((evidence, evidenceIndex) => (
                        <li
                          key={`${evidence}-${evidenceIndex}`}
                          className="flex gap-2"
                        >
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#6255f6]" />
                          <span>{evidence}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {timeline.length > 0 ? (
          <section aria-labelledby="timeline-heading" className="border-t border-slate-100 pt-4">
            <div id="timeline-heading">
              <SectionTitle eyebrow="Your process" title="Learning timeline" />
            </div>
            <ol className="mt-3 space-y-0">
              {timeline.map((item, index) => (
                <li key={`${item.order}-${item.event}`} className="relative flex gap-3 pb-3 last:pb-0">
                  {index < timeline.length - 1 ? (
                    <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-indigo-100" />
                  ) : null}
                  <span className="relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border-[4px] border-indigo-100 bg-[#6255f6]" />
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold leading-5 text-slate-800">
                      {item.event}
                    </p>
                    <p className="text-[11px] leading-4 text-slate-500">{item.evidence}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section
          aria-labelledby="transfer-heading"
          className="rounded-2xl border border-[#d9d4ff] bg-[linear-gradient(135deg,#f7f5ff,#f2f7ff)] p-3.5"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div id="transfer-heading">
              <SectionTitle eyebrow="Next step" title="Transfer challenge" />
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-extrabold text-[#6255f6] shadow-sm">
              {difficultyLabels[assessment.transferTask.suggestedDifficulty]}
            </span>
          </div>
          <h4 className="mt-3 text-sm font-black text-slate-900">
            {assessment.transferTask.title}
          </h4>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            {assessment.transferTask.objective}
          </p>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-xl bg-white/80 p-2.5">
              <dt className="font-extrabold text-slate-800">Why this helps</dt>
              <dd className="mt-1 leading-5 text-slate-600">{assessment.transferTask.reason}</dd>
            </div>
            <div className="rounded-xl bg-white/80 p-2.5">
              <dt className="font-extrabold text-slate-800">What changes</dt>
              <dd className="mt-1 leading-5 text-slate-600">
                {assessment.transferTask.differenceFromCurrent}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}

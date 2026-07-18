"use client";

import type { TutorMode } from "@/types/tutor";
import {
  ListChecksIcon,
  PlayCircleIcon,
} from "@/components/dashboard/dashboard-icons";

function StrategyBranchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="5" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="7" r="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M6 7v5a6 6 0 0 0 6 6h4M8 6h4a6 6 0 0 1 6 6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const modes: Array<{
  value: TutorMode;
  shortLabel: string;
  label: string;
  description: string;
  icon: typeof ListChecksIcon;
}> = [
  {
    value: "step_by_step",
    shortLabel: "Step-by-Step",
    label: "Step-by-Step Guide",
    description: "Break the problem into smaller guiding steps.",
    icon: ListChecksIcon,
  },
  {
    value: "explore_strategies",
    shortLabel: "Explore",
    label: "Explore Strategies",
    description: "Compare possible approaches before choosing one.",
    icon: StrategyBranchIcon,
  },
  {
    value: "run_and_reflect",
    shortLabel: "Run & Reflect",
    label: "Run & Reflect",
    description: "Use your latest code and run result to guide debugging.",
    icon: PlayCircleIcon,
  },
];

export function GuidanceModeSelector({
  mode,
  onChange,
}: {
  mode: TutorMode;
  onChange: (mode: TutorMode) => void;
}) {
  const selected = modes.find((item) => item.value === mode) ?? modes[2];

  return (
    <section className="border-b border-[#E4E7F0] bg-[#FBFCFF] px-4 py-3">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">
        Guidance Mode
      </p>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Guidance mode">
        {modes.map((item) => {
          const Icon = item.icon;
          const isSelected = item.value === mode;
          return (
            <button
              key={item.value}
              type="button"
              title={item.label}
              aria-label={item.label}
              aria-pressed={isSelected}
              onClick={() => onChange(item.value)}
              className={`flex min-h-[54px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 text-[11px] font-extrabold leading-tight transition motion-reduce:transition-none focus:outline-none focus:ring-4 focus:ring-[#6255f6]/20 ${
                isSelected
                  ? "border-indigo-200 bg-[#eceaff] text-[#5749e8] shadow-sm"
                  : "border-[#E4E7F0] bg-white text-slate-500 hover:border-indigo-200 hover:bg-[#F5F2FF] hover:text-[#6255f6]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="truncate max-w-full">{item.shortLabel}</span>
              {isSelected ? <span className="sr-only">Selected</span> : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] leading-5 text-slate-500" aria-live="polite">
        {selected.description}
      </p>
    </section>
  );
}

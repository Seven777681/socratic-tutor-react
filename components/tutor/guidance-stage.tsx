"use client";

import type { GuidanceStage } from "@/types/tutor";
import { CheckCircleIcon, CircleIcon } from "@/components/dashboard/dashboard-icons";

const stages: { id: GuidanceStage; label: string }[] = [
  { id: "understand", label: "Understand" },
  { id: "plan", label: "Plan" },
  { id: "code", label: "Code" },
  { id: "debug", label: "Debug" },
  { id: "reflect", label: "Reflect" },
];

export function GuidanceStageView({ stage }: { stage: GuidanceStage }) {
  const activeIndex = stages.findIndex((item) => item.id === stage);

  return (
    <section className="border-b border-[#E4E7F0] bg-[#FBFCFF] px-4 py-3">
      <div className="flex items-center justify-between gap-1">
        {stages.map((item, index) => {
          const isActive = item.id === stage;
          const isComplete = index < activeIndex;

          return (
            <div key={item.id} className="flex flex-1 items-center gap-1">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  isActive
                    ? "bg-[#6255f6] text-white"
                    : isComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                }`}
                aria-label={`${item.label}${isActive ? " current stage" : ""}`}
              >
                {isComplete ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : isActive ? (
                  index + 1
                ) : (
                  <CircleIcon className="h-4 w-4" />
                )}
              </span>
              {index < stages.length - 1 ? (
                <span
                  className={`h-0.5 flex-1 rounded-full ${
                    index < activeIndex ? "bg-[#6255f6]" : "bg-[#E4E7F0]"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-extrabold text-slate-600">
        Current stage:{" "}
        <span className="text-[#6255f6]">
          {stages.find((item) => item.id === stage)?.label}
        </span>
      </p>
    </section>
  );
}

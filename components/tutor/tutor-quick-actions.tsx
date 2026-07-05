"use client";

import type { GuidanceStage, TutorActionType, TutorStatus } from "@/types/tutor";
import {
  BrainIcon,
  LightbulbIcon,
  RotateCcwIcon,
} from "@/components/dashboard/dashboard-icons";

export function TutorQuickActions({
  stage,
  status,
  onAction,
}: {
  stage: GuidanceStage;
  status: TutorStatus;
  onAction: (action: Exclude<TutorActionType, "message">) => void;
}) {
  const isReflect = stage === "reflect";
  const actions: {
    label: string;
    ariaLabel: string;
    action: Exclude<TutorActionType, "message">;
    icon: "rephrase" | "hint" | "brain";
  }[] = isReflect
    ? [
        {
          label: "Help Me Explain",
          ariaLabel: "Help me explain my solution",
          action: "rephrase",
          icon: "rephrase",
        },
        {
          label: "Transfer Question",
          ariaLabel: "Ask a transfer question",
          action: "smaller_hint",
          icon: "hint",
        },
        {
          label: "Review Reasoning",
          ariaLabel: "Review my reasoning",
          action: "check_reasoning",
          icon: "brain",
        },
      ]
    : [
        {
          label: "Rephrase",
          ariaLabel: "Rephrase the guiding question",
          action: "rephrase",
          icon: "rephrase",
        },
        {
          label: "Smaller Hint",
          ariaLabel: "Give me a smaller hint",
          action: "smaller_hint",
          icon: "hint",
        },
        {
          label: "Check My Reasoning",
          ariaLabel: "Check my reasoning",
          action: "check_reasoning",
          icon: "brain",
        },
      ];

  return (
    <div className="border-t border-[#E4E7F0] px-4 py-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((item) => {
          const Icon =
            item.icon === "rephrase"
              ? RotateCcwIcon
              : item.icon === "hint"
                ? LightbulbIcon
                : BrainIcon;

          return (
            <button
              key={item.label}
              type="button"
              aria-label={item.ariaLabel}
              disabled={status === "thinking"}
              onClick={() => onAction(item.action)}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-xs font-extrabold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import type { TutorActionType, TutorStatus } from "@/types/tutor";
import {
  BrainIcon,
  LightbulbIcon,
  RotateCcwIcon,
} from "@/components/dashboard/dashboard-icons";

export function TutorQuickActions({
  status,
  onAction,
}: {
  status: TutorStatus;
  onAction: (action: Exclude<TutorActionType, "message">) => void;
}) {
  const actions: {
    label: string;
    ariaLabel: string;
    action: Exclude<TutorActionType, "message">;
    icon: "rephrase" | "hint" | "brain";
  }[] = [
    {
      label: "Help me understand",
      ariaLabel: "Help me understand",
      action: "rephrase",
      icon: "rephrase",
    },
    {
      label: "Give me a smaller hint",
      ariaLabel: "Give me a smaller hint",
      action: "smaller_hint",
      icon: "hint",
    },
    {
      label: "Help me debug",
      ariaLabel: "Help me debug",
      action: "debug",
      icon: "brain",
    },
    {
      label: "Check edge cases",
      ariaLabel: "Check edge cases",
      action: "check_edge_cases",
      icon: "hint",
    },
    {
      label: "Reflect on my solution",
      ariaLabel: "Reflect on my solution",
      action: "reflect_solution",
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

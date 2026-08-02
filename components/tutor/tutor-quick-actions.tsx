"use client";

import type { GuidanceStage, TutorActionType, TutorStatus } from "@/types/tutor";
import type { CodeRunResult } from "@/types/code-run";
import {
  BrainIcon,
  LightbulbIcon,
  RotateCcwIcon,
} from "@/components/dashboard/dashboard-icons";

export function TutorQuickActions({
  status,
  stage,
  hasEditedCode,
  latestRunStatus,
  onAction,
}: {
  status: TutorStatus;
  stage: GuidanceStage;
  hasEditedCode: boolean;
  latestRunStatus?: CodeRunResult["status"];
  onAction: (action: Exclude<TutorActionType, "message">) => void;
}) {
  const actionCatalog: Record<string, {
    label: string;
    ariaLabel: string;
    action: Exclude<TutorActionType, "message">;
    icon: "rephrase" | "hint" | "brain";
  }> = {
    understand: {
      label: "Help me understand",
      ariaLabel: "Help me understand",
      action: "rephrase",
      icon: "rephrase",
    },
    smallerHint: {
      label: "Give me a smaller hint",
      ariaLabel: "Give me a smaller hint",
      action: "smaller_hint",
      icon: "hint",
    },
    debug: {
      label: "Help me debug",
      ariaLabel: "Help me debug",
      action: "debug",
      icon: "brain",
    },
    edgeCases: {
      label: "Check edge cases",
      ariaLabel: "Check edge cases",
      action: "check_edge_cases",
      icon: "hint",
    },
    reflect: {
      label: "Reflect on my solution",
      ariaLabel: "Reflect on my solution",
      action: "reflect_solution",
      icon: "brain",
    },
    reviewPlan: {
      label: "Review my plan",
      ariaLabel: "Review my plan",
      action: "review_plan",
      icon: "brain",
    },
    explainSuccess: {
      label: "Explain why it works",
      ariaLabel: "Explain why it works",
      action: "explain_success",
      icon: "rephrase",
    },
  };

  const actions =
    stage === "plan"
      ? [actionCatalog.reviewPlan, actionCatalog.understand, actionCatalog.smallerHint]
      : latestRunStatus === "success"
        ? [actionCatalog.edgeCases, actionCatalog.reflect, actionCatalog.explainSuccess]
        : latestRunStatus
          ? [actionCatalog.debug, actionCatalog.smallerHint, actionCatalog.edgeCases]
          : hasEditedCode
            ? [actionCatalog.understand, actionCatalog.smallerHint, actionCatalog.edgeCases]
            : [actionCatalog.understand, actionCatalog.smallerHint, actionCatalog.reviewPlan];

  return (
    <div className="border-t border-[#E4E7F0] px-4 py-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 2xl:grid-cols-3">
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
              className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#E4E7F0] bg-white px-2.5 text-center text-xs font-extrabold leading-4 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 disabled:cursor-wait disabled:opacity-60"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

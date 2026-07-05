"use client";

import {
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "@/components/dashboard/dashboard-icons";

export function TutorPanelToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={isCollapsed ? "Open AI tutor panel" : "Close AI tutor panel"}
      aria-expanded={!isCollapsed}
      onClick={onToggle}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
    >
      {isCollapsed ? (
        <PanelRightOpenIcon className="h-5 w-5" />
      ) : (
        <PanelRightCloseIcon className="h-5 w-5" />
      )}
    </button>
  );
}

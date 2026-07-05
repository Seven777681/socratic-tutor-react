import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "@/components/dashboard/dashboard-icons";

export function WorkspacePanelToggle({
  isCollapsed,
  onToggle,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={isCollapsed ? "Expand problem panel" : "Collapse problem panel"}
      onClick={onToggle}
      className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E4E7F0] bg-white text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.98] lg:flex"
    >
      {isCollapsed ? (
        <PanelLeftOpenIcon className="h-5 w-5" />
      ) : (
        <PanelLeftCloseIcon className="h-5 w-5" />
      )}
    </button>
  );
}

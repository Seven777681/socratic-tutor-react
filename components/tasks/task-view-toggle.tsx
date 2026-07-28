import type { TaskViewMode } from "@/types/task";
import {
  BookOpenIcon,
  ListChecksIcon,
} from "@/components/dashboard/dashboard-icons";

const viewModes: Array<{
  value: TaskViewMode;
  label: string;
  icon: "path" | "questions";
}> = [
  { value: "learning_path", label: "Learning Path", icon: "path" },
  { value: "all_questions", label: "All Questions", icon: "questions" },
];

export function TaskViewToggle({
  value,
  onChange,
}: {
  value: TaskViewMode;
  onChange: (value: TaskViewMode) => void;
}) {
  return (
    <div
      className="grid h-12 grid-cols-2 rounded-xl border border-[#E4E7F0] bg-white p-1"
      role="group"
      aria-label="Task view mode"
    >
      {viewModes.map((mode) => {
        const isActive = value === mode.value;
        const Icon = mode.icon === "path" ? BookOpenIcon : ListChecksIcon;

        return (
          <button
            key={mode.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(mode.value)}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
              isActive
                ? "bg-[#eceaff] text-[#6255f6]"
                : "text-slate-600 hover:bg-indigo-50/60"
            }`}
          >
            <Icon className="h-4 w-4" />
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

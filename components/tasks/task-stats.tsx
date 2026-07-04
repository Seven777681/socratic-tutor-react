import type { TaskStatus } from "@/types/task";
import {
  CheckCircleIcon,
  CircleIcon,
  FilterIcon,
  PlayCircleIcon,
} from "@/components/dashboard/dashboard-icons";

type StatFilter = TaskStatus | "all";

const statItems: Array<{
  id: StatFilter;
  label: string;
  icon: "all" | "progress" | "completed" | "not_started";
}> = [
  { id: "all", label: "All Tasks", icon: "all" },
  { id: "in_progress", label: "In Progress", icon: "progress" },
  { id: "completed", label: "Completed", icon: "completed" },
  { id: "not_started", label: "Not Started", icon: "not_started" },
];

function StatIcon({ icon }: { icon: (typeof statItems)[number]["icon"] }) {
  const className = "h-5 w-5";

  if (icon === "progress") {
    return <PlayCircleIcon className={className} />;
  }

  if (icon === "completed") {
    return <CheckCircleIcon className={className} />;
  }

  if (icon === "not_started") {
    return <CircleIcon className={className} />;
  }

  return <FilterIcon className={className} />;
}

export function TaskStats({
  counts,
  activeStatus,
  onStatusChange,
}: {
  counts: Record<StatFilter, number>;
  activeStatus: StatFilter;
  onStatusChange: (status: StatFilter) => void;
}) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-label="Task status overview"
    >
      {statItems.map((item) => {
        const isActive = activeStatus === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onStatusChange(item.id)}
            className={`flex items-center justify-between rounded-[18px] border p-4 text-left shadow-[0_12px_32px_rgba(78,91,130,0.07)] transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] ${
              isActive
                ? "border-[#cfc9ff] bg-[#eceaff] text-[#6255f6]"
                : "border-[#E4E7F0] bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/60"
            }`}
          >
            <span>
              <span className="block text-sm font-bold">{item.label}</span>
              <span className="mt-1 block text-2xl font-extrabold text-[#101426]">
                {counts[item.id]}
              </span>
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-[#6255f6]">
              <StatIcon icon={item.icon} />
            </span>
          </button>
        );
      })}
    </section>
  );
}

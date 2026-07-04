import Link from "next/link";
import type { DashboardModule, ModuleStatus } from "@/types/dashboard";
import { ModuleIconView } from "@/components/dashboard/dashboard-icons";

const statusLabels: Record<ModuleStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  started: "Started",
  not_started: "Not Started",
};

const statusClasses: Record<ModuleStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-[#eceaff] text-[#6255f6]",
  started: "bg-amber-50 text-amber-700",
  not_started: "bg-slate-100 text-slate-600",
};

const progressClasses: Record<number, string> = {
  0: "w-0",
  20: "w-1/5",
  60: "w-3/5",
  75: "w-3/4",
  100: "w-full",
};

export function CourseModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link
      href={module.href}
      className="group flex min-h-[230px] flex-col rounded-[18px] border border-[#E4E7F0] bg-white p-5 shadow-[0_14px_40px_rgba(78,91,130,0.07)] transition duration-300 motion-safe:hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_48px_rgba(78,91,130,0.12)] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6] transition group-hover:bg-[#e3e0ff]">
          <ModuleIconView icon={module.icon} className="h-5 w-5" />
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses[module.status]}`}
        >
          {statusLabels[module.status]}
        </span>
      </div>

      <div className="mt-5 min-w-0">
        <h3 className="text-lg font-extrabold tracking-normal text-[#101426]">
          {module.name}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {module.description}
        </p>
      </div>

      <div className="mt-auto pt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Progress</span>
          <span>{module.progress}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
          role="progressbar"
          aria-label={`${module.name} module progress: ${module.progress}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={module.progress}
        >
          <div
            className={`h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)] transition-[width] duration-300 ${progressClasses[module.progress]}`}
          />
        </div>
      </div>
    </Link>
  );
}

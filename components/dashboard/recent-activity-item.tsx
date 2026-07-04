import Link from "next/link";
import type { ActivityAction, RecentActivity } from "@/types/dashboard";
import {
  ActivityIcon,
  ArrowRightIcon,
} from "@/components/dashboard/dashboard-icons";

const actionLabels: Record<ActivityAction, string> = {
  completed: "Completed",
  saved: "Code saved",
  ai_used: "AI tutor used",
  started: "Started",
};

const actionClasses: Record<ActivityAction, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  saved: "bg-[#eceaff] text-[#6255f6]",
  ai_used: "bg-blue-50 text-blue-700",
  started: "bg-amber-50 text-amber-700",
};

export function RecentActivityItem({
  activity,
  className = "",
}: {
  activity: RecentActivity;
  className?: string;
}) {
  return (
    <li className={className}>
      <Link
        href={activity.href}
        className="group flex items-center gap-4 px-5 py-4 transition hover:bg-indigo-50/60 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#6255f6]/15 sm:px-6"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${actionClasses[activity.action]}`}
        >
          <ActivityIcon action={activity.action} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-[#101426] sm:text-base">
            {activity.taskTitle}
          </span>
          <span className="mt-1 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:gap-2">
            <span>{actionLabels[activity.action]}</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-block" />
            <span>{activity.timestamp}</span>
          </span>
        </span>
        <ArrowRightIcon className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#6255f6]" />
      </Link>
    </li>
  );
}

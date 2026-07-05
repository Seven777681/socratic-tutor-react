import Link from "next/link";
import type { ProgrammingTaskDetail } from "@/types/task";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  RobotLogo,
} from "@/components/dashboard/dashboard-icons";
import {
  difficultyLabels,
  statusLabels,
} from "@/components/tasks/task-formatters";

export function WorkspaceHeader({ task }: { task: ProgrammingTaskDetail }) {
  return (
    <header className="h-[68px] border-b border-[#E4E7F0] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
            aria-label="Go to dashboard"
          >
            <RobotLogo />
          </Link>

          <Link
            href="/tasks"
            className="hidden h-10 items-center gap-2 rounded-lg border border-[#E4E7F0] bg-white px-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 sm:inline-flex"
          >
            <ArrowRightIcon className="h-4 w-4 rotate-180" />
            Tasks
          </Link>

          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold tracking-normal text-[#101426] sm:text-lg">
              Task {String(task.taskNumber).padStart(2, "0")}: {task.title}
            </h1>
            <div className="mt-1 hidden flex-wrap gap-2 md:flex">
              <span className="rounded-full bg-[#eceaff] px-2.5 py-0.5 text-xs font-bold text-[#6255f6]">
                Python
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                {difficultyLabels[task.difficulty]}
              </span>
              <span className="rounded-full bg-[#eceaff] px-2.5 py-0.5 text-xs font-bold text-[#6255f6]">
                {statusLabels[task.status]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 sm:inline-flex">
            <CheckCircleIcon className="h-4 w-4" />
            Saved
          </span>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6657f5,#4F7CFF)] text-sm font-bold text-white"
            aria-label="Student 001"
          >
            S
          </span>
          <Link
            href="/tasks"
            className="hidden h-10 items-center rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 lg:inline-flex"
          >
            Exit Task
          </Link>
        </div>
      </div>
    </header>
  );
}

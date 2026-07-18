import Link from "next/link";
import type { ProgrammingTaskSummary, TaskDifficulty } from "@/types/task";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClockIcon,
  GaugeIcon,
  LockIcon,
} from "@/components/dashboard/dashboard-icons";
import {
  difficultyLabels,
  statusLabels,
  topicLabels,
} from "@/components/tasks/task-formatters";
import { TaskProgress } from "@/components/tasks/task-progress";
import {
  TaskProgressMessage,
  TaskStatusBadge,
} from "@/components/tasks/task-status-badge";

const difficultyClasses: Record<TaskDifficulty, string> = {
  easy: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-rose-50 text-rose-700",
};

function actionLabel(task: ProgrammingTaskSummary) {
  if (task.status === "completed") {
    return "Review Task";
  }

  if (task.status === "in_progress") {
    return "Continue Task";
  }

  if (task.status === "locked") {
    return "Locked";
  }

  return "Start Task";
}

function CardContent({ task }: { task: ProgrammingTaskSummary }) {
  const isPrimaryAction =
    task.status === "not_started" || task.status === "in_progress";

  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_14px_40px_rgba(78,91,130,0.07)] transition duration-300 group-hover:border-indigo-200 group-hover:shadow-[0_18px_48px_rgba(78,91,130,0.12)] motion-safe:group-hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-extrabold text-[#6255f6]">
          Task {String(task.taskNumber).padStart(2, "0")}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {task.imported ? (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Imported
            </span>
          ) : null}
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      <div className="mt-4 min-w-0">
        <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">
          {task.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {task.description}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
          <BookOpenIcon className="h-3.5 w-3.5" />
          {topicLabels[task.topic]}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${difficultyClasses[task.difficulty]}`}
        >
          <GaugeIcon className="h-3.5 w-3.5" />
          {difficultyLabels[task.difficulty]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          <ClockIcon className="h-3.5 w-3.5" />
          {task.estimatedMinutes} min
        </span>
      </div>

      <div className="mt-auto pt-6">
        {task.status === "in_progress" ? (
          <TaskProgress progress={task.progress} label="Task progress" />
        ) : (
          <TaskProgressMessage status={task.status} progress={task.progress} />
        )}

        <span
          className={`mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition ${
            task.status === "locked"
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : isPrimaryAction
                ? "bg-[linear-gradient(90deg,#6657f5,#4678ff)] text-white shadow-lg shadow-indigo-200/80 group-hover:shadow-xl group-hover:shadow-indigo-200"
                : "border border-[#b9b2ff] bg-white text-[#6255f6] group-hover:border-[#6255f6] group-hover:bg-indigo-50/70"
          }`}
          aria-hidden="true"
        >
          {task.status === "locked" ? <LockIcon className="h-4 w-4" /> : null}
          {actionLabel(task)}
          {task.status !== "locked" ? (
            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function TaskCard({ task }: { task: ProgrammingTaskSummary }) {
  if (task.status === "locked") {
    return (
      <article
        className="group opacity-80"
        aria-label={`${task.title}. ${statusLabels[task.status]}. Complete the previous task to unlock.`}
      >
        <CardContent task={task} />
      </article>
    );
  }

  return (
    <Link
      href={task.href}
      className="group block rounded-[20px] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
      aria-label={`${actionLabel(task)}: ${task.title}`}
    >
      <CardContent task={task} />
    </Link>
  );
}

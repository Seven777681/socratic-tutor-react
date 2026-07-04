import type { TaskStatus } from "@/types/task";
import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  LockIcon,
  PlayCircleIcon,
} from "@/components/dashboard/dashboard-icons";
import { statusLabels } from "@/components/tasks/task-formatters";

const statusClasses: Record<TaskStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  in_progress: "bg-[#eceaff] text-[#6255f6]",
  not_started: "bg-slate-100 text-slate-600",
  locked: "bg-slate-100 text-slate-500",
};

function StatusIcon({ status }: { status: TaskStatus }) {
  const className = "h-3.5 w-3.5";

  if (status === "completed") {
    return <CheckCircleIcon className={className} />;
  }

  if (status === "in_progress") {
    return <PlayCircleIcon className={className} />;
  }

  if (status === "locked") {
    return <LockIcon className={className} />;
  }

  return <CircleIcon className={className} />;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusClasses[status]}`}
    >
      <StatusIcon status={status} />
      {statusLabels[status]}
    </span>
  );
}

export function TaskProgressMessage({
  status,
  progress,
}: {
  status: TaskStatus;
  progress: number;
}) {
  if (status === "completed") {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-emerald-700">
        <CheckCircleIcon className="h-4 w-4" />
        Completed
      </p>
    );
  }

  if (status === "locked") {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <LockIcon className="h-4 w-4" />
        Complete the previous task to unlock.
      </p>
    );
  }

  if (status === "in_progress") {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-[#6255f6]">
        <ClockIcon className="h-4 w-4" />
        {progress}% complete
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
      <CircleIcon className="h-4 w-4" />
      Ready to start
    </p>
  );
}

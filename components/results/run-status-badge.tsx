"use client";

import type { RunStatus } from "@/types/code-run";
import {
  CheckCircleIcon,
  CircleIcon,
  CircleXIcon,
  ClockIcon,
  LoaderCircleIcon,
  TriangleAlertIcon,
} from "@/components/dashboard/dashboard-icons";

const statusStyles: Record<RunStatus, string> = {
  idle: "bg-slate-100 text-slate-600",
  running: "bg-[#eceaff] text-[#6255f6]",
  success: "bg-emerald-50 text-emerald-700",
  failed: "bg-amber-50 text-amber-700",
  error: "bg-rose-50 text-rose-700",
  timeout: "bg-orange-50 text-orange-700",
  system_error: "bg-slate-100 text-slate-700",
};

const statusLabels: Record<RunStatus, string> = {
  idle: "Not run yet",
  running: "Running mock",
  success: "Passed",
  failed: "Needs work",
  error: "Error",
  timeout: "Timed out",
  system_error: "System issue",
};

function StatusIcon({ status }: { status: RunStatus }) {
  const className = status === "running" ? "h-4 w-4 motion-safe:animate-spin" : "h-4 w-4";

  if (status === "success") {
    return <CheckCircleIcon className={className} />;
  }

  if (status === "failed") {
    return <CircleXIcon className={className} />;
  }

  if (status === "error" || status === "system_error") {
    return <TriangleAlertIcon className={className} />;
  }

  if (status === "timeout") {
    return <ClockIcon className={className} />;
  }

  if (status === "running") {
    return <LoaderCircleIcon className={className} />;
  }

  return <CircleIcon className={className} />;
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyles[status]}`}
    >
      <StatusIcon status={status} />
      {statusLabels[status]}
    </span>
  );
}

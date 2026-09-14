"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircleIcon, ClockIcon, CodeIcon } from "@/components/dashboard/dashboard-icons";
import { loadTaskLearningState } from "@/hooks/use-task-learning-state";
import { getTaskSummaries } from "@/lib/task-catalog";

interface ActivityItem {
  id: string;
  taskNumber: number;
  title: string;
  action: string;
  detail: string;
  href: string;
  timestamp: string;
  complete: boolean;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const next = getTaskSummaries().flatMap((task) => {
      const state = loadTaskLearningState(task.id);
      const timestamp = state.latestRunResult?.createdAt ?? state.planningDraft.updatedAt;
      if (!timestamp && state.progress === 0) return [];
      const complete = state.latestRunResult?.status === "success" || state.progress >= 100;
      const action = complete
        ? "Solved the task"
        : state.latestRunResult
          ? "Ran the code"
          : state.planningDraft.status !== "not_started"
            ? "Worked on a plan"
            : "Started the task";
      const detail = state.latestRunResult
        ? state.latestRunResult.summary
        : state.planningDraft.status === "ready"
          ? "Plan reviewed and ready for coding"
          : `${state.progress}% thinking progress`;
      return [{ id: task.id, taskNumber: task.taskNumber, title: task.title, action, detail, href: task.href, timestamp: timestamp ?? task.updatedAt, complete }];
    }).sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()).slice(0, 4);
    setActivities(next);
  }, []);

  return (
    <section className="rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_18px_55px_rgba(78,91,130,0.09)] sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">Your progress</p><h2 className="mt-2 text-2xl font-extrabold text-[#101426]">Recent Activity</h2><p className="mt-2 text-sm leading-6 text-slate-500">Pick up where you last planned, coded, or reflected.</p></div>
        <Link href="/tasks" className="hidden rounded-lg px-3 py-2 text-sm font-extrabold text-[#6255f6] hover:bg-indigo-50 sm:inline-flex">View all tasks →</Link>
      </div>

      {activities.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {activities.map((activity) => (
            <Link key={activity.id} href={activity.href} className="group flex gap-4 rounded-[16px] border border-[#E4E7F0] bg-[#FBFCFF] p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${activity.complete ? "bg-emerald-100 text-emerald-700" : "bg-[#eceaff] text-[#6255f6]"}`}>{activity.complete ? <CheckCircleIcon className="h-5 w-5" /> : <CodeIcon className="h-5 w-5" />}</span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-[#6255f6]">Task {String(activity.taskNumber).padStart(2, "0")} · {activity.action}</span><strong className="mt-1 block truncate text-sm text-[#101426]">{activity.title}</strong><span className="mt-1 line-clamp-1 block text-xs font-semibold text-slate-500">{activity.detail}</span><span className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-400"><ClockIcon className="h-3.5 w-3.5" />{formatTime(activity.timestamp)}</span></span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[16px] border border-dashed border-[#cfcaf8] bg-[#f8f7ff] p-5 sm:flex-row sm:items-center">
          <div><p className="font-extrabold text-[#101426]">No activity yet</p><p className="mt-1 text-sm leading-6 text-slate-500">Start with a tiny task. Your planning and coding activity will appear here.</p></div>
          <Link href="/tasks/qb-string-formatter" className="shrink-0 rounded-lg bg-[#6255f6] px-4 py-2.5 text-sm font-extrabold text-white">Start Task 01</Link>
        </div>
      )}
    </section>
  );
}

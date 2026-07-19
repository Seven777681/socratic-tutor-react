"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ProgrammingTaskSummary } from "@/types/task";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  FileCodeIcon,
} from "@/components/dashboard/dashboard-icons";
import {
  difficultyLabels,
  statusLabels,
} from "@/components/tasks/task-formatters";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";

interface SourceGroup {
  id: string;
  name: string;
  tasks: ProgrammingTaskSummary[];
}

function getGroupAction(group: SourceGroup) {
  const nextTask =
    group.tasks.find((task) => task.status !== "completed") ?? group.tasks[0];
  const completedCount = group.tasks.filter(
    (task) => task.status === "completed",
  ).length;

  return {
    href:
      completedCount === group.tasks.length
        ? `/tasks?source=${group.id}`
        : nextTask.href,
    label:
      completedCount === group.tasks.length ? "Review Tasks" : "Continue Learning",
  };
}

function SourceTaskRow({ task }: { task: ProgrammingTaskSummary }) {
  return (
    <Link
      href={task.href}
      className="grid gap-3 rounded-[14px] border border-[#E4E7F0] bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 md:grid-cols-[90px_minmax(0,1fr)_140px_130px_70px_160px] md:items-center"
    >
      <span className="text-sm font-extrabold text-[#6255f6]">
        Task {String(task.taskNumber).padStart(2, "0")}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold text-[#101426]">
          {task.title}
        </span>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
          {task.description}
        </span>
      </span>
      <span className="text-sm font-bold text-slate-600">
        {difficultyLabels[task.difficulty]}
      </span>
      <TaskStatusBadge status={task.status} />
      <span className="text-sm font-bold text-slate-500">{task.progress}%</span>
      <span className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6]">
        {task.status === "completed"
          ? "Review & Reflect"
          : task.status === "in_progress"
            ? "Continue Thinking"
            : "Start Thinking"}
        <ArrowRightIcon className="h-4 w-4" />
      </span>
    </Link>
  );
}

function SourceFileGroup({ group }: { group: SourceGroup }) {
  const [isOpen, setIsOpen] = useState(true);
  const completedCount = group.tasks.filter(
    (task) => task.status === "completed",
  ).length;
  const progress = Math.round((completedCount / group.tasks.length) * 100);
  const action = getGroupAction(group);

  return (
    <article className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="flex min-w-0 items-start gap-3 text-left focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
            <FileCodeIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-2">
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 text-slate-500 transition ${
                  isOpen ? "" : "-rotate-90"
                }`}
              />
              <span className="truncate text-xl font-extrabold tracking-normal text-[#101426]">
                {group.name}
              </span>
            </span>
            <span className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-slate-500">
              <span className="rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
                Python
              </span>
              <span>{group.tasks.length} thinking tasks</span>
              <span>
                {completedCount} of {group.tasks.length} completed
              </span>
            </span>
          </span>
        </button>

        <Link
          href={action.href}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
        >
          {action.label}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Thinking progress</span>
          <span>{progress}%</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
          role="progressbar"
          aria-label={`${group.name} thinking progress: ${progress}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isOpen ? (
        <div className="mt-5 grid gap-3">
          {group.tasks.map((task) => (
            <SourceTaskRow key={task.id} task={task} />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function GroupedBySourceView({
  tasks,
}: {
  tasks: ProgrammingTaskSummary[];
}) {
  const groups = useMemo(
    () =>
      Array.from(
        tasks
          .reduce((map, task) => {
            const current = map.get(task.sourceFileId) ?? {
              id: task.sourceFileId,
              name: task.sourceFileName,
              tasks: [],
            };
            current.tasks.push(task);
            map.set(task.sourceFileId, current);
            return map;
          }, new Map<string, SourceGroup>())
          .values(),
      ),
    [tasks],
  );

  return (
    <section className="grid gap-5" aria-label="Tasks grouped by source file">
      {groups.map((group) => (
        <SourceFileGroup key={group.id} group={group} />
      ))}
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ProgrammingTaskSummary,
  TaskDifficulty,
  TaskFilters,
  TaskSort,
  TaskStatus,
  TaskTopic,
} from "@/types/task";
import { difficultyRank, topicLabels } from "@/components/tasks/task-formatters";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { TaskGrid } from "@/components/tasks/task-grid";
import { TaskStats } from "@/components/tasks/task-stats";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";

const topicValues: TaskTopic[] = [
  "variables",
  "conditionals",
  "loops",
  "functions",
  "lists",
];

const difficultyValues: TaskDifficulty[] = ["easy", "medium", "hard"];
const statusValues: TaskStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "locked",
];

const defaultFilters: TaskFilters = {
  query: "",
  topic: "all",
  difficulty: "all",
  status: "all",
  sort: "recommended",
};

function readParam<Value extends string>(
  value: string | null,
  allowedValues: Value[],
): Value | "all" {
  if (value && allowedValues.includes(value as Value)) {
    return value as Value;
  }

  return "all";
}

function getInitialFilters(searchParams: URLSearchParams): TaskFilters {
  return {
    ...defaultFilters,
    topic: readParam(searchParams.get("topic"), topicValues),
    difficulty: readParam(searchParams.get("difficulty"), difficultyValues),
    status: readParam(searchParams.get("status"), statusValues),
  };
}

function hasFilters(filters: TaskFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.topic !== "all" ||
    filters.difficulty !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "recommended"
  );
}

function filterTasks(tasks: ProgrammingTaskSummary[], filters: TaskFilters) {
  const query = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesQuery =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      topicLabels[task.topic].toLowerCase().includes(query);

    const matchesTopic =
      filters.topic === "all" || task.topic === filters.topic;
    const matchesDifficulty =
      filters.difficulty === "all" || task.difficulty === filters.difficulty;
    const matchesStatus =
      filters.status === "all" || task.status === filters.status;

    return (
      matchesQuery && matchesTopic && matchesDifficulty && matchesStatus
    );
  });
}

function sortTasks(tasks: ProgrammingTaskSummary[], sort: TaskSort) {
  const sortedTasks = [...tasks];

  if (sort === "difficulty_asc") {
    return sortedTasks.sort(
      (first, second) =>
        difficultyRank[first.difficulty] - difficultyRank[second.difficulty],
    );
  }

  if (sort === "difficulty_desc") {
    return sortedTasks.sort(
      (first, second) =>
        difficultyRank[second.difficulty] - difficultyRank[first.difficulty],
    );
  }

  if (sort === "progress") {
    return sortedTasks.sort((first, second) => second.progress - first.progress);
  }

  if (sort === "recently_updated") {
    return sortedTasks.sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime(),
    );
  }

  return sortedTasks.sort((first, second) => first.taskNumber - second.taskNumber);
}

export function TasksPageContent({
  tasks,
}: {
  tasks: ProgrammingTaskSummary[];
}) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TaskFilters>(() =>
    getInitialFilters(searchParams),
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "completed").length,
    [tasks],
  );

  const counts = useMemo(
    () => ({
      all: tasks.length,
      in_progress: tasks.filter((task) => task.status === "in_progress").length,
      completed: completedTasks,
      not_started: tasks.filter(
        (task) => task.status === "not_started" || task.status === "locked",
      ).length,
      locked: tasks.filter((task) => task.status === "locked").length,
    }),
    [completedTasks, tasks],
  );

  const filteredTasks = useMemo(
    () => sortTasks(filterTasks(tasks, filters), filters.sort),
    [filters, tasks],
  );

  const activeStatus =
    filters.status === "in_progress" ||
    filters.status === "completed" ||
    filters.status === "not_started"
      ? filters.status
      : "all";

  const hasActiveFilters = hasFilters(filters);

  const clearFilters = () => setFilters(defaultFilters);

  return (
    <div className="space-y-7">
      <TasksPageHeader
        completedTasks={completedTasks}
        totalTasks={tasks.length}
      />

      <TaskStats
        counts={counts}
        activeStatus={activeStatus}
        onStatusChange={(status) =>
          setFilters((current) => ({ ...current, status }))
        }
      />

      <TaskFilterBar
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-500">
          Showing{" "}
          <span className="text-[#101426]">{filteredTasks.length}</span> of{" "}
          <span className="text-[#101426]">{tasks.length}</span> tasks
        </p>
      </div>

      <div className="motion-safe:animate-[fadeIn_250ms_ease-out]">
        {filteredTasks.length > 0 ? (
          <TaskGrid tasks={filteredTasks} />
        ) : (
          <TasksEmptyState onClearFilters={clearFilters} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ProgrammingTaskSummary,
  TaskDifficulty,
  TaskFilters,
  TaskSort,
  TaskStatus,
  TaskTopic,
  TaskViewMode,
} from "@/types/task";
import { difficultyRank, topicLabels } from "@/components/tasks/task-formatters";
import { GroupedBySourceView } from "@/components/tasks/grouped-by-source-view";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { TaskGrid } from "@/components/tasks/task-grid";
import { TaskStats } from "@/components/tasks/task-stats";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";
import {
  loadImportedTasks,
  toTaskSummary,
} from "@/lib/imported-tasks-storage";

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
];
const sortValues: TaskSort[] = [
  "recommended",
  "newest",
  "source_file",
  "thinking_progress",
  "recently_updated",
];
const viewValues: TaskViewMode[] = ["cards", "by-file"];

const defaultFilters: TaskFilters = {
  query: "",
  source: "all",
  topic: "all",
  depth: "all",
  status: "all",
  sort: "recommended",
  view: "cards",
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
    source: searchParams.get("source") || "all",
    topic: readParam(searchParams.get("topic"), topicValues),
    depth: readParam(searchParams.get("depth"), difficultyValues),
    status: readParam(searchParams.get("status"), statusValues),
    sort: readParam(searchParams.get("sort"), sortValues) === "all"
      ? "recommended"
      : (readParam(searchParams.get("sort"), sortValues) as TaskSort),
    view: readParam(searchParams.get("view"), viewValues) === "all"
      ? "cards"
      : (readParam(searchParams.get("view"), viewValues) as TaskViewMode),
  };
}

function hasFilters(filters: TaskFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.source !== "all" ||
    filters.topic !== "all" ||
    filters.depth !== "all" ||
    filters.status !== "all" ||
    filters.sort !== "recommended" ||
    filters.view !== "cards"
  );
}

function filterTasks(tasks: ProgrammingTaskSummary[], filters: TaskFilters) {
  const query = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesQuery =
      !query ||
      task.title.toLowerCase().includes(query) ||
      task.description.toLowerCase().includes(query) ||
      topicLabels[task.topic].toLowerCase().includes(query) ||
      task.sourceFileName.toLowerCase().includes(query);

    const matchesSource =
      filters.source === "all" || task.sourceFileId === filters.source;
    const matchesTopic =
      filters.topic === "all" || task.topic === filters.topic;
    const matchesDepth =
      filters.depth === "all" || task.difficulty === filters.depth;
    const matchesStatus =
      filters.status === "all" || task.status === filters.status;

    return (
      matchesQuery && matchesSource && matchesTopic && matchesDepth && matchesStatus
    );
  });
}

function sortTasks(tasks: ProgrammingTaskSummary[], sort: TaskSort) {
  const sortedTasks = [...tasks];

  if (sort === "newest") {
    return sortedTasks.sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );
  }

  if (sort === "source_file") {
    return sortedTasks.sort(
      (first, second) =>
        first.sourceFileName.localeCompare(second.sourceFileName) ||
        first.taskNumber - second.taskNumber,
    );
  }

  if (sort === "thinking_progress") {
    return sortedTasks.sort((first, second) => second.progress - first.progress);
  }

  if (sort === "recently_updated") {
    return sortedTasks.sort(
      (first, second) =>
        new Date(second.updatedAt).getTime() -
        new Date(first.updatedAt).getTime(),
    );
  }

  return sortedTasks.sort(
    (first, second) =>
      difficultyRank[first.difficulty] - difficultyRank[second.difficulty] ||
      first.taskNumber - second.taskNumber,
  );
}

export function TasksPageContent({
  tasks,
}: {
  tasks: ProgrammingTaskSummary[];
}) {
  const searchParams = useSearchParams();
  const [importedTasks, setImportedTasks] = useState<ProgrammingTaskSummary[]>([]);
  const [filters, setFilters] = useState<TaskFilters>(() =>
    getInitialFilters(searchParams),
  );

  useEffect(() => {
    const imported = loadImportedTasks().map((task, index) =>
      toTaskSummary(task, tasks.length + index + 1),
    );
    setImportedTasks(imported);
  }, [tasks.length]);

  const allTasks = useMemo(
    () => [...tasks, ...importedTasks],
    [importedTasks, tasks],
  );

  const completedTasks = useMemo(
    () => allTasks.filter((task) => task.status === "completed").length,
    [allTasks],
  );

  const counts = useMemo(
    () => ({
      all: allTasks.length,
      in_progress: allTasks.filter((task) => task.status === "in_progress").length,
      completed: completedTasks,
      not_started: allTasks.filter((task) => task.status === "not_started").length,
    }),
    [allTasks, completedTasks],
  );

  const sourceFiles = useMemo(
    () =>
      Array.from(
        new Map(
          allTasks.map((task) => [
            task.sourceFileId,
            {
              id: task.sourceFileId,
              name: task.sourceFileName,
            },
          ]),
        ).values(),
      ),
    [allTasks],
  );

  const filteredTasks = useMemo(
    () => sortTasks(filterTasks(allTasks, filters), filters.sort),
    [allTasks, filters],
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
        totalTasks={allTasks.length}
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
        sourceFiles={sourceFiles}
        hasActiveFilters={hasActiveFilters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-500">
          Showing{" "}
          <span className="text-[#101426]">{filteredTasks.length}</span> of{" "}
          <span className="text-[#101426]">{allTasks.length}</span> thinking tasks
        </p>
      </div>

      <div className="motion-safe:animate-[fadeIn_250ms_ease-out]">
        {filteredTasks.length > 0 ? (
          filters.view === "by-file" ? (
            <GroupedBySourceView tasks={filteredTasks} />
          ) : (
            <TaskGrid tasks={filteredTasks} />
          )
        ) : (
          <TasksEmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        )}
      </div>
    </div>
  );
}

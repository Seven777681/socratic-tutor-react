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
} from "@/types/task";
import { beginnerTaskOrder } from "@/data/course-content";
import { difficultyRank, topicLabels } from "@/components/tasks/task-formatters";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { TaskDifficultyTabs } from "@/components/tasks/task-difficulty-tabs";
import { TaskGrid } from "@/components/tasks/task-grid";
import { TaskStats } from "@/components/tasks/task-stats";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";
import { getTaskSummaries } from "@/lib/task-catalog";
import { getStudyProgress } from "@/services/study-progress";
import { useLanguage } from "@/components/i18n/language-provider";
import { taskLocalizationsZh } from "@/data/task-localizations-zh";

const topicValues: TaskTopic[] = [
  "variables",
  "conditionals",
  "loops",
  "functions",
  "lists",
  "strings",
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
  "concept",
  "thinking_progress",
  "recently_updated",
];

const defaultFilters: TaskFilters = {
  query: "",
  topic: "all",
  depth: "easy",
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
    depth:
      readParam(searchParams.get("depth"), difficultyValues) === "all"
        ? "easy"
        : readParam(searchParams.get("depth"), difficultyValues),
    status: readParam(searchParams.get("status"), statusValues),
    sort: readParam(searchParams.get("sort"), sortValues) === "all"
      ? "recommended"
      : (readParam(searchParams.get("sort"), sortValues) as TaskSort),
  };
}

function hasFilters(filters: TaskFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.topic !== "all" ||
    filters.depth !== "easy" ||
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
      topicLabels[task.topic].toLowerCase().includes(query) ||
      task.questionSetTitle?.toLowerCase().includes(query) ||
      task.sourceFileName.toLowerCase().includes(query);

    const matchesTopic =
      filters.topic === "all" || task.concept === filters.topic;
    const matchesDepth =
      filters.depth === "all" || task.thinkingDepth === filters.depth;
    const matchesStatus =
      filters.status === "all" || task.status === filters.status;

    return (
      matchesQuery &&
      matchesTopic &&
      matchesDepth &&
      matchesStatus
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

  if (sort === "concept") {
    return sortedTasks.sort(
      (first, second) =>
        first.concept.localeCompare(second.concept) ||
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
      (beginnerTaskOrder.indexOf(first.id) < 0 ? Number.MAX_SAFE_INTEGER : beginnerTaskOrder.indexOf(first.id)) -
        (beginnerTaskOrder.indexOf(second.id) < 0 ? Number.MAX_SAFE_INTEGER : beginnerTaskOrder.indexOf(second.id)) ||
      (first.order ?? first.taskNumber) - (second.order ?? second.taskNumber) ||
      difficultyRank[first.difficulty] - difficultyRank[second.difficulty] ||
      first.taskNumber - second.taskNumber,
  );
}

export function TasksPageContent({
  tasks = [],
}: {
  tasks?: ProgrammingTaskSummary[];
}) {
  const { language, t } = useLanguage();
  const searchParams = useSearchParams();
  const [generatedTasks, setGeneratedTasks] = useState<ProgrammingTaskSummary[]>(tasks);
  const [filters, setFilters] = useState<TaskFilters>(() =>
    getInitialFilters(searchParams),
  );
  useEffect(() => {
    const storedTasks = getTaskSummaries().map((task) => {
      const override = language === "zh" ? taskLocalizationsZh[task.id] : undefined;
      return {
        ...task,
        title: override?.title ?? t(task.title),
        description: override?.description[0] ?? t(task.description),
        sourceFileName: t(task.sourceFileName),
        moduleTitle: task.moduleTitle ? t(task.moduleTitle) : task.moduleTitle,
        questionSetTitle: task.questionSetTitle ? t(task.questionSetTitle) : task.questionSetTitle,
      };
    });
    setGeneratedTasks(storedTasks);

    void getStudyProgress().then((attempts) => {
      const progressByTask = new Map(attempts.map((attempt) => [attempt.task_id, attempt]));
      const restoredTasks = storedTasks.map((task) => {
        const attempt = progressByTask.get(task.id);
        if (!attempt) return task;
        const completed = attempt.status === "completed";
        return {
          ...task,
          status: completed ? "completed" as const : "in_progress" as const,
          progress: completed ? 100 : Math.max(task.progress, 25),
        };
      });
      setGeneratedTasks(restoredTasks);
    });
  }, [language, t]);

  const allTasks = useMemo(
    () => generatedTasks,
    [generatedTasks],
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

  const filteredTasks = useMemo(
    () => sortTasks(filterTasks(allTasks, filters), filters.sort),
    [allTasks, filters],
  );

  const selectedDifficulty =
    filters.depth === "all" ? "easy" : filters.depth;
  const tasksInSelectedDifficulty = useMemo(
    () => allTasks.filter((task) => task.thinkingDepth === selectedDifficulty).length,
    [allTasks, selectedDifficulty],
  );

  const activeStatus =
    filters.status === "in_progress" ||
    filters.status === "completed" ||
    filters.status === "not_started"
      ? filters.status
      : "all";

  const hasActiveFilters = hasFilters(filters);

  const clearFilters = () => setFilters(defaultFilters);
  const hasTasks = allTasks.length > 0;
  return (
    <div className="space-y-7">
      <TasksPageHeader
        completedTasks={completedTasks}
        totalTasks={allTasks.length}
      />

      {hasTasks ? (
        <>
          <TaskStats
            counts={counts}
            activeStatus={activeStatus}
            onStatusChange={(status) =>
              setFilters((current) => ({ ...current, status }))
            }
          />

          <TaskDifficultyTabs
            value={selectedDifficulty}
            onChange={(depth) =>
              setFilters((current) => ({ ...current, depth }))
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
              Showing <span className="text-[#101426]">{filteredTasks.length}</span> of{" "}
              <span className="text-[#101426]">{tasksInSelectedDifficulty}</span> tasks in this difficulty
            </p>
          </div>
        </>
      ) : null}

      <div className="motion-safe:animate-[fadeIn_250ms_ease-out]">
        {!hasTasks ? (
          <TasksEmptyState
            hasActiveFilters={false}
            onClearFilters={clearFilters}
          />
        ) : filteredTasks.length > 0 ? (
            <TaskGrid
              tasks={filteredTasks}
            />
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

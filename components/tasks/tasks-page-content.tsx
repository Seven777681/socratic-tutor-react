"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ProgrammingTaskSummary,
  QuestionBankModuleId,
  TaskDifficulty,
  TaskFilters,
  TaskSort,
  TaskStatus,
  TaskTopic,
  TaskViewMode,
} from "@/types/task";
import { questionModules } from "@/data/question-modules";
import { difficultyRank, topicLabels } from "@/components/tasks/task-formatters";
import { LearningPathTasksView } from "@/components/tasks/learning-path-tasks-view";
import { TaskFilterBar } from "@/components/tasks/task-filter-bar";
import { TaskGrid } from "@/components/tasks/task-grid";
import { TaskStats } from "@/components/tasks/task-stats";
import { TasksEmptyState } from "@/components/tasks/tasks-empty-state";
import { TasksPageHeader } from "@/components/tasks/tasks-page-header";
import { TaskViewToggle } from "@/components/tasks/task-view-toggle";
import { TrashIcon } from "@/components/dashboard/dashboard-icons";
import {
  deleteImportedTask,
  getGeneratedTaskSummaries,
} from "@/lib/imported-tasks-storage";

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
const moduleOrder = [
  "syntax_basics",
  "simple_logic",
  "data_structures",
  "function_design",
  "integrated_challenges",
];
const viewValues: TaskViewMode[] = ["learning_path", "all_questions"];

const defaultFilters: TaskFilters = {
  query: "",
  source: "all",
  taskSource: "all",
  module: "all",
  topic: "all",
  depth: "all",
  status: "all",
  sort: "recommended",
  view: "learning_path",
};

function getRecommendedModuleId(tasks: ProgrammingTaskSummary[]): QuestionBankModuleId {
  const inProgressTask = tasks.find(
    (task) => task.status === "in_progress" && task.moduleId,
  );

  if (inProgressTask?.moduleId) {
    return inProgressTask.moduleId;
  }

  const nextIncompleteModule = questionModules.find((module) => {
    const moduleTasks = tasks.filter((task) => task.moduleId === module.id);

    return (
      moduleTasks.length > 0 &&
      moduleTasks.some((task) => task.status !== "completed")
    );
  });

  return nextIncompleteModule?.id ?? questionModules[0].id;
}

interface TaskContextMenuState {
  task: ProgrammingTaskSummary;
  x: number;
  y: number;
}

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
    taskSource: readParam(searchParams.get("taskSource"), [
      "question_bank",
      "custom_imported",
    ]),
    module: readParam(searchParams.get("module"), [
      "syntax_basics",
      "simple_logic",
      "data_structures",
      "function_design",
      "integrated_challenges",
    ]),
    topic: readParam(searchParams.get("topic"), topicValues),
    depth: readParam(searchParams.get("depth"), difficultyValues),
    status: readParam(searchParams.get("status"), statusValues),
    sort: readParam(searchParams.get("sort"), sortValues) === "all"
      ? "recommended"
      : (readParam(searchParams.get("sort"), sortValues) as TaskSort),
    view: readParam(searchParams.get("view"), viewValues) === "all"
      ? "learning_path"
      : (readParam(searchParams.get("view"), viewValues) as TaskViewMode),
  };
}

function hasFilters(filters: TaskFilters) {
  return (
    filters.query.trim() !== "" ||
    filters.source !== "all" ||
    filters.taskSource !== "all" ||
    filters.module !== "all" ||
    filters.topic !== "all" ||
    filters.depth !== "all" ||
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

    const matchesTaskSource =
      filters.taskSource === "all" || task.sourceType === filters.taskSource;
    const matchesModule =
      filters.module === "all" || task.moduleId === filters.module;
    const matchesSource =
      filters.source === "all" || task.sourceFileId === filters.source;
    const matchesTopic =
      filters.topic === "all" || task.concept === filters.topic;
    const matchesDepth =
      filters.depth === "all" || task.thinkingDepth === filters.depth;
    const matchesStatus =
      filters.status === "all" || task.status === filters.status;

    return (
      matchesQuery &&
      matchesTaskSource &&
      matchesModule &&
      matchesSource &&
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
      moduleOrder.indexOf(first.moduleId ?? "integrated_challenges") -
        moduleOrder.indexOf(second.moduleId ?? "integrated_challenges") ||
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
  const searchParams = useSearchParams();
  const [generatedTasks, setGeneratedTasks] = useState<ProgrammingTaskSummary[]>(tasks);
  const [filters, setFilters] = useState<TaskFilters>(() =>
    getInitialFilters(searchParams),
  );
  const [selectedModuleId, setSelectedModuleId] =
    useState<QuestionBankModuleId>("syntax_basics");
  const [contextMenu, setContextMenu] = useState<TaskContextMenuState | null>(null);

  useEffect(() => {
    const storedTasks = getGeneratedTaskSummaries();
    setGeneratedTasks(storedTasks);
    setSelectedModuleId(getRecommendedModuleId(storedTasks));
  }, []);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeContextMenu = () => setContextMenu(null);

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("keydown", closeContextMenu);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("keydown", closeContextMenu);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
    };
  }, [contextMenu]);

  const allTasks = useMemo(
    () => generatedTasks,
    [generatedTasks],
  );

  const completedTasks = useMemo(
    () => allTasks.filter((task) => task.status === "completed").length,
    [allTasks],
  );

  const currentModuleTitle =
    questionModules.find((module) => module.id === selectedModuleId)?.title ??
    questionModules[0].title;

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

  const activeStatus =
    filters.status === "in_progress" ||
    filters.status === "completed" ||
    filters.status === "not_started"
      ? filters.status
      : "all";

  const hasActiveFilters = hasFilters(filters);

  const clearFilters = () =>
    setFilters((current) => ({
      ...defaultFilters,
      view: current.view,
    }));
  const hasTasks = allTasks.length > 0;
  const openTaskContextMenu = (
    event: ReactMouseEvent,
    task: ProgrammingTaskSummary,
  ) => {
    event.preventDefault();
    setContextMenu({
      task,
      x: event.clientX,
      y: event.clientY,
    });
  };
  const deleteTask = () => {
    if (!contextMenu?.task.imported) {
      setContextMenu(null);
      return;
    }

    deleteImportedTask(contextMenu.task.id);
    setGeneratedTasks(getGeneratedTaskSummaries());
    setContextMenu(null);
  };

  return (
    <div className="space-y-7">
      <TasksPageHeader
        completedTasks={completedTasks}
        totalTasks={allTasks.length}
        currentModuleTitle={currentModuleTitle}
      />

      {hasTasks ? (
        <>
          <div className="flex flex-col gap-4 rounded-[20px] border border-[#E4E7F0] bg-white p-4 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <TaskViewToggle
              value={filters.view}
              onChange={(view) => setFilters((current) => ({ ...current, view }))}
            />
            <p className="text-sm font-semibold text-slate-500">
              {filters.view === "learning_path"
                ? "Focus on one module at a time."
                : "Browse and filter the complete question bank."}
            </p>
          </div>

          {filters.view === "all_questions" ? (
            <>
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
            </>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-slate-500">
              {filters.view === "learning_path" ? (
                <>
                  Showing{" "}
                  <span className="text-[#101426]">{currentModuleTitle}</span> tasks
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="text-[#101426]">{filteredTasks.length}</span> of{" "}
                  <span className="text-[#101426]">{allTasks.length}</span> thinking tasks
                </>
              )}
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
        ) : filters.view === "learning_path" ? (
            <LearningPathTasksView
              tasks={sortTasks(allTasks, "recommended")}
              selectedModuleId={selectedModuleId}
              onSelectedModuleChange={setSelectedModuleId}
              onTaskContextMenu={openTaskContextMenu}
            />
        ) : filteredTasks.length > 0 ? (
            <TaskGrid
              tasks={filteredTasks}
              onTaskContextMenu={openTaskContextMenu}
            />
        ) : (
          <TasksEmptyState
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        )}
      </div>

      {contextMenu ? (
        <div
          role="menu"
          aria-label={`Task actions for ${contextMenu.task.title}`}
          className="fixed z-50 min-w-[180px] rounded-lg border border-[#E4E7F0] bg-white p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!contextMenu.task.imported}
            onClick={deleteTask}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <TrashIcon className="h-4 w-4" />
            Delete Task
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { topicLabels } from "@/components/tasks/task-formatters";
import { getGeneratedTaskSummaries } from "@/lib/imported-tasks-storage";
import type { ContinueTask } from "@/types/dashboard";
import type { ProgrammingTaskSummary } from "@/types/task";

function toContinueTask(task: ProgrammingTaskSummary): ContinueTask {
  return {
    id: task.id,
    title: `Task ${String(task.taskNumber).padStart(2, "0")}: ${task.title}`,
    topic: topicLabels[task.topic],
    difficulty: task.difficulty,
    progress: task.progress,
    lastStudied: "Imported",
    description: task.description,
    href: task.href,
    sourceFileName: task.sourceFileName,
    sourceFileId: task.sourceFileId,
    sourceType: "imported",
  };
}

export function useDashboardLearning() {
  const [task, setTask] = useState<ContinueTask | undefined>(undefined);

  useEffect(() => {
    const tasks = getGeneratedTaskSummaries();
    const nextTask =
      tasks.find((candidate) => candidate.status !== "completed") ?? tasks[0];

    setTask(nextTask ? toContinueTask(nextTask) : undefined);
  }, []);

  return useMemo(() => ({ task }), [task]);
}

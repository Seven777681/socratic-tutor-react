"use client";

import { useEffect, useState } from "react";
import { mockTasks } from "@/data/tasks";
import { findImportedTaskDetail } from "@/lib/imported-tasks-storage";
import type { ProgrammingTaskDetail } from "@/types/task";
import { TaskNotFound } from "@/components/workspace/task-not-found";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export function ImportedTaskWorkspace({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<ProgrammingTaskDetail | null | undefined>(undefined);

  useEffect(() => {
    setTask(findImportedTaskDetail(taskId, mockTasks.length) ?? null);
  }, [taskId]);

  if (task === undefined) {
    return (
      <main className="min-h-[100dvh] bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] px-5 py-12 text-center text-sm font-bold text-slate-500">
        Loading imported task...
      </main>
    );
  }

  if (!task) {
    return <TaskNotFound />;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden text-[#101426]">
      <WorkspaceHeader task={task} />
      <WorkspaceLayout task={task} />
    </main>
  );
}

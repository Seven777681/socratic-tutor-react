"use client";

import { useEffect, useMemo, useState } from "react";
import type { RecentUpload } from "@/types/dashboard";
import { mockRecentUploads } from "@/data/dashboard";
import {
  loadImportHistory,
  loadImportedTasks,
} from "@/lib/imported-tasks-storage";

function formatImportedAt(value: string) {
  const importedAt = new Date(value);

  if (Number.isNaN(importedAt.getTime())) {
    return value;
  }

  const diffMs = Date.now() - importedAt.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return "Just now";
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return importedAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function useDashboardUploads() {
  const [uploads, setUploads] = useState<RecentUpload[]>(mockRecentUploads);

  useEffect(() => {
    const history = loadImportHistory();
    const importedTasks = loadImportedTasks();

    if (!history.length) {
      setUploads(mockRecentUploads);
      return;
    }

    const nextUploads = history.map((entry) => {
      const sourceTasks = importedTasks.filter((task) =>
        entry.taskIds.includes(task.id),
      );
      const generatedTaskCount = entry.taskCount || sourceTasks.length;
      const completedTaskCount = sourceTasks.filter(
        (task) => task.status === "completed",
      ).length;
      const progress =
        generatedTaskCount > 0
          ? Math.round((completedTaskCount / generatedTaskCount) * 100)
          : 0;
      const continueTask =
        sourceTasks.find((task) => task.status !== "completed") ??
        sourceTasks[0];

      return {
        id: entry.file.id,
        fileName: entry.file.name,
        fileType: entry.file.type,
        language: "Python" as const,
        generatedTaskCount,
        completedTaskCount,
        progress,
        importedAt: formatImportedAt(entry.importedAt),
        continueTaskId: continueTask?.id,
        sourceTaskIds: entry.taskIds,
      };
    });

    setUploads(nextUploads);
  }, []);

  return useMemo(() => ({ uploads }), [uploads]);
}

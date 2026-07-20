"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyDashboardStats } from "@/data/dashboard";
import {
  loadImportHistory,
  getGeneratedTasks,
} from "@/lib/imported-tasks-storage";
import type { DashboardStat, DashboardStats } from "@/types/dashboard";

export function getDashboardStats(): DashboardStats {
  const importHistory = loadImportHistory();
  const importedTasks = getGeneratedTasks();

  const questionsTotal = importedTasks.length;
  const questionsCompleted = importedTasks.filter(
    (task) => task.status === "completed",
  ).length;

  return {
    filesAnalysed: importHistory.length,
    questionsCompleted,
    questionsTotal,
    learningStreakDays: emptyDashboardStats.learningStreakDays,
  };
}

function toDashboardStatCards(stats: DashboardStats): DashboardStat[] {
  const streakUnit = stats.learningStreakDays === 1 ? "day" : "days";

  return [
    {
      id: "files-analysed",
      title: "Files Analysed",
      value: String(stats.filesAnalysed),
      description: "Class files processed",
      icon: "files",
    },
    {
      id: "questions-explored",
      title: "Questions Explored",
      value: `${stats.questionsCompleted} / ${stats.questionsTotal}`,
      description: "Generated questions completed",
      icon: "questions",
    },
    {
      id: "learning-streak",
      title: "Learning Streak",
      value: `${stats.learningStreakDays} ${streakUnit}`,
      description: "Consistent practice",
      icon: "streak",
    },
  ];
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(emptyDashboardStats);

  useEffect(() => {
    setStats(getDashboardStats());
  }, []);

  return useMemo(() => toDashboardStatCards(stats), [stats]);
}

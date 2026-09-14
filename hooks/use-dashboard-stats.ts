"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyDashboardStats } from "@/data/dashboard";
import {
  getTaskSummaries,
} from "@/lib/task-catalog";
import { loadTaskLearningState } from "@/hooks/use-task-learning-state";
import type { DashboardStat, DashboardStats } from "@/types/dashboard";
import type { ProgrammingTaskSummary } from "@/types/task";

function isQuestionBankTaskCompleted(task: ProgrammingTaskSummary) {
  try {
    const learningState = loadTaskLearningState(task.id);

    return (
      task.status === "completed" ||
      task.progress >= 100 ||
      learningState.progress >= 100 ||
      learningState.latestRunResult?.status === "success"
    );
  } catch {
    return task.status === "completed" || task.progress >= 100;
  }
}

export function getDashboardStats(): DashboardStats {
  const tasks = getTaskSummaries();
  const questionBankTasks = tasks.filter((task) => task.sourceType === "question_bank");

  const questionsTotal = questionBankTasks.length;
  const questionsCompleted = questionBankTasks.filter(
    (task) => task.status === "completed",
  ).length;

  return {
    questionsCompleted,
    questionsTotal,
    learningStreakDays: emptyDashboardStats.learningStreakDays,
  };
}

function toDashboardStatCards(stats: DashboardStats): DashboardStat[] {
  const streakUnit = stats.learningStreakDays === 1 ? "day" : "days";

  return [
    {
      id: "completed-tasks",
      title: "Completed Tasks",
      value: `${stats.questionsCompleted} / ${stats.questionsTotal}`,
      description: "Question bank progress",
      icon: "completed",
    },
    {
      id: "task-library",
      title: "Task Library",
      value: `${stats.questionsTotal} tasks`,
      description: "Ordered from Follow to Solve",
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

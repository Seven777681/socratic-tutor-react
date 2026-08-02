"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyDashboardStats } from "@/data/dashboard";
import { questionModules } from "@/data/question-modules";
import {
  getGeneratedTaskSummaries,
} from "@/lib/imported-tasks-storage";
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

function getCurrentModulePosition(questionBankTasks: ProgrammingTaskSummary[]) {
  const modules = [...questionModules].sort((first, second) => first.order - second.order);
  const totalModules = modules.length;

  if (totalModules === 0) {
    return { currentModulePosition: 0, totalModules };
  }

  try {
    const modulePosition = modules.findIndex((module) => {
      const moduleTasks = questionBankTasks.filter(
        (task) => task.moduleId === module.id,
      );

      return moduleTasks.some((task) => !isQuestionBankTaskCompleted(task));
    });

    return {
      currentModulePosition:
        modulePosition === -1 ? totalModules : modulePosition + 1,
      totalModules,
    };
  } catch {
    return { currentModulePosition: 1, totalModules };
  }
}

export function getDashboardStats(): DashboardStats {
  const tasks = getGeneratedTaskSummaries();
  const questionBankTasks = tasks.filter((task) => task.sourceType === "question_bank");
  const { currentModulePosition, totalModules } =
    getCurrentModulePosition(questionBankTasks);

  const questionsTotal = questionBankTasks.length;
  const questionsCompleted = questionBankTasks.filter(
    (task) => task.status === "completed",
  ).length;

  return {
    currentModulePosition,
    totalModules,
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
      id: "path-progress",
      title: "Path Progress",
      value: `${stats.currentModulePosition} / ${stats.totalModules}`,
      description: "Current module in your learning path",
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

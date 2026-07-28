"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyDashboardStats } from "@/data/dashboard";
import {
  getGeneratedTaskSummaries,
} from "@/lib/imported-tasks-storage";
import type { DashboardStat, DashboardStats } from "@/types/dashboard";

export function getDashboardStats(): DashboardStats {
  const tasks = getGeneratedTaskSummaries();
  const questionBankTasks = tasks.filter((task) => task.sourceType === "question_bank");

  const questionsTotal = questionBankTasks.length;
  const questionsCompleted = questionBankTasks.filter(
    (task) => task.status === "completed",
  ).length;
  const concepts = new Set(questionBankTasks.map((task) => task.concept));
  const practicedConcepts = new Set(
    questionBankTasks
      .filter((task) => task.status !== "not_started" || task.progress > 0)
      .map((task) => task.concept),
  );

  return {
    conceptsPracticed: practicedConcepts.size,
    conceptsTotal: concepts.size,
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
      id: "concepts-practiced",
      title: "Concepts Practiced",
      value: `${stats.conceptsPracticed} / ${stats.conceptsTotal}`,
      description: "Python concepts explored",
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

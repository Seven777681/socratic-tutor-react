export type TaskDifficulty = "easy" | "medium" | "hard";

export interface ContinueTask {
  id: string;
  title: string;
  topic: string;
  difficulty: TaskDifficulty;
  progress: number;
  lastStudied: string;
  description: string;
  href: string;
  sourceFileName?: string;
  sourceFileId?: string;
  sourceType?: "question_bank";
  concept?: string;
}

export interface DashboardStat {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: "completed" | "questions" | "streak";
}

export interface DashboardStats {
  questionsCompleted: number;
  questionsTotal: number;
  learningStreakDays: number;
}

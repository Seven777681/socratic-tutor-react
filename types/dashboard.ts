export type ModuleStatus =
  | "completed"
  | "in_progress"
  | "started"
  | "not_started";

export type ActivityAction = "completed" | "saved" | "ai_used" | "started";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type ModuleIcon =
  | "braces"
  | "gitBranch"
  | "refresh"
  | "sigma"
  | "list"
  | "upload";

export interface DashboardModule {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: ModuleStatus;
  href: string;
  icon: ModuleIcon;
}

export interface RecentActivity {
  id: string;
  taskTitle: string;
  action: ActivityAction;
  timestamp: string;
  href: string;
}

export interface ContinueTask {
  id: string;
  title: string;
  topic: string;
  difficulty: TaskDifficulty;
  progress: number;
  lastStudied: string;
  description: string;
  href: string;
}

export interface DashboardStat {
  id: string;
  title: string;
  value: string;
  progress?: number;
  icon: "progress" | "completed" | "streak";
}

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "locked";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type TaskTopic =
  | "variables"
  | "conditionals"
  | "loops"
  | "functions"
  | "lists";

export type TaskSort =
  | "recommended"
  | "difficulty_asc"
  | "difficulty_desc"
  | "progress"
  | "recently_updated";

export interface ProgrammingTaskSummary {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  topic: TaskTopic;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  progress: number;
  estimatedMinutes: number;
  updatedAt: string;
  href: string;
}

export interface TaskFilters {
  query: string;
  topic: TaskTopic | "all";
  difficulty: TaskDifficulty | "all";
  status: TaskStatus | "all";
  sort: TaskSort;
}

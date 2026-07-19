import type {
  TaskDifficulty,
  TaskStatus,
  TaskTopic,
} from "@/types/task";

export const topicLabels: Record<TaskTopic, string> = {
  variables: "Variables",
  conditionals: "Conditionals",
  loops: "Loops",
  functions: "Functions",
  lists: "Lists",
};

export const difficultyLabels: Record<TaskDifficulty, string> = {
  easy: "Foundational",
  medium: "Intermediate",
  hard: "Deep Dive",
};

export const thinkingDepthLabels = difficultyLabels;

export const statusLabels: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export const difficultyRank: Record<TaskDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

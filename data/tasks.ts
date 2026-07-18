import type { ProgrammingTaskSummary } from "@/types/task";

export const mockTasks: ProgrammingTaskSummary[] = [
  {
    id: "task-001",
    taskNumber: 1,
    title: "Variables and Input",
    description:
      "Learn how to store user input in variables and display formatted output.",
    topic: "variables",
    difficulty: "easy",
    status: "completed",
    progress: 100,
    estimatedMinutes: 15,
    updatedAt: "2026-07-01T11:40:00Z",
    href: "/tasks/task-001",
  },
  {
    id: "task-002",
    taskNumber: 2,
    title: "Grade Calculator",
    description:
      "Use conditional logic to convert numeric scores into clear letter grades.",
    topic: "conditionals",
    difficulty: "easy",
    status: "completed",
    progress: 100,
    estimatedMinutes: 20,
    updatedAt: "2026-07-02T14:15:00Z",
    href: "/tasks/task-002",
  },
  {
    id: "task-003",
    taskNumber: 3,
    title: "Loop and Sum",
    description:
      "Practice using loops to calculate the sum of a sequence of numbers.",
    topic: "loops",
    difficulty: "medium",
    status: "in_progress",
    progress: 60,
    estimatedMinutes: 25,
    updatedAt: "2026-07-04T08:00:00Z",
    href: "/tasks/task-003",
  },
];

import type {
  ContinueTask,
  DashboardStats,
  RecentUpload,
} from "@/types/dashboard";

export const mockDashboardStats: DashboardStats = {
  filesAnalysed: 3,
  questionsCompleted: 2,
  questionsTotal: 3,
  learningStreakDays: 5,
};

export const continueTask: ContinueTask = {
  id: "task-003",
  title: "Task 03: Loop and Sum",
  topic: "Loops",
  difficulty: "medium",
  progress: 60,
  lastStudied: "2 hours ago",
  description:
    "Practice using loops to calculate the sum of a sequence of numbers.",
  href: "/tasks/task-003",
  sourceFileName: "intro-loops-assignment.pdf",
  sourceFileId: "upload-001",
  sourceType: "imported",
};

export const mockRecentUploads: RecentUpload[] = [
  {
    id: "upload-001",
    fileName: "intro-loops-assignment.pdf",
    fileType: "pdf",
    language: "Python",
    generatedTaskCount: 3,
    completedTaskCount: 2,
    progress: 67,
    importedAt: "2 hours ago",
    continueTaskId: "task-003",
    sourceTaskIds: ["task-001", "task-002", "task-003"],
  },
  {
    id: "upload-002",
    fileName: "conditionals-practice.docx",
    fileType: "docx",
    language: "Python",
    generatedTaskCount: 2,
    completedTaskCount: 1,
    progress: 50,
    importedAt: "Yesterday",
    continueTaskId: "imported-task-002",
    sourceTaskIds: ["imported-task-001", "imported-task-002"],
  },
  {
    id: "upload-003",
    fileName: "variables-notes.md",
    fileType: "markdown",
    language: "Python",
    generatedTaskCount: 1,
    completedTaskCount: 1,
    progress: 100,
    importedAt: "July 18",
    continueTaskId: "task-001",
    sourceTaskIds: ["task-001"],
  },
];

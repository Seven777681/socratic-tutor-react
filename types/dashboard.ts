export type TaskDifficulty = "easy" | "medium" | "hard";

export type UploadFileType =
  | "pdf"
  | "docx"
  | "pptx"
  | "txt"
  | "markdown";

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
  sourceType?: "manual" | "imported";
}

export interface DashboardStat {
  id: string;
  title: string;
  value: string;
  description: string;
  icon: "files" | "questions" | "streak";
}

export interface DashboardStats {
  filesAnalysed: number;
  questionsCompleted: number;
  questionsTotal: number;
  learningStreakDays: number;
}

export interface RecentUpload {
  id: string;
  fileName: string;
  fileType: UploadFileType;
  language: "Python";
  generatedTaskCount: number;
  completedTaskCount: number;
  progress: number;
  importedAt: string;
  continueTaskId?: string;
  sourceTaskIds: string[];
}

import type { TaskDifficulty, TaskStatus, TaskTopic } from "@/types/task";

export type ImportedTaskSourceType =
  | "pdf"
  | "docx"
  | "pptx"
  | "txt"
  | "markdown";

export type ImportPipelineStatus =
  | "idle"
  | "file_selected"
  | "extracting"
  | "generating"
  | "ready"
  | "imported"
  | "error";

export interface ImportedAssignmentFile {
  id: string;
  name: string;
  type: ImportedTaskSourceType;
  size: number;
  uploadedAt: string;
}

export interface ExtractedConcept {
  id: string;
  name: string;
  confidence?: number;
  sourceNote?: string;
}

export interface GeneratedPracticeTask {
  id: string;
  sourceFileId: string;
  title: string;
  topic: TaskTopic;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  progress: number;
  estimatedMinutes: number;
  description: string;
  problemDescription: string[];
  learningObjectives: string[];
  inputDescription: string;
  outputDescription: string;
  examples: {
    id: string;
    input: string;
    output: string;
  }[];
  constraints: string[];
  starterCode: string;
  language: "python";
  imported: true;
  createdAt: string;
}

export interface ImportHistoryEntry {
  id: string;
  file: ImportedAssignmentFile;
  importedAt: string;
  taskCount: number;
  taskIds: string[];
}

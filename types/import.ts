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
  | "detecting_concepts"
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
  topic: TaskTopic;
  confidence: number;
  sourceNote: string;
  matchedKeywords: string[];
}

export interface GeneratedPracticeTask {
  id: string;
  taskNumber: number;
  sourceFileId: string;
  sourceFileName: string;
  sourceFileType: ImportedTaskSourceType;
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
  helpfulReminder: string;
  starterCode: string;
  language: "python";
  imported: true;
  createdAt: string;
  updatedAt: string;
  href: string;
}

export interface AssignmentAnalysisResponse {
  assignmentFile: ImportedAssignmentFile;
  extractedText: string;
  textPreview: string;
  detectedConcepts: ExtractedConcept[];
  generatedTasks: GeneratedPracticeTask[];
  warnings?: string[];
}

export interface ImportHistoryEntry {
  id: string;
  file: ImportedAssignmentFile;
  importedAt: string;
  taskCount: number;
  taskIds: string[];
}

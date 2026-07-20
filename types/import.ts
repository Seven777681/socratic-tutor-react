import type { TaskDifficulty, TaskStatus, TaskTopic } from "@/types/task";

export type ThinkingDepth = "foundational" | "intermediate" | "deep_dive";

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

export interface ExtractedQuestion {
  id: string;
  questionNumber: number;
  title: string;
  rawText: string;
  problemStatement: string;
  inputDescription?: string;
  outputDescription?: string;
  examples: {
    id: string;
    input: string;
    output: string;
    explanation?: string;
  }[];
  requirements: string[];
  detectedTopic: TaskTopic;
  thinkingDepth: ThinkingDepth;
  confidence: number;
  sourceSnippet: string;
  selected?: boolean;
}

export interface GeneratedPracticeTask {
  id: string;
  taskNumber: number;
  sourceFileId: string;
  sourceFileName: string;
  sourceFileType: ImportedTaskSourceType;
  sourceQuestionId?: string;
  sourceQuestionLabel?: string;
  sourceQuestionSnippet?: string;
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
  extractedQuestions: ExtractedQuestion[];
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

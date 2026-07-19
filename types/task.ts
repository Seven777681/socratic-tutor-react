export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type TaskTopic =
  | "variables"
  | "conditionals"
  | "loops"
  | "functions"
  | "lists"
  | "strings";

export type TaskSort =
  | "recommended"
  | "newest"
  | "source_file"
  | "thinking_progress"
  | "recently_updated";

export type TaskViewMode = "cards" | "by-file";

export interface ProgrammingTaskSummary {
  id: string;
  taskNumber: number;
  title: string;
  description: string;
  sourceFileId: string;
  sourceFileName: string;
  sourceFileType?: "pdf" | "docx" | "pptx" | "txt" | "markdown";
  language: "Python";
  topic: TaskTopic;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  progress: number;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  href: string;
  imported?: boolean;
}

export interface TaskFilters {
  query: string;
  source: string | "all";
  topic: TaskTopic | "all";
  depth: TaskDifficulty | "all";
  status: TaskStatus | "all";
  sort: TaskSort;
  view: TaskViewMode;
}

export interface TaskExample {
  id: string;
  input: string;
  output: string;
}

export interface ProgrammingTaskDetail {
  id: string;
  taskNumber: number;
  title: string;
  description: string[];
  topic: TaskTopic;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  estimatedMinutes: number;
  progress: number;
  language: "python";
  learningObjectives: string[];
  inputDescription: string;
  outputDescription: string;
  examples: TaskExample[];
  constraints: string[];
  helpfulReminder?: string;
  starterCode: string;
  codeRuns: number;
  tutorInteractions: number;
  lastSaved: string;
}

export type SaveStatus = "saved" | "saving" | "unsaved";

export interface CodeEditorState {
  taskId: string;
  currentCode: string;
  savedCode: string;
  saveStatus: SaveStatus;
}

export interface EditorPreferences {
  fontSize: 14 | 16 | 18;
  wordWrap: boolean;
  minimapEnabled: boolean;
}

export interface CodeEditorPanelProps {
  taskId: string;
  starterCode: string;
  language: "python";
  onRun?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  onRunResultChange?: (result: import("@/types/code-run").CodeRunResult) => void;
}

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
  imported?: boolean;
}

export interface TaskFilters {
  query: string;
  topic: TaskTopic | "all";
  difficulty: TaskDifficulty | "all";
  status: TaskStatus | "all";
  sort: TaskSort;
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

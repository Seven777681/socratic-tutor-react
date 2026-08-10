export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type AgentType =
  | "socratic_guide"
  | "strategy_coach"
  | "debug_coach"
  | "test_coach"
  | "reflection_coach";

export type TaskConcept =
  | "variables"
  | "conditionals"
  | "loops"
  | "functions"
  | "lists"
  | "strings";

export type TaskSourceType = "question_bank" | "custom_imported";

export type QuestionBankModuleId =
  | "syntax_basics"
  | "simple_logic"
  | "data_structures"
  | "function_design"
  | "integrated_challenges";

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
  | "concept"
  | "thinking_progress"
  | "recently_updated";

export type TaskViewMode = "learning_path" | "all_questions";

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
  sourceType: TaskSourceType;
  moduleId?: QuestionBankModuleId;
  moduleTitle?: string;
  order?: number;
  recommendedAgent: AgentType;
  concept: TaskConcept;
  thinkingDepth: TaskDifficulty;
  questionSetId?: string;
  questionSetTitle?: string;
  createdAt: string;
  updatedAt: string;
  href: string;
  imported?: boolean;
}

export interface TaskFilters {
  query: string;
  source: string | "all";
  taskSource: TaskSourceType | "all";
  module: QuestionBankModuleId | "all";
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

export interface TaskTestCase extends TaskExample {
  name: string;
  visibility: "public" | "hidden";
  misconceptionTag?: string;
}

export interface TaskPedagogy {
  primaryConcept: string;
  secondaryConcepts: string[];
  prerequisites: string[];
  commonMisconceptions: string[];
  expectedPlanElements: string[];
  reflectionPrompts: string[];
}

export interface ProgrammingTaskDetail {
  id: string;
  taskNumber: number;
  title: string;
  sourceFileId: string;
  sourceFileName: string;
  sourceFileType?: "pdf" | "docx" | "pptx" | "txt" | "markdown";
  description: string[];
  topic: TaskTopic;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  estimatedMinutes: number;
  sourceType: TaskSourceType;
  moduleId?: QuestionBankModuleId;
  moduleTitle?: string;
  order?: number;
  recommendedAgent: AgentType;
  concept: TaskConcept;
  thinkingDepth: TaskDifficulty;
  questionSetId?: string;
  questionSetTitle?: string;
  progress: number;
  language: "python";
  learningObjectives: string[];
  inputDescription: string;
  outputDescription: string;
  examples: TaskExample[];
  testCases?: TaskTestCase[];
  pedagogy?: TaskPedagogy;
  constraints: string[];
  helpfulReminder?: string;
  starterCode: string;
  codeRuns: number;
  tutorInteractions: number;
  lastSaved: string;
  href: string;
  createdAt: string;
  updatedAt: string;
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
  task: ProgrammingTaskDetail;
  taskId: string;
  starterCode: string;
  language: "python";
  onRun?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  onRunResultChange?: (result: import("@/types/code-run").CodeRunResult) => void;
  planInteraction?: import("@/types/tutor").TutorPlanInteraction;
  onReviewPlanInTutor?: (
    context: import("@/types/tutor").TutorLearningContext,
  ) => void;
  onLearningContextChange?: (
    context: import("@/types/tutor").TutorLearningContext,
  ) => void;
}

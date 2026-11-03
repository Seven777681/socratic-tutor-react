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

export type TaskSourceType = "question_bank";

export type QuestionBankModuleId =
  | "syntax_basics"
  | "simple_logic"
  | "data_structures"
  | "function_design"
  | "integrated_challenges";

export type PlanningRequirement = "not_required" | "optional" | "required";

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
  planningRequirement?: PlanningRequirement;
  createdAt: string;
  updatedAt: string;
  href: string;
  imported?: boolean;
}

export interface TaskFilters {
  query: string;
  topic: TaskTopic | "all";
  depth: TaskDifficulty | "all";
  status: TaskStatus | "all";
  sort: TaskSort;
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
  planningRequirement?: PlanningRequirement;
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
export type TaskEntryPath = "undecided" | "understand" | "plan" | "code";
export type TaskPlanningMode = "direct" | "optional" | "short" | "required";

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
  aiTutorEnabled?: boolean;
  planningMode?: TaskPlanningMode;
  onRun?: (code: string) => void;
  onCodeChange?: (code: string) => void;
  onRunResultChange?: (result: import("@/types/code-run").CodeRunResult | undefined) => void;
  planInteraction?: import("@/types/tutor").TutorPlanInteraction;
  onReviewPlanInTutor?: (
    context: import("@/types/tutor").TutorLearningContext,
  ) => void;
  onLearningContextChange?: (
    context: import("@/types/tutor").TutorLearningContext,
  ) => void;
  nextTask?: {
    href: string;
    title: string;
  };
  entryPath: TaskEntryPath;
  onEntryPathChange: (path: Exclude<TaskEntryPath, "undecided">) => void;
}

import type { QuestionBankModuleId } from "@/types/task";

export interface QuestionModule {
  id: QuestionBankModuleId;
  title: string;
  subtitle: string;
  description: string;
  order: number;
  difficultyRange: string;
}

export const questionModules: QuestionModule[] = [
  {
    id: "syntax_basics",
    title: "Syntax Basics",
    subtitle: "Syntax Basics",
    description: "Start with input, variables, strings, and basic expressions.",
    order: 1,
    difficultyRange: "Foundational",
  },
  {
    id: "simple_logic",
    title: "Simple Logic",
    subtitle: "Simple Logic",
    description: "Practice conditions, comparisons, loops, and careful tracing.",
    order: 2,
    difficultyRange: "Foundational - Intermediate",
  },
  {
    id: "data_structures",
    title: "Data Structures",
    subtitle: "Data Structures",
    description: "Work with lists, strings, dictionaries, and aggregate values.",
    order: 3,
    difficultyRange: "Intermediate",
  },
  {
    id: "function_design",
    title: "Function Design",
    subtitle: "Function Design",
    description: "Break programs into reusable functions with clear inputs and outputs.",
    order: 4,
    difficultyRange: "Intermediate - Deep Dive",
  },
  {
    id: "integrated_challenges",
    title: "Integrated Challenges",
    subtitle: "Integrated Challenges",
    description: "Combine logic, data structures, functions, and debugging.",
    order: 5,
    difficultyRange: "Deep Dive",
  },
];

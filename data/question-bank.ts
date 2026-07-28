import type {
  AgentType,
  ProgrammingTaskDetail,
  QuestionBankModuleId,
  TaskDifficulty,
  TaskTopic,
} from "@/types/task";

export interface QuestionBankModule {
  id: QuestionBankModuleId;
  title: string;
  description: string;
  order: number;
  difficultyRange: string;
  recommendedAgent: AgentType;
}

export const questionBankModules: QuestionBankModule[] = [
  {
    id: "syntax_basics",
    title: "Syntax Basics",
    description: "Start with input, variables, strings, and basic expressions.",
    order: 1,
    difficultyRange: "Foundational",
    recommendedAgent: "socratic_guide",
  },
  {
    id: "simple_logic",
    title: "Simple Logic",
    description: "Practice conditions, comparisons, loops, and careful tracing.",
    order: 2,
    difficultyRange: "Foundational - Intermediate",
    recommendedAgent: "strategy_coach",
  },
  {
    id: "data_structures",
    title: "Data Structures",
    description: "Work with lists, strings, dictionaries, and aggregate values.",
    order: 3,
    difficultyRange: "Intermediate",
    recommendedAgent: "test_coach",
  },
  {
    id: "function_design",
    title: "Function Design",
    description: "Break programs into reusable functions with clear inputs and outputs.",
    order: 4,
    difficultyRange: "Intermediate - Deep Dive",
    recommendedAgent: "socratic_guide",
  },
  {
    id: "integrated_challenges",
    title: "Integrated Challenges",
    description: "Combine logic, data structures, functions, and debugging.",
    order: 5,
    difficultyRange: "Deep Dive",
    recommendedAgent: "debug_coach",
  },
];

interface TaskSeed {
  id: string;
  moduleId: QuestionBankModuleId;
  order: number;
  title: string;
  description: string;
  topic: TaskTopic;
  difficulty: TaskDifficulty;
  recommendedAgent: AgentType;
  estimatedMinutes: number;
  problemDescription: string[];
  learningObjectives: string[];
  inputDescription: string;
  outputDescription: string;
  examples: Array<{ id: string; input: string; output: string }>;
  constraints: string[];
  starterCode: string;
}

const seeds: TaskSeed[] = [
  {
    id: "qb-variables-input",
    moduleId: "syntax_basics",
    order: 1,
    title: "Variables and Input",
    description: "Use variables to store user input and print a formatted message.",
    topic: "variables",
    difficulty: "easy",
    recommendedAgent: "socratic_guide",
    estimatedMinutes: 15,
    problemDescription: ["Ask for a user's name and age, then print a friendly greeting."],
    learningObjectives: ["Store values in variables", "Convert input to integers", "Format strings"],
    inputDescription: "A name followed by an age.",
    outputDescription: "A greeting with the name and age.",
    examples: [{ id: "example-1", input: "Alex\n16", output: "Hello Alex! You are 16 years old." }],
    constraints: ["Name is not empty", "Age is a positive integer"],
    starterCode: 'name = input("Enter your name: ")\nage = int(input("Enter your age: "))\n\n# TODO: Print a greeting\n',
  },
  {
    id: "qb-number-converter",
    moduleId: "syntax_basics",
    order: 2,
    title: "Number Converter",
    description: "Convert text input into numbers and calculate a simple result.",
    topic: "variables",
    difficulty: "easy",
    recommendedAgent: "socratic_guide",
    estimatedMinutes: 15,
    problemDescription: ["Read two numbers and print their sum and product."],
    learningObjectives: ["Convert strings to numbers", "Use arithmetic operators", "Print multiple results"],
    inputDescription: "Two integers on one line.",
    outputDescription: "The sum and product.",
    examples: [{ id: "example-1", input: "3 4", output: "Sum: 7\nProduct: 12" }],
    constraints: ["Inputs are integers"],
    starterCode: 'a, b = [int(value) for value in input().split()]\n\n# TODO: Print sum and product\n',
  },
  {
    id: "qb-string-formatter",
    moduleId: "syntax_basics",
    order: 3,
    title: "String Formatter",
    description: "Clean and format text input into a consistent message.",
    topic: "strings",
    difficulty: "easy",
    recommendedAgent: "reflection_coach",
    estimatedMinutes: 20,
    problemDescription: ["Trim extra spaces and title-case a short phrase."],
    learningObjectives: ["Use string methods", "Format output", "Reason about whitespace"],
    inputDescription: "A line of text.",
    outputDescription: "A cleaned title-cased string.",
    examples: [{ id: "example-1", input: "  hello python  ", output: "Hello Python" }],
    constraints: ["Preserve word order"],
    starterCode: 'text = input("Enter text: ")\n\n# TODO: Clean and format text\n',
  },
  {
    id: "qb-grade-calculator",
    moduleId: "simple_logic",
    order: 1,
    title: "Grade Calculator",
    description: "Convert a numeric score into a letter grade using conditions.",
    topic: "conditionals",
    difficulty: "easy",
    recommendedAgent: "strategy_coach",
    estimatedMinutes: 20,
    problemDescription: ["Use if/elif/else to classify a score from 0 to 100."],
    learningObjectives: ["Write conditionals", "Handle boundaries", "Order branches correctly"],
    inputDescription: "An integer score.",
    outputDescription: "A letter grade.",
    examples: [{ id: "example-1", input: "85", output: "B" }],
    constraints: ["0 <= score <= 100"],
    starterCode: 'score = int(input("Enter a score: "))\n\n# TODO: Print the letter grade\n',
  },
  {
    id: "qb-even-odd-counter",
    moduleId: "simple_logic",
    order: 2,
    title: "Even Odd Counter",
    description: "Classify numbers with modulo logic and count each group.",
    topic: "conditionals",
    difficulty: "medium",
    recommendedAgent: "test_coach",
    estimatedMinutes: 25,
    problemDescription: ["Count how many input numbers are even and how many are odd."],
    learningObjectives: ["Use modulo", "Update counters", "Check simple edge cases"],
    inputDescription: "A space-separated list of integers.",
    outputDescription: "Even and odd counts.",
    examples: [{ id: "example-1", input: "1 2 3 4", output: "Even: 2\nOdd: 2" }],
    constraints: ["At least one integer is provided"],
    starterCode: 'numbers = [int(value) for value in input().split()]\n\n# TODO: Count even and odd numbers\n',
  },
  {
    id: "qb-loop-sum",
    moduleId: "simple_logic",
    order: 3,
    title: "Loop and Sum",
    description: "Use a loop and accumulator to calculate the sum from 1 to n.",
    topic: "loops",
    difficulty: "medium",
    recommendedAgent: "debug_coach",
    estimatedMinutes: 25,
    problemDescription: ["Calculate the sum of all integers from 1 to n with a loop."],
    learningObjectives: ["Use a loop", "Update an accumulator", "Trace loop state"],
    inputDescription: "A positive integer n.",
    outputDescription: "The sum from 1 to n.",
    examples: [{ id: "example-1", input: "5", output: "15" }],
    constraints: ["Use a loop rather than sum(range(...))"],
    starterCode: 'n = int(input("Enter n: "))\ntotal = 0\n\n# TODO: Add numbers from 1 to n\n\nprint(total)\n',
  },
  {
    id: "qb-find-maximum",
    moduleId: "data_structures",
    order: 1,
    title: "Find the Maximum",
    description: "Scan a list of numbers and keep track of the largest value.",
    topic: "lists",
    difficulty: "medium",
    recommendedAgent: "strategy_coach",
    estimatedMinutes: 25,
    problemDescription: ["Find the largest value in a list without using max()."],
    learningObjectives: ["Iterate through a list", "Maintain a running maximum", "Handle negatives"],
    inputDescription: "A space-separated list of integers.",
    outputDescription: "The maximum integer.",
    examples: [{ id: "example-1", input: "3 9 2 7", output: "9" }],
    constraints: ["At least one integer", "Do not use max()"],
    starterCode: 'numbers = [int(value) for value in input().split()]\n\n# TODO: Find the maximum without max()\n',
  },
  {
    id: "qb-list-statistics",
    moduleId: "data_structures",
    order: 2,
    title: "List Statistics",
    description: "Calculate count, total, and average for a list of numbers.",
    topic: "lists",
    difficulty: "medium",
    recommendedAgent: "test_coach",
    estimatedMinutes: 30,
    problemDescription: ["Print count, total, and average for input numbers."],
    learningObjectives: ["Aggregate list values", "Format decimals", "Avoid off-by-one mistakes"],
    inputDescription: "A space-separated list of numbers.",
    outputDescription: "Count, total, and average.",
    examples: [{ id: "example-1", input: "2 4 6", output: "Count: 3\nTotal: 12\nAverage: 4.0" }],
    constraints: ["At least one number"],
    starterCode: 'numbers = [float(value) for value in input().split()]\n\n# TODO: Print count, total, and average\n',
  },
  {
    id: "qb-word-frequency",
    moduleId: "data_structures",
    order: 3,
    title: "Word Frequency",
    description: "Use a dictionary to count repeated words.",
    topic: "strings",
    difficulty: "hard",
    recommendedAgent: "debug_coach",
    estimatedMinutes: 35,
    problemDescription: ["Count how many times each word appears in a sentence."],
    learningObjectives: ["Use dictionaries", "Normalize strings", "Update counts"],
    inputDescription: "A sentence.",
    outputDescription: "Each word and its count.",
    examples: [{ id: "example-1", input: "red blue red", output: "red: 2\nblue: 1" }],
    constraints: ["Ignore extra spaces", "Output words in first-seen order"],
    starterCode: 'words = input("Enter words: ").split()\n\n# TODO: Count word frequency\n',
  },
  {
    id: "qb-function-practice",
    moduleId: "function_design",
    order: 1,
    title: "Function Practice",
    description: "Write and call a function that returns a reusable result.",
    topic: "functions",
    difficulty: "medium",
    recommendedAgent: "socratic_guide",
    estimatedMinutes: 30,
    problemDescription: ["Create a function that calculates a result from two inputs."],
    learningObjectives: ["Define a function", "Return a value", "Separate logic from I/O"],
    inputDescription: "Two integers.",
    outputDescription: "The returned result.",
    examples: [{ id: "example-1", input: "4 5", output: "18" }],
    constraints: ["The function must return, not print"],
    starterCode: 'def calculate(a, b):\n    # TODO: Return a result\n    pass\n\na, b = [int(value) for value in input().split()]\nprint(calculate(a, b))\n',
  },
  {
    id: "qb-validator-function",
    moduleId: "function_design",
    order: 2,
    title: "Validator Function",
    description: "Encapsulate validation rules in a clear Boolean function.",
    topic: "functions",
    difficulty: "medium",
    recommendedAgent: "test_coach",
    estimatedMinutes: 30,
    problemDescription: ["Write a function that checks whether a password meets simple rules."],
    learningObjectives: ["Return Boolean values", "Combine conditions", "Test edge cases"],
    inputDescription: "A password string.",
    outputDescription: "Valid or Invalid.",
    examples: [{ id: "example-1", input: "abc123", output: "Valid" }],
    constraints: ["At least 6 characters", "Contains at least one digit"],
    starterCode: 'def is_valid_password(password):\n    # TODO: Return True or False\n    pass\n\npassword = input("Password: ")\nprint("Valid" if is_valid_password(password) else "Invalid")\n',
  },
  {
    id: "qb-refactor-repeated-logic",
    moduleId: "function_design",
    order: 3,
    title: "Refactor Repeated Logic",
    description: "Turn repeated code into a reusable helper function.",
    topic: "functions",
    difficulty: "hard",
    recommendedAgent: "reflection_coach",
    estimatedMinutes: 35,
    problemDescription: ["Create a helper function that formats multiple student records."],
    learningObjectives: ["Identify repetition", "Design a helper function", "Return formatted strings"],
    inputDescription: "Three names and scores.",
    outputDescription: "Formatted report lines.",
    examples: [{ id: "example-1", input: "Ana 90\nBo 75\nCy 88", output: "Ana: 90\nBo: 75\nCy: 88" }],
    constraints: ["Use a function for formatting one record"],
    starterCode: 'def format_record(name, score):\n    # TODO: Return formatted record\n    pass\n\nfor _ in range(3):\n    name, score = input().split()\n    print(format_record(name, score))\n',
  },
  {
    id: "qb-multiplication-table",
    moduleId: "integrated_challenges",
    order: 1,
    title: "Multiplication Table",
    description: "Generate a table using nested loop thinking.",
    topic: "loops",
    difficulty: "medium",
    recommendedAgent: "test_coach",
    estimatedMinutes: 30,
    problemDescription: ["Print an n by n multiplication table."],
    learningObjectives: ["Use nested loops", "Format rows", "Check table boundaries"],
    inputDescription: "A positive integer n.",
    outputDescription: "An n by n table.",
    examples: [{ id: "example-1", input: "3", output: "1 2 3\n2 4 6\n3 6 9" }],
    constraints: ["1 <= n <= 12"],
    starterCode: 'n = int(input("Enter table size: "))\n\n# TODO: Print an n by n multiplication table\n',
  },
  {
    id: "qb-mini-gradebook",
    moduleId: "integrated_challenges",
    order: 2,
    title: "Mini Gradebook",
    description: "Combine lists, loops, and functions to summarize grades.",
    topic: "lists",
    difficulty: "hard",
    recommendedAgent: "strategy_coach",
    estimatedMinutes: 40,
    problemDescription: ["Read student scores and print the class average and top score."],
    learningObjectives: ["Parse structured input", "Use helper functions", "Summarize data"],
    inputDescription: "Rows of name and score.",
    outputDescription: "Average score and top student.",
    examples: [{ id: "example-1", input: "Ana 90\nBo 75\nCy 88", output: "Average: 84.3\nTop: Ana" }],
    constraints: ["Exactly three rows", "Average shows one decimal"],
    starterCode: 'records = []\nfor _ in range(3):\n    name, score = input().split()\n    records.append((name, int(score)))\n\n# TODO: Print average and top student\n',
  },
  {
    id: "qb-debug-checkout",
    moduleId: "integrated_challenges",
    order: 3,
    title: "Debug Checkout",
    description: "Reason through a small checkout program and fix edge cases.",
    topic: "conditionals",
    difficulty: "hard",
    recommendedAgent: "debug_coach",
    estimatedMinutes: 40,
    problemDescription: ["Calculate a checkout total with discounts and tax."],
    learningObjectives: ["Combine arithmetic and conditions", "Debug edge cases", "Test expected totals"],
    inputDescription: "Subtotal as a decimal number.",
    outputDescription: "Final total after discount and tax.",
    examples: [{ id: "example-1", input: "120", output: "102.60" }],
    constraints: ["10% discount if subtotal >= 100", "Then add 5% tax", "Print two decimals"],
    starterCode: 'subtotal = float(input("Subtotal: "))\n\n# TODO: Apply discount, tax, and print final total\n',
  },
];

function moduleFor(id: QuestionBankModuleId) {
  const module = questionBankModules.find((candidate) => candidate.id === id);

  if (!module) {
    throw new Error(`Question bank module ${id} is required.`);
  }

  return module;
}

export const questionBankTasks: ProgrammingTaskDetail[] = seeds.map((seed, index) => {
  const module = moduleFor(seed.moduleId);

  return {
    id: seed.id,
    taskNumber: index + 1,
    moduleId: module.id,
    moduleTitle: module.title,
    order: seed.order,
    title: seed.title,
    description: seed.problemDescription,
    sourceFileId: module.id,
    sourceFileName: module.title,
    language: "python",
    topic: seed.topic,
    concept: seed.topic,
    difficulty: seed.difficulty,
    thinkingDepth: seed.difficulty,
    status: seed.id === "qb-loop-sum" ? "in_progress" : "not_started",
    progress: seed.id === "qb-loop-sum" ? 60 : 0,
    estimatedMinutes: seed.estimatedMinutes,
    sourceType: "question_bank",
    recommendedAgent: seed.recommendedAgent,
    questionSetId: module.id,
    questionSetTitle: module.title,
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: seed.id === "qb-loop-sum" ? "2026-07-02T00:00:00Z" : "2026-07-01T00:00:00Z",
    href: `/tasks/${seed.id}`,
    learningObjectives: seed.learningObjectives,
    inputDescription: seed.inputDescription,
    outputDescription: seed.outputDescription,
    examples: seed.examples,
    constraints: seed.constraints,
    starterCode: seed.starterCode,
    codeRuns: 0,
    tutorInteractions: 0,
    lastSaved: "Question Bank",
  };
});

export function getQuestionBankSummaries() {
  return questionBankTasks.map(({ description, ...task }) => ({
    ...task,
    description: description[0],
    language: "Python" as const,
  }));
}

export function getQuestionBankTaskById(taskId: string) {
  return questionBankTasks.find((task) => task.id === taskId);
}

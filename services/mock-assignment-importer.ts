import type {
  ExtractedConcept,
  GeneratedPracticeTask,
  ImportedAssignmentFile,
} from "@/types/import";
import type { TaskTopic } from "@/types/task";

const topicNames: Record<TaskTopic, string> = {
  variables: "Variables",
  conditionals: "Conditional Statements",
  loops: "Loops",
  functions: "Functions",
  lists: "Lists",
};

const topicEntries = Object.entries(topicNames) as [TaskTopic, string][];

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function detectTopics(rawText?: string): TaskTopic[] {
  const text = rawText?.toLowerCase() ?? "";
  const topics: TaskTopic[] = [];

  if (/\b(loop|loops|for|while|sum|accumulator)\b/.test(text)) {
    topics.push("loops");
  }

  if (/\b(if|else|elif|condition|conditional|grade)\b/.test(text)) {
    topics.push("conditionals");
  }

  if (/\b(variable|variables|input|print)\b/.test(text)) {
    topics.push("variables");
  }

  if (/\b(function|functions|def|return)\b/.test(text)) {
    topics.push("functions");
  }

  return topics.length ? topics.slice(0, 3) : ["variables", "conditionals", "loops"];
}

export async function mockExtractConcepts(
  file: ImportedAssignmentFile,
  rawText?: string,
): Promise<ExtractedConcept[]> {
  await delay(800);

  return detectTopics(rawText).map((topic, index) => ({
    id: `concept-${file.id}-${index + 1}`,
    name: topicNames[topic],
    confidence: rawText ? 0.82 + index * 0.04 : 0.72,
    sourceNote: rawText
      ? "Detected from assignment text"
      : "Detected from file name and prototype mock rules",
  }));
}

function createTask(
  topic: TaskTopic,
  file: ImportedAssignmentFile,
  index: number,
): GeneratedPracticeTask {
  const createdAt = new Date().toISOString();
  const id = `generated-${file.id}-${index + 1}`;

  if (topic === "conditionals") {
    return {
      id,
      sourceFileId: file.id,
      title: "Conditional Grade Checker",
      topic,
      difficulty: "easy",
      status: "not_started",
      progress: 0,
      estimatedMinutes: 20,
      description: "Use conditional statements to classify numeric scores.",
      problemDescription: [
        "Write a Python program that reads a numeric score.",
        "Use conditions to decide which category the score belongs to.",
      ],
      learningObjectives: ["Compare numeric values", "Order if and elif branches", "Explain boundary cases"],
      inputDescription: "One integer score.",
      outputDescription: "A short category or letter grade.",
      examples: [{ id: `${id}-example-1`, input: "85", output: "B" }],
      constraints: ["0 <= score <= 100", "Use explicit conditional branches"],
      starterCode: 'score = int(input("Enter a score: "))\n\n# TODO: Decide which grade range matches score\n\nprint("grade goes here")\n',
      language: "python",
      imported: true,
      createdAt,
    };
  }

  if (topic === "loops") {
    return {
      id,
      sourceFileId: file.id,
      title: "Loop-Based Sum Calculator",
      topic,
      difficulty: "medium",
      status: "not_started",
      progress: 0,
      estimatedMinutes: 25,
      description: "Use a loop and an accumulator variable to calculate a total.",
      problemDescription: [
        "Write a Python program that reads a positive integer n.",
        "Use a loop to build the total step by step, then print the result.",
      ],
      learningObjectives: ["Initialize an accumulator", "Update a value inside a loop", "Trace loop state by hand"],
      inputDescription: "A positive integer n.",
      outputDescription: "The calculated total.",
      examples: [{ id: `${id}-example-1`, input: "5", output: "15" }],
      constraints: ["1 <= n <= 10000", "Use a loop rather than a built-in sum call"],
      starterCode: 'n = int(input("Enter a positive integer: "))\n\ntotal = 0\n\n# TODO: Use a loop to update total\n\nprint(total)\n',
      language: "python",
      imported: true,
      createdAt,
    };
  }

  if (topic === "functions") {
    return {
      id,
      sourceFileId: file.id,
      title: "Function Design Practice",
      topic,
      difficulty: "medium",
      status: "not_started",
      progress: 0,
      estimatedMinutes: 25,
      description: "Break a small calculation into a reusable Python function.",
      problemDescription: ["Write a helper function, then call it with input values."],
      learningObjectives: ["Define a function", "Use parameters", "Return a computed value"],
      inputDescription: "One or more values needed by the helper function.",
      outputDescription: "The value returned by the helper function.",
      examples: [{ id: `${id}-example-1`, input: "4", output: "8" }],
      constraints: ["Use def", "Keep input and output separate from the function body"],
      starterCode: "def solve(value):\n    # TODO: Return the transformed value\n    return value\n\nvalue = int(input())\nprint(solve(value))\n",
      language: "python",
      imported: true,
      createdAt,
    };
  }

  return {
    id,
    sourceFileId: file.id,
    title: "Variables and Input Practice",
    topic: "variables",
    difficulty: "easy",
    status: "not_started",
    progress: 0,
    estimatedMinutes: 15,
    description: "Practice reading user input and storing values in variables.",
    problemDescription: [
      "Write a Python program that asks for basic input values.",
      "Store the inputs in variables and print a clear result.",
    ],
    learningObjectives: ["Store input in variables", "Convert text when needed", "Print formatted output"],
    inputDescription: "Short text or numeric values.",
    outputDescription: "A formatted message using the entered values.",
    examples: [{ id: `${id}-example-1`, input: "Alex", output: "Hello Alex" }],
    constraints: ["Use named variables", "Do not hard-code the example output"],
    starterCode: 'name = input("Enter a name: ")\n\n# TODO: Store any other values you need\n\nprint("message goes here")\n',
    language: "python",
    imported: true,
    createdAt,
  };
}

export async function mockGenerateTasks(params: {
  file: ImportedAssignmentFile;
  concepts: ExtractedConcept[];
  rawText?: string;
}): Promise<GeneratedPracticeTask[]> {
  await delay(1000);

  const topicsFromConcepts = params.concepts
    .map((concept) =>
      topicEntries.find(([, label]) => label === concept.name)?.[0],
    )
    .filter((topic): topic is TaskTopic => Boolean(topic));
  const topics = Array.from(new Set(topicsFromConcepts.length ? topicsFromConcepts : detectTopics(params.rawText)));

  return topics.slice(0, 3).map((topic, index) => createTask(topic, params.file, index));
}

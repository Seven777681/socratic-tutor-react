import type {
  ExtractedConcept,
  GeneratedPracticeTask,
  ImportedAssignmentFile,
} from "@/types/import";
import type { TaskDifficulty, TaskTopic } from "@/types/task";

interface TaskSeed {
  titlePhrase: string;
  contextPhrase: string;
  inputHint: string;
  outputHint: string;
}

const topicDefaults: Record<TaskTopic, TaskSeed> = {
  variables: {
    titlePhrase: "Input and Output",
    contextPhrase: "collect and format values",
    inputHint: "One or more short values.",
    outputHint: "A clear message using the stored values.",
  },
  conditionals: {
    titlePhrase: "Classification Program",
    contextPhrase: "make a decision from input values",
    inputHint: "A numeric or text value to classify.",
    outputHint: "The selected category or decision.",
  },
  loops: {
    titlePhrase: "Repeated Calculation",
    contextPhrase: "repeat a calculation step by step",
    inputHint: "A count or sequence of values.",
    outputHint: "The final accumulated result.",
  },
  functions: {
    titlePhrase: "Reusable Function",
    contextPhrase: "organize logic into a reusable function",
    inputHint: "Function arguments or input values.",
    outputHint: "The value returned or printed by the function.",
  },
  lists: {
    titlePhrase: "List Processing",
    contextPhrase: "process several values in a sequence",
    inputHint: "A list or repeated values.",
    outputHint: "A summary such as maximum, minimum, count, or transformed list.",
  },
  strings: {
    titlePhrase: "Text Processing",
    contextPhrase: "inspect and transform text",
    inputHint: "A text string.",
    outputHint: "A transformed or analyzed text result.",
  },
};

const starterCodeByTopic: Record<TaskTopic, string> = {
  variables: 'value = input("Enter a value: ")\n\n# TODO: Store and format the value\n\nprint(value)\n',
  conditionals: 'score = int(input("Enter a score: "))\n\n# TODO: Use conditions to decide the result\n\nprint("Result")\n',
  loops: 'n = int(input("Enter a number: "))\n\ntotal = 0\n\n# TODO: Use a loop to update total\n\nprint(total)\n',
  functions: "def solve():\n    # TODO: Write your function logic\n    pass\n\nsolve()\n",
  lists: 'values = input("Enter values separated by spaces: ").split()\n\n# TODO: Process the list values\n\nprint(values)\n',
  strings: 'text = input("Enter text: ")\n\n# TODO: Inspect or transform the text\n\nprint(text)\n',
};

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function pickContextPhrase(text: string, topic: TaskTopic, keywords: string[]) {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20 && sentence.length < 180);
  const matchingSentence = sentences.find((sentence) =>
    keywords.some((keyword) => sentence.toLowerCase().includes(keyword)),
  );

  if (matchingSentence) {
    return matchingSentence.replace(/\s+/g, " ");
  }

  const phrasePatterns = [
    /calculate\s+([a-z0-9\s-]{3,40})/i,
    /convert\s+([a-z0-9\s-]{3,40})/i,
    /find\s+([a-z0-9\s-]{3,40})/i,
    /track\s+([a-z0-9\s-]{3,40})/i,
    /classify\s+([a-z0-9\s-]{3,40})/i,
  ];
  const matchedPhrase = phrasePatterns
    .map((pattern) => text.match(pattern)?.[0])
    .find(Boolean);

  return matchedPhrase ?? topicDefaults[topic].contextPhrase;
}

function buildTitle(topic: TaskTopic, contextPhrase: string) {
  const normalized = contextPhrase
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const concise = normalized.split(" ").slice(0, 7).join(" ");
  const fallback = topicDefaults[topic].titlePhrase;

  if (!concise || concise.toLowerCase() === fallback.toLowerCase()) {
    return fallback;
  }

  if (topic === "loops" && /\b(sum|total|count|repeat|loop|range)\b/i.test(concise)) {
    return `${toTitleCase(concise)} with a Loop`;
  }

  if (topic === "conditionals") {
    return `${toTitleCase(concise)} with Conditions`;
  }

  if (topic === "functions") {
    return `Build a Function for ${toTitleCase(concise)}`;
  }

  if (topic === "lists") {
    return `Process ${toTitleCase(concise)} in a List`;
  }

  if (topic === "strings") {
    return `Explore ${toTitleCase(concise)} as Text`;
  }

  return `Use Variables for ${toTitleCase(concise)}`;
}

function difficultyForConcept(concept: ExtractedConcept, index: number): TaskDifficulty {
  if (concept.topic === "functions" || concept.topic === "lists" || index === 2) {
    return "medium";
  }

  if (concept.confidence > 0.9 && index > 0) {
    return "hard";
  }

  return "easy";
}

function estimatedMinutes(difficulty: TaskDifficulty) {
  if (difficulty === "hard") return 30;
  if (difficulty === "medium") return 25;
  return 18;
}

function buildTask(
  file: ImportedAssignmentFile,
  extractedText: string,
  concept: ExtractedConcept,
  index: number,
): GeneratedPracticeTask {
  const createdAt = new Date().toISOString();
  const seed = topicDefaults[concept.topic];
  const contextPhrase = pickContextPhrase(
    extractedText,
    concept.topic,
    concept.matchedKeywords,
  );
  const difficulty = difficultyForConcept(concept, index);
  const id = `${file.id}-draft-${String(index + 1).padStart(3, "0")}`;

  return {
    id,
    taskNumber: index + 1,
    sourceFileId: file.id,
    sourceFileName: file.name,
    sourceFileType: file.type,
    title: buildTitle(concept.topic, contextPhrase),
    topic: concept.topic,
    difficulty,
    status: "not_started",
    progress: 0,
    estimatedMinutes: estimatedMinutes(difficulty),
    description: `Explore ${seed.contextPhrase} using the assignment context: “${contextPhrase.slice(0, 130)}”.`,
    problemDescription: [
      `Create a Python program connected to this assignment idea: ${contextPhrase}`,
      "Use the starter code as a scaffold, then reason through each step before writing the full logic.",
    ],
    learningObjectives: [
      `Identify where ${concept.name.toLowerCase()} appear in the uploaded file.`,
      "Trace the program state with at least one example input.",
      "Explain why each step is needed before finalizing the code.",
    ],
    inputDescription: seed.inputHint,
    outputDescription: seed.outputHint,
    examples: [
      {
        id: `${id}-example-1`,
        input: concept.topic === "strings" ? "hello world" : concept.topic === "loops" ? "5" : "42",
        output: concept.topic === "loops" ? "15" : "Result",
      },
    ],
    constraints: [
      "Do not hard-code the example output.",
      "Keep the solution readable and explainable.",
      "Use the requested concept rather than replacing it with a shortcut.",
    ],
    helpfulReminder:
      "Pause before coding: what values change, what stays fixed, and what question should each line answer?",
    starterCode: starterCodeByTopic[concept.topic],
    language: "python",
    imported: true,
    createdAt,
    updatedAt: createdAt,
    href: `/tasks/${id}`,
  };
}

function fallbackConcept(): ExtractedConcept {
  return {
    id: "concept-general-variables",
    name: "Variables",
    topic: "variables",
    confidence: 0.4,
    sourceNote: "Generated as a general starting point because no strong concept keywords were found.",
    matchedKeywords: [],
  };
}

export function generateTasksFromExtractedText(params: {
  file: ImportedAssignmentFile;
  extractedText: string;
  concepts: ExtractedConcept[];
}): GeneratedPracticeTask[] {
  const selectedConcepts = (params.concepts.length ? params.concepts : [fallbackConcept()])
    .slice(0, params.concepts.length <= 1 ? 2 : 3);

  return selectedConcepts.map((concept, index) =>
    buildTask(params.file, params.extractedText, concept, index),
  );
}

import type { ExtractedQuestion, ThinkingDepth } from "@/types/import";
import type { TaskTopic } from "@/types/task";

interface QuestionSection {
  label: string;
  number?: number;
  text: string;
  startIndex: number;
}

const headingPattern =
  /(^|\n)\s*((?:Question|Exercise|Problem|Task|Challenge|Practice)\s*#?\s*(\d+)|Q\s*(\d+)|(\d+)[.)])\s*[:.)-]?\s*/gi;
const writeProgramPattern =
  /(^|\n)\s*((?:Write|Create|Implement)\s+(?:a\s+)?(?:Python\s+)?program\b)/gi;

const topicKeywords: Record<TaskTopic, string[]> = {
  variables: ["variable", "input", "output", "assign", "store", "print", "value"],
  conditionals: ["if", "else", "elif", "condition", "positive", "negative", "zero", "grade", "classify", "compare"],
  loops: ["loop", "for", "while", "repeat", "range", "sum", "total", "accumulator", "count"],
  functions: ["function", "def", "parameter", "return", "call", "reusable"],
  lists: ["list", "array", "index", "append", "element", "sequence", "maximum", "minimum"],
  strings: ["string", "character", "substring", "split", "join", "text"],
};

function normalizeText(text: string) {
  return text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function createSectionsFromMatches(text: string, matches: RegExpMatchArray[]): QuestionSection[] {
  return matches.map((match, index) => {
    const matchIndex = match.index ?? 0;
    const nextIndex = matches[index + 1]?.index ?? text.length;
    const label = (match[2] ?? match[0]).replace(/\s+/g, " ").trim();
    const number = Number(match[3] ?? match[4] ?? match[5] ?? index + 1);

    return {
      label,
      number: Number.isFinite(number) ? number : index + 1,
      text: text.slice(matchIndex, nextIndex).trim(),
      startIndex: matchIndex,
    };
  });
}

function findQuestionSections(text: string): QuestionSection[] {
  const numberedMatches = Array.from(text.matchAll(headingPattern));

  if (numberedMatches.length > 0) {
    return createSectionsFromMatches(text, numberedMatches);
  }

  const writeMatches = Array.from(text.matchAll(writeProgramPattern));

  if (writeMatches.length > 1) {
    return createSectionsFromMatches(text, writeMatches);
  }

  if (writeMatches.length === 1) {
    return [{
      label: "Detected programming question",
      number: 1,
      text: text.slice(writeMatches[0].index ?? 0).trim(),
      startIndex: writeMatches[0].index ?? 0,
    }];
  }

  return [];
}

function getSectionValue(text: string, label: string) {
  const pattern = new RegExp(
    `${label}\\s*:?\\s*([\\s\\S]*?)(?=\\n\\s*(?:Input|Output|Example|Example\\s+\\d+|Requirements|Constraints|Starter Code|Hint)\\s*:|$)`,
    "i",
  );
  const match = text.match(pattern);

  return match?.[1]?.trim();
}

function stripStructureBlocks(text: string) {
  return text
    .replace(/\n?\s*(Input|Output|Example|Example\s+\d+|Requirements|Constraints|Starter Code|Hint)\s*:[\s\S]*$/i, "")
    .replace(headingPattern, " ")
    .replace(writeProgramPattern, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromProblem(problemStatement: string, fallback: string) {
  const cleaned = problemStatement
    .replace(/^(Question|Exercise|Problem|Task|Challenge|Practice)\s*#?\s*\d+\s*[:.)-]?\s*/i, "")
    .replace(/^Q\s*\d+\s*[:.)-]?\s*/i, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/^Write\s+a\s+(Python\s+)?program\s+that\s+/i, "")
    .replace(/^Write\s+a\s+(Python\s+)?program\s+to\s+/i, "")
    .replace(/^Create\s+a\s+program\s+that\s+/i, "")
    .replace(/^Implement\s+a\s+program\s+that\s+/i, "")
    .split(/[.\n]/)[0]
    .trim();
  const concise = cleaned.split(/\s+/).slice(0, 9).join(" ");

  if (!concise) {
    return fallback;
  }

  return concise
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function detectTopic(text: string): TaskTopic {
  const lowerText = text.toLowerCase();
  const ranked = Object.entries(topicKeywords)
    .map(([topic, keywords]) => ({
      topic: topic as TaskTopic,
      score: keywords.reduce(
        (count, keyword) => count + (lowerText.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .sort((first, second) => second.score - first.score);

  return ranked[0]?.score ? ranked[0].topic : "variables";
}

function thinkingDepthFromText(text: string, topic: TaskTopic): ThinkingDepth {
  const lowerText = text.toLowerCase();
  const advancedSignals = ["nested", "function", "list", "array", "maximum", "minimum", "multiple", "validate"];

  if (topic === "functions" || topic === "lists" || advancedSignals.some((signal) => lowerText.includes(signal))) {
    return "intermediate";
  }

  if (text.length > 900) {
    return "deep_dive";
  }

  return "foundational";
}

function difficultyConfidence(text: string, hasNumberedBoundary: boolean) {
  let confidence = hasNumberedBoundary ? 0.72 : 0.58;

  if (/\b(write|create|implement)\b.+\bprogram\b/i.test(text)) confidence += 0.12;
  if (/\binput\b/i.test(text)) confidence += 0.05;
  if (/\boutput\b/i.test(text)) confidence += 0.05;
  if (/\bexample\b/i.test(text)) confidence += 0.04;

  return Math.min(0.96, confidence);
}

function parseRequirements(text: string) {
  const block = getSectionValue(text, "Requirements") ?? getSectionValue(text, "Constraints");

  if (!block) {
    return [];
  }

  return block
    .split(/\n|;|•|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 3)
    .slice(0, 5);
}

function parseExamples(text: string, questionId: string) {
  const directExample = text.match(
    /Example(?:\s+\d+)?\s*:?\s*[\s\S]*?Input\s*:?\s*([^\n]+)\s*[\s\S]*?Output\s*:?\s*([^\n]+)/i,
  );

  if (directExample) {
    return [{
      id: `${questionId}-example-1`,
      input: directExample[1].trim(),
      output: directExample[2].trim(),
    }];
  }

  const exampleBlock = getSectionValue(text, "Example(?:\\s+\\d+)?");

  if (!exampleBlock) {
    return [];
  }

  const input = exampleBlock.match(/Input\s*:?\s*([^\n]+)/i)?.[1]?.trim();
  const output = exampleBlock.match(/Output\s*:?\s*([^\n]+)/i)?.[1]?.trim();

  if (!input && !output) {
    return [{
      id: `${questionId}-example-1`,
      input: "",
      output: exampleBlock.split("\n").slice(0, 2).join(" ").trim(),
    }];
  }

  return [{
    id: `${questionId}-example-1`,
    input: input ?? "",
    output: output ?? "",
  }];
}

export function extractProgrammingQuestions(extractedText: string): ExtractedQuestion[] {
  const text = normalizeText(extractedText);
  const sections = findQuestionSections(text).slice(0, 10);

  return sections
    .map((section, index) => {
      const questionNumber = section.number ?? index + 1;
      const id = `question-${String(questionNumber).padStart(3, "0")}`;
      const inputDescription = getSectionValue(section.text, "Input");
      const outputDescription = getSectionValue(section.text, "Output");
      const problemStatement = stripStructureBlocks(section.text) || section.text;
      const detectedTopic = detectTopic(section.text);

      return {
        id,
        questionNumber,
        title: titleFromProblem(problemStatement, `Question ${questionNumber}`),
        rawText: section.text,
        problemStatement,
        inputDescription,
        outputDescription,
        examples: parseExamples(section.text, id),
        requirements: parseRequirements(section.text),
        detectedTopic,
        thinkingDepth: thinkingDepthFromText(section.text, detectedTopic),
        confidence: difficultyConfidence(section.text, Boolean(section.number)),
        sourceSnippet: problemStatement.slice(0, 220),
        selected: true,
      };
    })
    .filter((question) => question.problemStatement.length > 20);
}

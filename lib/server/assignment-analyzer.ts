import type { ExtractedConcept } from "@/types/import";
import type { TaskTopic } from "@/types/task";

interface ConceptRule {
  topic: TaskTopic;
  name: string;
  keywords: string[];
  note: string;
}

const conceptRules: ConceptRule[] = [
  {
    topic: "variables",
    name: "Variables",
    keywords: ["variable", "variables", "input", "output", "assign", "store", "print", "value"],
    note: "Detected from references to storing, assigning, reading, or printing values.",
  },
  {
    topic: "conditionals",
    name: "Conditionals",
    keywords: ["if", "else", "elif", "condition", "branch", "compare", "greater than", "less than", "grade", "decision"],
    note: "Detected from branching, comparison, grading, or decision-making language.",
  },
  {
    topic: "loops",
    name: "Loops",
    keywords: ["loop", "loops", "for", "while", "repeat", "iteration", "range", "sum", "accumulator", "count"],
    note: "Detected from repeated actions, ranges, sums, counts, or accumulators.",
  },
  {
    topic: "functions",
    name: "Functions",
    keywords: ["function", "functions", "def", "parameter", "parameters", "return", "reusable", "call"],
    note: "Detected from function definitions, calls, returns, and reusable logic.",
  },
  {
    topic: "lists",
    name: "Lists",
    keywords: ["list", "lists", "array", "index", "append", "element", "sequence", "maximum", "minimum"],
    note: "Detected from collections, indexing, appending, or sequence processing.",
  },
  {
    topic: "strings",
    name: "Strings",
    keywords: ["string", "strings", "character", "substring", "split", "join", "text"],
    note: "Detected from text, character, substring, split, or join operations.",
  },
];

function countKeywordMatches(text: string, keyword: string) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = keyword.includes(" ")
    ? new RegExp(escaped, "gi")
    : new RegExp(`\\b${escaped}\\b`, "gi");

  return text.match(pattern)?.length ?? 0;
}

export function extractProgrammingConcepts(extractedText: string): ExtractedConcept[] {
  const text = extractedText.toLowerCase();

  return conceptRules
    .map((rule) => {
      const matches = rule.keywords
        .map((keyword) => ({
          keyword,
          count: countKeywordMatches(text, keyword),
        }))
        .filter((match) => match.count > 0);
      const totalMatches = matches.reduce((sum, match) => sum + match.count, 0);
      const matchedKeywords = matches.map((match) => match.keyword);

      return {
        id: `concept-${rule.topic}`,
        name: rule.name,
        topic: rule.topic,
        confidence: Math.min(0.95, 0.45 + totalMatches * 0.08 + matchedKeywords.length * 0.04),
        sourceNote: totalMatches > 0 ? rule.note : "",
        matchedKeywords,
        totalMatches,
      };
    })
    .filter((concept) => concept.totalMatches > 0)
    .sort((first, second) => second.confidence - first.confidence)
    .map(({ totalMatches: _totalMatches, ...concept }) => concept);
}

export function extractTextPreview(extractedText: string, maxLength = 1000) {
  return extractedText.length > maxLength
    ? `${extractedText.slice(0, maxLength).trim()}…`
    : extractedText;
}

export function extractKeywordCount(concepts: ExtractedConcept[]) {
  return new Set(concepts.flatMap((concept) => concept.matchedKeywords)).size;
}

import { redirect } from "next/navigation";

const taskByLegacyLesson: Record<string, string> = {
  "introduction-to-python": "qb-string-formatter",
  "hello-world": "qb-string-formatter",
  "basic-syntax": "qb-string-formatter",
  comments: "qb-string-formatter",
  variables: "qb-variables-input",
  numbers: "qb-rectangle-summary",
  "strings-type": "qb-string-formatter",
  booleans: "qb-validator-function",
  "type-conversion": "qb-temperature-converter",
  "print-output": "qb-string-formatter",
  "user-input": "qb-variables-input",
  "string-formatting": "qb-string-formatter",
  "arithmetic-operators": "qb-number-converter",
  "comparison-operators": "qb-validator-function",
  "logical-operators": "qb-validator-function",
  "if-statements": "qb-grade-calculator",
  "elif-statements": "qb-grade-calculator",
  "else-statements": "qb-leap-year",
  "nested-conditions": "qb-validator-function",
  "while-loops": "qb-loop-sum",
  "for-loops": "qb-loop-sum",
  range: "qb-multiplication-table",
  break: "qb-find-maximum",
  continue: "qb-list-statistics",
};

export default function LegacyLessonRedirect({ params }: { params: { lessonId: string } }) {
  const taskId = taskByLegacyLesson[params.lessonId];
  redirect(taskId ? `/tasks/${taskId}` : "/tasks");
}

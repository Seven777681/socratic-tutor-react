import type { ProgrammingTaskSummary } from "@/types/task";
import type { ComputationalThinkingScore } from "@/types/computational-thinking";

export async function getComputationalThinkingScores(studySessionId: string) {
  const response = await fetch(
    `/api/ct-assessment/question-sets?studySessionId=${encodeURIComponent(studySessionId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("CT scores could not be loaded.");
  const payload = (await response.json()) as { scores?: ComputationalThinkingScore[] };
  return payload.scores ?? [];
}

export async function generateComputationalThinkingScore({
  studySessionId,
  questionSetId,
  questionSetTitle,
  tasks,
}: {
  studySessionId: string;
  questionSetId: string;
  questionSetTitle: string;
  tasks: ProgrammingTaskSummary[];
}) {
  const response = await fetch("/api/ct-assessment/question-sets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studySessionId,
      questionSetId,
      questionSetTitle,
      taskIds: tasks.map((task) => task.id),
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        planningRequirement: task.planningRequirement ?? "optional",
      })),
    }),
  });
  if (!response.ok) throw new Error("CT score could not be generated.");
  const payload = (await response.json()) as { score: ComputationalThinkingScore };
  return payload.score;
}

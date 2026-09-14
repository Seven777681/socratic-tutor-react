import { getQuestionBankSummaries, getQuestionBankTaskById } from "@/data/question-bank";

export function getTaskSummaries() {
  return getQuestionBankSummaries();
}

export function getTaskById(taskId: string) {
  return getQuestionBankTaskById(taskId);
}

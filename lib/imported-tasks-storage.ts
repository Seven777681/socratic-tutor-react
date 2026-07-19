import type {
  GeneratedPracticeTask,
  ImportHistoryEntry,
  ImportedAssignmentFile,
} from "@/types/import";
import type { ProgrammingTaskDetail, ProgrammingTaskSummary } from "@/types/task";
import { devDemoTasks } from "@/data/dev-demo-tasks";

export const importedTasksStorageKey = "socratic-imported-tasks";
export const importHistoryStorageKey = "socratic-import-history";
export const generatedTasksStorageKey = "socratic-generated-import-tasks";
const importedFilesStorageKey = "socratic-imported-files";

export function isDemoTasksEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_TASKS === "true";
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJsonArray<T>(key: string): T[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

function writeJsonArray<T>(key: string, value: T[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadImportedTasks() {
  return readJsonArray<GeneratedPracticeTask>(importedTasksStorageKey);
}

export function getGeneratedTasks() {
  return loadImportedTasks();
}

export function saveImportedTasks(tasks: GeneratedPracticeTask[]) {
  writeJsonArray(importedTasksStorageKey, tasks);
}

export function saveGeneratedTasks(tasks: GeneratedPracticeTask[]) {
  saveImportedTasks(tasks);
}

export function loadGeneratedImportTasks() {
  return readJsonArray<GeneratedPracticeTask>(generatedTasksStorageKey);
}

export function saveGeneratedImportTasks(tasks: GeneratedPracticeTask[]) {
  writeJsonArray(generatedTasksStorageKey, tasks);
}

export function appendImportedTasks(tasks: GeneratedPracticeTask[]) {
  const existing = loadImportedTasks();
  const next = [
    ...existing.filter((task) => !tasks.some((candidate) => candidate.id === task.id)),
    ...tasks,
  ];
  saveImportedTasks(next);
  return next;
}

export function addGeneratedTasks(tasks: GeneratedPracticeTask[]) {
  return appendImportedTasks(tasks);
}

export function loadImportHistory() {
  return readJsonArray<ImportHistoryEntry>(importHistoryStorageKey);
}

export function saveImportHistory(history: ImportHistoryEntry[]) {
  writeJsonArray(importHistoryStorageKey, history);
}

export function loadImportedFiles() {
  return readJsonArray<ImportedAssignmentFile>(importedFilesStorageKey);
}

export function saveImportedFiles(files: ImportedAssignmentFile[]) {
  writeJsonArray(importedFilesStorageKey, files);
}

export function getGeneratedSourceFiles() {
  return loadImportedFiles();
}

export function clearGeneratedTasksForTesting() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(importedTasksStorageKey);
  window.localStorage.removeItem(importHistoryStorageKey);
  window.localStorage.removeItem(generatedTasksStorageKey);
  window.localStorage.removeItem(importedFilesStorageKey);
}

export function toTaskSummary(
  task: GeneratedPracticeTask,
  taskNumber: number,
): ProgrammingTaskSummary {
  const sourceFile =
    loadImportedFiles().find((file) => file.id === task.sourceFileId) ??
    loadImportHistory().find((entry) => entry.file.id === task.sourceFileId)?.file;

  return {
    id: task.id,
    taskNumber,
    title: task.title,
    description: task.description,
    sourceFileId: task.sourceFileId,
    sourceFileName: sourceFile?.name ?? "Uploaded class file",
    sourceFileType: sourceFile?.type,
    language: "Python",
    topic: task.topic,
    difficulty: task.difficulty,
    status: task.status,
    progress: task.progress,
    estimatedMinutes: task.estimatedMinutes,
    createdAt: task.createdAt,
    updatedAt: task.createdAt,
    href: `/tasks/${task.id}`,
    imported: true,
  };
}

export function toTaskDetail(
  task: GeneratedPracticeTask,
  taskNumber: number,
): ProgrammingTaskDetail {
  return {
    ...toTaskSummary(task, taskNumber),
    language: "python",
    description: task.problemDescription.length
      ? task.problemDescription
      : [task.description],
    learningObjectives: task.learningObjectives,
    inputDescription: task.inputDescription,
    outputDescription: task.outputDescription,
    examples: task.examples,
    constraints: task.constraints,
    helpfulReminder: "Use the starter code as a scaffold, then test one small idea at a time.",
    starterCode: task.starterCode,
    codeRuns: 0,
    tutorInteractions: 0,
    lastSaved: "Imported",
  };
}

export function getGeneratedTaskSummaries() {
  const generated = getGeneratedTasks().map((task, index) =>
    toTaskSummary(task, index + 1),
  );

  if (!isDemoTasksEnabled()) {
    return generated;
  }

  return [...devDemoTasks, ...generated.map((task, index) => ({
    ...task,
    taskNumber: devDemoTasks.length + index + 1,
  }))];
}

export function getGeneratedTaskById(taskId: string) {
  const generatedTasks = getGeneratedTasks();
  const importedTask = generatedTasks.find((task) => task.id === taskId);

  if (!importedTask) {
    return undefined;
  }

  const importedIndex = generatedTasks.findIndex((task) => task.id === taskId);
  return toTaskDetail(importedTask, importedIndex + 1);
}

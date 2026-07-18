"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  FileCodeIcon,
  GaugeIcon,
  LoaderCircleIcon,
  RotateCcwIcon,
  TrashIcon,
  XIcon,
} from "@/components/dashboard/dashboard-icons";
import { difficultyLabels, topicLabels } from "@/components/tasks/task-formatters";
import {
  appendImportedTasks,
  loadImportHistory,
  loadImportedFiles,
  loadImportedTasks,
  saveImportHistory,
  saveGeneratedImportTasks,
  saveImportedFiles,
} from "@/lib/imported-tasks-storage";
import {
  mockExtractConcepts,
  mockGenerateTasks,
} from "@/services/mock-assignment-importer";
import type {
  ExtractedConcept,
  GeneratedPracticeTask,
  ImportedAssignmentFile,
  ImportHistoryEntry,
  ImportedTaskSourceType,
  ImportPipelineStatus,
} from "@/types/import";
import type { TaskDifficulty, TaskTopic } from "@/types/task";

const maxFileSize = 10 * 1024 * 1024;
const acceptedExtensions = [".pdf", ".docx", ".pptx", ".txt", ".md"];

const statusLabels: Record<ImportPipelineStatus, string> = {
  idle: "Idle",
  file_selected: "File selected",
  extracting: "Extracting concepts",
  generating: "Generating tasks",
  ready: "Ready to review",
  imported: "Imported",
  error: "Error",
};

const statusOrder: ImportPipelineStatus[] = [
  "idle",
  "file_selected",
  "extracting",
  "generating",
  "ready",
  "imported",
];

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function sourceTypeFromFile(file: File): ImportedTaskSourceType | undefined {
  const name = file.name.toLowerCase();

  if (name.endsWith(".md")) {
    return "markdown";
  }

  const extension = acceptedExtensions.find((candidate) => name.endsWith(candidate));
  return extension ? (extension.slice(1) as ImportedTaskSourceType) : undefined;
}

function createFileMeta(file: File, type: ImportedTaskSourceType): ImportedAssignmentFile {
  return {
    id: `file-${Date.now()}`,
    name: file.name,
    type,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
}

async function readTextFile(file: File) {
  const type = sourceTypeFromFile(file);

  if (type !== "txt" && type !== "markdown") {
    return undefined;
  }

  return file.text();
}

function PipelineStatus({ status }: { status: ImportPipelineStatus }) {
  const currentIndex = Math.max(0, statusOrder.indexOf(status));
  const progress = status === "error" ? 0 : Math.round((currentIndex / (statusOrder.length - 1)) * 100);

  return (
    <div className="rounded-[18px] border border-[#E4E7F0] bg-white/85 p-5 shadow-sm" aria-live="polite">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-600">Import pipeline</p>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#eceaff] px-3 py-1 text-xs font-extrabold text-[#6255f6]">
          {status === "extracting" || status === "generating" ? (
            <LoaderCircleIcon className="h-3.5 w-3.5 motion-safe:animate-spin" />
          ) : (
            <CheckCircleIcon className="h-3.5 w-3.5" />
          )}
          {statusLabels[status]}
        </span>
      </div>
      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
        role="progressbar"
        aria-label="Assignment import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4678ff)] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-2">
        {statusOrder.map((item) => (
          <span key={item} className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6255f6]" />
            {statusLabels[item]}
          </span>
        ))}
      </div>
    </div>
  );
}

function ConceptsPanel({ concepts }: { concepts: ExtractedConcept[] }) {
  return (
    <section className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
      <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">Detected Concepts</h2>
      {concepts.length ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {concepts.map((concept) => (
            <span key={concept.id} className="rounded-2xl border border-indigo-100 bg-[#FBFCFF] px-4 py-3">
              <span className="block text-sm font-extrabold text-[#6255f6]">{concept.name}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{concept.sourceNote}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] px-4 py-8 text-center text-sm font-bold text-slate-500">
          Upload a class file to see detected programming concepts.
        </p>
      )}
    </section>
  );
}

function TaskCard({
  task,
  index,
  onEdit,
  onRemove,
}: {
  task: GeneratedPracticeTask;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_14px_40px_rgba(78,91,130,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-[#6255f6]">Generated Task {String(index + 1).padStart(2, "0")}</p>
          <h3 className="mt-3 text-xl font-extrabold tracking-normal text-[#101426]">{task.title}</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Draft</span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{task.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
          <BookOpenIcon className="h-3.5 w-3.5" />
          {topicLabels[task.topic]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          <GaugeIcon className="h-3.5 w-3.5" />
          {difficultyLabels[task.difficulty]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          <ClockIcon className="h-3.5 w-3.5" />
          {task.estimatedMinutes} min
        </span>
      </div>
      <pre className="mt-4 max-h-36 overflow-auto rounded-[14px] bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        <code>{task.starterCode}</code>
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="rounded-lg border border-[#b9b2ff] bg-white px-4 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
          Edit
        </button>
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-2 rounded-lg border border-[#E4E7F0] bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
          <TrashIcon className="h-4 w-4" />
          Remove
        </button>
      </div>
    </article>
  );
}

function TaskEditor({
  task,
  onCancel,
  onSave,
}: {
  task: GeneratedPracticeTask;
  onCancel: () => void;
  onSave: (task: GeneratedPracticeTask) => void;
}) {
  const [draft, setDraft] = useState(task);
  const hasTitle = draft.title.trim().length > 0;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="task-editor-title">
      <div className="max-h-[96dvh] w-full overflow-auto rounded-t-[24px] border border-[#E4E7F0] bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.22)] sm:mx-auto sm:max-w-3xl sm:rounded-[24px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="task-editor-title" className="text-xl font-extrabold tracking-normal text-[#101426]">Edit Generated Task</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Review the scaffold before adding it to the task list.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Close editor" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E7F0] text-slate-500 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Task title
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="rounded-lg border border-[#DDE3EF] px-3 py-2.5 text-sm font-semibold text-[#101426] outline-none focus:ring-4 focus:ring-[#6255f6]/15" />
            {!hasTitle ? <span className="text-xs font-bold text-rose-600">Task title is required.</span> : null}
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Topic
            <select value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value as TaskTopic })} className="rounded-lg border border-[#DDE3EF] px-3 py-2.5 text-sm font-semibold text-[#101426] outline-none focus:ring-4 focus:ring-[#6255f6]/15">
              {Object.entries(topicLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Difficulty
            <select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as TaskDifficulty })} className="rounded-lg border border-[#DDE3EF] px-3 py-2.5 text-sm font-semibold text-[#101426] outline-none focus:ring-4 focus:ring-[#6255f6]/15">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Estimated Time
            <input type="number" min={5} value={draft.estimatedMinutes} onChange={(event) => setDraft({ ...draft, estimatedMinutes: Number(event.target.value) })} className="rounded-lg border border-[#DDE3EF] px-3 py-2.5 text-sm font-semibold text-[#101426] outline-none focus:ring-4 focus:ring-[#6255f6]/15" />
          </label>
        </div>

        <div className="mt-4 grid gap-4">
          {[
            ["Description", "description"],
            ["Problem Description", "problemDescription"],
            ["Learning Objectives", "learningObjectives"],
            ["Input Description", "inputDescription"],
            ["Output Description", "outputDescription"],
            ["Starter Code", "starterCode"],
          ].map(([label, field]) => (
            <label key={field} className="grid gap-2 text-sm font-bold text-slate-700">
              {label}
              <textarea
                rows={field === "starterCode" ? 7 : 3}
                value={Array.isArray(draft[field as keyof GeneratedPracticeTask]) ? (draft[field as keyof GeneratedPracticeTask] as string[]).join("\n") : String(draft[field as keyof GeneratedPracticeTask])}
                onChange={(event) => {
                  const value = event.target.value;
                  setDraft({
                    ...draft,
                    [field]: field === "problemDescription" || field === "learningObjectives"
                      ? value.split("\n").filter(Boolean)
                      : value,
                  });
                }}
                className="rounded-lg border border-[#DDE3EF] px-3 py-2.5 text-sm font-semibold text-[#101426] outline-none focus:ring-4 focus:ring-[#6255f6]/15"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-[#E4E7F0] bg-white px-4 py-2.5 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">Cancel</button>
          <button type="button" disabled={!hasTitle} onClick={() => onSave(draft)} className="rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200/70 transition disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export function AssignmentImportPage() {
  const [fileMeta, setFileMeta] = useState<ImportedAssignmentFile | null>(null);
  const [rawText, setRawText] = useState<string | undefined>();
  const [status, setStatus] = useState<ImportPipelineStatus>("idle");
  const [error, setError] = useState("");
  const [concepts, setConcepts] = useState<ExtractedConcept[]>([]);
  const [tasks, setTasks] = useState<GeneratedPracticeTask[]>([]);
  const [editingTask, setEditingTask] = useState<GeneratedPracticeTask | null>(null);
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setHistory(loadImportHistory());
  }, []);

  const hasReviewTasks = tasks.length > 0 && (status === "ready" || status === "imported");
  const processing = status === "extracting" || status === "generating";

  const selectFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    const type = sourceTypeFromFile(file);

    if (!type) {
      setStatus("error");
      setError("This file type is not supported. Use PDF, DOCX, PPTX, TXT, or Markdown.");
      return;
    }

    if (file.size > maxFileSize) {
      setStatus("error");
      setError("This file is larger than 10MB. Choose a smaller class file.");
      return;
    }

    setError("");
    setSuccessMessage("");
    setTasks([]);
    setConcepts([]);
    setRawText(await readTextFile(file));
    setFileMeta(createFileMeta(file, type));
    setStatus("file_selected");
  };

  const generateTasks = async () => {
    if (!fileMeta) {
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setStatus("extracting");
      const nextConcepts = await mockExtractConcepts(fileMeta, rawText);
      setConcepts(nextConcepts);
      setStatus("generating");
      const generated = await mockGenerateTasks({ file: fileMeta, concepts: nextConcepts, rawText });
      saveGeneratedImportTasks(generated);
      setTasks(generated);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Task generation failed. Try again with the same file.");
    }
  };

  const addToTaskList = () => {
    if (!fileMeta || !tasks.length) {
      return;
    }

    const importedAt = new Date().toISOString();
    const existingImportedCount = loadImportedTasks().length;
    const importedTasks = tasks.map((task, index) => ({
      ...task,
      id: `imported-task-${String(existingImportedCount + index + 1).padStart(3, "0")}`,
      createdAt: importedAt,
    }));
    appendImportedTasks(importedTasks);
    saveImportedFiles([fileMeta, ...loadImportedFiles()]);
    const nextHistory = [
      {
        id: `history-${Date.now()}`,
        file: fileMeta,
        importedAt,
        taskCount: importedTasks.length,
        taskIds: importedTasks.map((task) => task.id),
      },
      ...history,
    ];
    saveImportHistory(nextHistory);
    setHistory(nextHistory);
    setTasks(importedTasks);
    setStatus("imported");
    setSuccessMessage(`${importedTasks.length} tasks added to your task list.`);
  };

  const fileHint = fileMeta && (fileMeta.type === "pdf" || fileMeta.type === "docx" || fileMeta.type === "pptx")
    ? "Content extraction is mocked in this frontend version. Backend parsing can be connected later."
    : "In this prototype, files stay in your browser. Backend extraction can be connected later.";

  return (
    <div className="space-y-7">
      <section className="rounded-[24px] border border-[#E4E7F0] bg-[linear-gradient(135deg,#ffffff_0%,#f2f5ff_100%)] px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <h1 className="text-[34px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[40px]">Assignment Import</h1>
            <p className="mt-3 max-w-[780px] text-base leading-7 text-slate-600">
              Upload class assignments or lecture files and generate coding practice tasks from the same programming concepts.
            </p>
            <p className="mt-4 rounded-2xl border border-indigo-100 bg-white/70 px-4 py-3 text-sm font-semibold leading-6 text-slate-600">
              In this prototype, files stay in your browser. Backend extraction can be connected later.
            </p>
          </div>
          <PipelineStatus status={status} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        <div className="space-y-5">
          <section className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
                <FileCodeIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">Upload File</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">PDF, DOCX, PPTX, TXT, and Markdown files are supported.</p>
              </div>
            </div>
            <label
              htmlFor="assignment-file"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void selectFile(event.dataTransfer.files[0] ?? null);
              }}
              className="mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-indigo-200 bg-[#FBFCFF] px-5 py-8 text-center transition hover:border-[#6255f6] hover:bg-indigo-50/50 focus-within:ring-4 focus-within:ring-[#6255f6]/15"
            >
              <input id="assignment-file" type="file" accept={acceptedExtensions.join(",")} className="sr-only" onChange={(event) => void selectFile(event.target.files?.[0] ?? null)} />
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
                <FileCodeIcon className="h-6 w-6" />
              </span>
              <span className="mt-4 text-sm font-extrabold text-[#101426]">Choose an assignment file</span>
              <span className="mt-2 max-w-[320px] text-sm leading-6 text-slate-500">or drag and drop it here</span>
            </label>
            {error ? <p role="alert" className="mt-4 rounded-[14px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</p> : null}
            {fileMeta ? (
              <div className="mt-4 rounded-[18px] border border-[#E4E7F0] bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-extrabold text-[#101426]">{fileMeta.name}</p>
                    <p className="mt-1 font-semibold text-slate-500">{fileMeta.type.toUpperCase()} · {formatFileSize(fileMeta.size)}</p>
                    <p className="mt-1 font-semibold text-slate-500">Uploaded {new Date(fileMeta.uploadedAt).toLocaleString()}</p>
                  </div>
                  <button type="button" onClick={() => { setFileMeta(null); setTasks([]); setConcepts([]); setStatus("idle"); }} className="rounded-lg border border-[#E4E7F0] px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
                    Remove File
                  </button>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{fileHint}</p>
              </div>
            ) : null}
          </section>
          <ConceptsPanel concepts={concepts} />
        </div>

        <section className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
          <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">Generated Coding Tasks</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">Review and edit the generated tasks before adding them to your task list.</p>
          {processing ? (
            <div className="mt-5 rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] px-5 py-12 text-center">
              <LoaderCircleIcon className="mx-auto h-8 w-8 text-[#6255f6] motion-safe:animate-spin" />
              <p className="mt-3 text-sm font-bold text-slate-600">{statusLabels[status]}</p>
            </div>
          ) : hasReviewTasks ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onEdit={() => setEditingTask(task)}
                  onRemove={() => setTasks((current) => current.filter((candidate) => candidate.id !== task.id))}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] px-5 py-12 text-center">
              <p className="text-sm font-bold text-slate-500">Upload a class file, then generate draft coding tasks.</p>
            </div>
          )}
        </section>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)]">
        <div aria-live="polite">
          <p className="text-sm font-extrabold text-[#101426]">{successMessage || statusLabels[status]}</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Generated tasks are stored locally after you add them.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!fileMeta || processing} onClick={() => void generateTasks()} className="rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200/70 transition disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
            Generate Tasks
          </button>
          {hasReviewTasks ? (
            <>
              <button type="button" onClick={() => void generateTasks()} className="inline-flex items-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-4 py-2.5 text-sm font-bold text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
                <RotateCcwIcon className="h-4 w-4" />
                Regenerate
              </button>
              <button type="button" disabled={!tasks.length || status === "imported"} onClick={addToTaskList} className="rounded-lg bg-[#101426] px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
                Add to Task List
              </button>
            </>
          ) : null}
          {status === "imported" ? (
            <Link href="/tasks" className="inline-flex items-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-4 py-2.5 text-sm font-bold text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">
              View Tasks
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          ) : null}
          <Link href="/dashboard" className="rounded-lg border border-[#E4E7F0] bg-white px-4 py-2.5 text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15">Back to Dashboard</Link>
        </div>
      </section>

      <section className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
        <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">Import History</h2>
        {history.length ? (
          <div className="mt-4 grid gap-3">
            {history.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-3 rounded-[16px] border border-[#E4E7F0] bg-[#FBFCFF] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[#101426]">{entry.file.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{new Date(entry.importedAt).toLocaleString()} · {entry.taskCount} tasks</p>
                </div>
                <div className="flex gap-2">
                  <Link href="/tasks" className="rounded-lg border border-[#b9b2ff] bg-white px-3 py-2 text-xs font-bold text-[#6255f6]">View Tasks</Link>
                  <button type="button" onClick={() => { const next = history.filter((item) => item.id !== entry.id); setHistory(next); saveImportHistory(next); }} className="rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-xs font-bold text-slate-600">Remove Import</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] px-4 py-8 text-center text-sm font-bold text-slate-500">Recent imports will appear here.</p>
        )}
      </section>

      {editingTask ? (
        <TaskEditor
          task={editingTask}
          onCancel={() => setEditingTask(null)}
          onSave={(nextTask) => {
            setTasks((current) => current.map((task) => task.id === nextTask.id ? nextTask : task));
            setEditingTask(null);
          }}
        />
      ) : null}
    </div>
  );
}

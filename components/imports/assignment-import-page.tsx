"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  CodeIcon,
  FileCodeIcon,
  LoaderCircleIcon,
} from "@/components/dashboard/dashboard-icons";

type ImportStatus = "empty" | "analyzing" | "ready";

const acceptedExtensions = [".pdf", ".docx", ".pptx"];

const detectedTopics = [
  "loops",
  "conditionals",
  "functions",
  "input parsing",
];

const extractedRequirements = [
  "Read numeric input from stdin",
  "Use a loop to process repeated values",
  "Print a single formatted result",
  "Avoid hard-coded answers",
];

export function AssignmentImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>("empty");

  const fileSize = useMemo(() => {
    if (!selectedFile) {
      return "";
    }

    if (selectedFile.size < 1024 * 1024) {
      return `${Math.max(1, Math.round(selectedFile.size / 1024))} KB`;
    }

    return `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`;
  }, [selectedFile]);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setStatus("analyzing");
    window.setTimeout(() => setStatus("ready"), 900);
  };

  const isReady = status === "ready";

  return (
    <div className="space-y-7">
      <section className="rounded-[24px] border border-[#E4E7F0] bg-[linear-gradient(135deg,#ffffff_0%,#f2f5ff_100%)] px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] motion-safe:animate-[fadeIn_300ms_ease-out] sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[34px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[38px] lg:text-[40px]">
              Assignment Import
            </h1>
            <p className="mt-3 max-w-[760px] text-base leading-7 text-slate-600">
              Upload class assignments or lecture files and prepare coding
              practice tasks from the same programming concepts.
            </p>
          </div>

          <div className="w-full rounded-[18px] border border-[#E4E7F0] bg-white/80 p-5 shadow-sm lg:w-[320px]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-slate-600">
                Import pipeline
              </p>
              <p className="text-sm font-extrabold text-[#6255f6]">
                {isReady ? "Ready" : status === "analyzing" ? "Analyzing" : "Idle"}
              </p>
            </div>
            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
              role="progressbar"
              aria-label="Assignment import progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={isReady ? 100 : status === "analyzing" ? 60 : 0}
            >
              <div
                className={`h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)] transition-[width] duration-300 ${
                  isReady ? "w-full" : status === "analyzing" ? "w-3/5" : "w-0"
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        <div className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
              <FileCodeIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">
                Upload File
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                PDF, DOCX, and PPTX assignment files are supported.
              </p>
            </div>
          </div>

          <label
            htmlFor="assignment-file"
            className="mt-5 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-indigo-200 bg-[#FBFCFF] px-5 py-8 text-center transition hover:border-[#6255f6] hover:bg-indigo-50/50 focus-within:ring-4 focus-within:ring-[#6255f6]/15"
          >
            <input
              id="assignment-file"
              type="file"
              accept={acceptedExtensions.join(",")}
              className="sr-only"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
              <FileCodeIcon className="h-6 w-6" />
            </span>
            <span className="mt-4 text-sm font-extrabold text-[#101426]">
              Choose an assignment file
            </span>
            <span className="mt-2 max-w-[320px] text-sm leading-6 text-slate-500">
              The first version stores a local preview; model extraction can be
              connected behind this flow later.
            </span>
          </label>

          {selectedFile ? (
            <div className="mt-4 rounded-[18px] border border-[#E4E7F0] bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#101426]">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {fileSize}
                  </p>
                </div>
                <span className="rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
                  {status === "analyzing" ? "Scanning" : "Imported"}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
                {status === "analyzing" ? (
                  <LoaderCircleIcon className="h-5 w-5 motion-safe:animate-spin" />
                ) : (
                  <CodeIcon className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">
                  Coding Task Preview
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Generated practice will reuse the existing task workspace.
                </p>
              </div>
            </div>
          </div>

          {selectedFile ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] p-4">
                  <p className="text-xs font-extrabold uppercase tracking-normal text-slate-400">
                    Detected type
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#101426]">
                    Python assignment
                  </p>
                </div>
                <div className="rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] p-4">
                  <p className="text-xs font-extrabold uppercase tracking-normal text-slate-400">
                    Practice focus
                  </p>
                  <p className="mt-2 text-sm font-bold text-[#101426]">
                    Loop-based input processing
                  </p>
                </div>
              </div>

              <div className="rounded-[18px] border border-[#E4E7F0] bg-white p-4">
                <p className="text-sm font-extrabold text-[#101426]">
                  Detected topics
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detectedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#E4E7F0] bg-white p-4">
                <p className="text-sm font-extrabold text-[#101426]">
                  Extracted requirements
                </p>
                <div className="mt-3 grid gap-2">
                  {extractedRequirements.map((requirement) => (
                    <div
                      key={requirement}
                      className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                    >
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{requirement}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] p-4">
                <p className="text-sm font-extrabold text-[#101426]">
                  Draft practice task
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Write a Python program that reads several numbers, uses a loop
                  to calculate a target value, and prints the final result with
                  clear formatting.
                </p>
              </div>

              <Link
                href="/tasks/task-003"
                aria-disabled={!isReady}
                className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200/70 transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
                  isReady
                    ? "bg-[linear-gradient(90deg,#6657f5,#4678ff)] hover:shadow-lg"
                    : "pointer-events-none bg-slate-300"
                }`}
              >
                Open in Workspace
                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-[18px] border border-[#E4E7F0] bg-[#FBFCFF] px-5 py-12 text-center">
              <p className="text-sm font-bold text-slate-500">
                Upload a coding assignment file to preview generated practice.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

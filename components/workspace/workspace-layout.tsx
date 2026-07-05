"use client";

import { useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { ProgrammingTaskDetail } from "@/types/task";
import { CodeEditorPanel } from "@/components/editor/code-editor-panel";
import { mockRunResultTemplates } from "@/data/mock-run-results";
import { TaskProblemPanel } from "@/components/workspace/task-problem-panel";
import { SocraticTutorPanel } from "@/components/tutor/socratic-tutor-panel";
import { TutorPanelToggle } from "@/components/tutor/tutor-panel-toggle";
import { WorkspacePanelToggle } from "@/components/workspace/workspace-panel-toggle";

function createInitialTutorRunResult(taskId: string): CodeRunResult {
  const template = mockRunResultTemplates.failed;

  return {
    ...template,
    id: `initial-tutor-run-${taskId}`,
    taskId,
    scenario: "failed",
    stdin: "5",
    elapsedMs: 874,
    createdAt: new Date().toISOString(),
    tests: template.tests.map((test) => ({ ...test })),
    error: template.error ? { ...template.error } : undefined,
  };
}

export function WorkspaceLayout({ task }: { task: ProgrammingTaskDetail }) {
  const [isProblemCollapsed, setIsProblemCollapsed] = useState(false);
  const [isTutorCollapsed, setIsTutorCollapsed] = useState(false);
  const [currentCode, setCurrentCode] = useState(task.starterCode);
  const [latestRunResult, setLatestRunResult] = useState<CodeRunResult | undefined>(
    () => createInitialTutorRunResult(task.id),
  );

  const layoutClass = isProblemCollapsed
    ? isTutorCollapsed
      ? "grid min-h-[calc(100dvh-68px)] gap-4 p-4 transition-[grid-template-columns] duration-300 lg:grid-cols-[56px_minmax(520px,1fr)_56px] xl:p-5"
      : "grid min-h-[calc(100dvh-68px)] gap-4 p-4 transition-[grid-template-columns] duration-300 lg:grid-cols-[56px_minmax(520px,1fr)_minmax(320px,360px)] xl:p-5 2xl:grid-cols-[56px_minmax(520px,1fr)_minmax(340px,380px)]"
    : isTutorCollapsed
      ? "grid min-h-[calc(100dvh-68px)] gap-4 p-4 transition-[grid-template-columns] duration-300 lg:grid-cols-[minmax(320px,360px)_minmax(520px,1fr)_56px] xl:p-5"
      : "grid min-h-[calc(100dvh-68px)] gap-4 p-4 transition-[grid-template-columns] duration-300 lg:grid-cols-[minmax(320px,360px)_minmax(520px,1fr)_minmax(320px,360px)] xl:p-5 2xl:grid-cols-[minmax(340px,380px)_minmax(520px,1fr)_minmax(340px,380px)]";

  return (
    <div className="min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)]">
      <div className={layoutClass}>
        <div className="min-h-0 lg:h-[calc(100dvh-108px)]">
          {isProblemCollapsed ? (
            <div className="hidden h-full flex-col items-center rounded-[20px] border border-[#E4E7F0] bg-white py-3 shadow-[0_14px_40px_rgba(78,91,130,0.06)] lg:flex">
              <WorkspacePanelToggle
                isCollapsed={isProblemCollapsed}
                onToggle={() => setIsProblemCollapsed(false)}
              />
              <p className="mt-5 [writing-mode:vertical-rl] text-xs font-extrabold uppercase tracking-normal text-slate-500">
                Problem
              </p>
            </div>
          ) : (
            <TaskProblemPanel task={task} />
          )}
        </div>

        <div className="min-h-0 space-y-3 lg:h-[calc(100dvh-108px)]">
          <WorkspacePanelToggle
            isCollapsed={isProblemCollapsed}
            onToggle={() => setIsProblemCollapsed((current) => !current)}
          />
          <CodeEditorPanel
            taskId={task.id}
            starterCode={task.starterCode}
            language={task.language}
            onCodeChange={setCurrentCode}
            onRunResultChange={setLatestRunResult}
          />
        </div>

        <div className="min-h-0 lg:h-[calc(100dvh-108px)]">
          {isTutorCollapsed ? (
            <div className="hidden h-full flex-col items-center rounded-[20px] border border-[#E4E7F0] bg-white py-3 shadow-[0_14px_40px_rgba(78,91,130,0.06)] lg:flex">
              <TutorPanelToggle
                isCollapsed={isTutorCollapsed}
                onToggle={() => setIsTutorCollapsed(false)}
              />
              <p className="mt-5 [writing-mode:vertical-rl] text-xs font-extrabold uppercase tracking-normal text-slate-500">
                AI Tutor
              </p>
            </div>
          ) : (
            <div className="relative h-full">
              <div className="absolute -left-3 top-3 z-10 hidden lg:block">
                <TutorPanelToggle
                  isCollapsed={isTutorCollapsed}
                  onToggle={() => setIsTutorCollapsed(true)}
                />
              </div>
              <SocraticTutorPanel
                task={task}
                currentCode={currentCode}
                latestRunResult={latestRunResult}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

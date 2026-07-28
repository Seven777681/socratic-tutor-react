"use client";

import { useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { ProgrammingTaskDetail } from "@/types/task";
import { CodeEditorPanel } from "@/components/editor/code-editor-panel";
import { SocraticTutorPanel } from "@/components/tutor/socratic-tutor-panel";
import { TutorPanelToggle } from "@/components/tutor/tutor-panel-toggle";

export function WorkspaceLayout({ task }: { task: ProgrammingTaskDetail }) {
  const [isTutorCollapsed, setIsTutorCollapsed] = useState(false);
  const [currentCode, setCurrentCode] = useState(task.starterCode);
  const [latestRunResult, setLatestRunResult] = useState<CodeRunResult | undefined>();

  return (
    <div className="min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)]">
      <div
        className={`grid min-h-[calc(100dvh-68px)] gap-5 p-4 transition-[grid-template-columns] duration-300 xl:p-5 ${
          isTutorCollapsed
            ? "lg:grid-cols-[minmax(0,1fr)_56px]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(320px,32vw)] 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]"
        }`}
      >
        <div className="min-w-0">
          <CodeEditorPanel
            task={task}
            taskId={task.id}
            starterCode={task.starterCode}
            language={task.language}
            onCodeChange={setCurrentCode}
            onRunResultChange={setLatestRunResult}
          />
        </div>

        <div className="min-h-0 lg:sticky lg:top-[88px] lg:h-[calc(100dvh-108px)]">
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

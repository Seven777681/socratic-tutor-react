"use client";

import { useEffect, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { ProgrammingTaskDetail } from "@/types/task";
import type { TutorLearningContext, TutorPlanInteraction } from "@/types/tutor";
import { CodeEditorPanel } from "@/components/editor/code-editor-panel";
import { SocraticTutorPanel } from "@/components/tutor/socratic-tutor-panel";
import { TutorPanelToggle } from "@/components/tutor/tutor-panel-toggle";

export function WorkspaceLayout({ task }: { task: ProgrammingTaskDetail }) {
  const [isTutorCollapsed, setIsTutorCollapsed] = useState(false);
  const [currentCode, setCurrentCode] = useState(task.starterCode);
  const [latestRunResult, setLatestRunResult] = useState<CodeRunResult | undefined>();
  const [planReviewRequestId, setPlanReviewRequestId] = useState(0);
  const [planInteraction, setPlanInteraction] = useState<TutorPlanInteraction | undefined>();
  const [learningContext, setLearningContext] = useState<TutorLearningContext>({
    planningStatus: "not_started",
    planningApproach: "",
    planningSteps: ["", "", ""],
    latestPrediction: "",
    hintLevel: 0,
  });

  useEffect(() => {
    setCurrentCode(task.starterCode);
    setLatestRunResult(undefined);
    setPlanInteraction(undefined);
    setLearningContext({
      planningStatus: "not_started",
      planningApproach: "",
      planningSteps: ["", "", ""],
      latestPrediction: "",
      hintLevel: 0,
    });
  }, [task.id, task.starterCode]);

  return (
    <div className="min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)]">
      <div
        className={`grid min-h-[calc(100dvh-68px)] items-start gap-5 p-4 transition-[grid-template-columns] duration-300 lg:items-stretch xl:p-5 ${
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
            planInteraction={planInteraction}
            onReviewPlanInTutor={(context) => {
              setIsTutorCollapsed(false);
              setPlanInteraction(undefined);
              setLearningContext((current) => ({
                ...context,
                hintLevel: current.hintLevel,
              }));
              setPlanReviewRequestId((requestId) => requestId + 1);
            }}
            onLearningContextChange={(context) => {
              setLearningContext((current) => ({
                ...context,
                hintLevel: current.hintLevel,
              }));
            }}
          />
        </div>

        <div className="min-w-0 lg:flex lg:h-[calc(100dvh-108px)] lg:min-h-0">
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
            <div className="relative w-full lg:flex lg:h-full lg:min-h-0">
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
                learningContext={learningContext}
                planReviewRequestId={planReviewRequestId}
                onPlanInteraction={setPlanInteraction}
                onHintLevelChange={(hintLevel) => {
                  setLearningContext((current) => ({ ...current, hintLevel }));
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

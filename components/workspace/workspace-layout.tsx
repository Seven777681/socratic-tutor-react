"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CodeRunResult } from "@/types/code-run";
import type { ProgrammingTaskDetail, TaskEntryPath } from "@/types/task";
import type { TutorLearningContext, TutorPlanInteraction } from "@/types/tutor";
import { CodeEditorPanel } from "@/components/editor/code-editor-panel";
import { SocraticTutorPanel } from "@/components/tutor/socratic-tutor-panel";
import { TutorPanelToggle } from "@/components/tutor/tutor-panel-toggle";
import { getGeneratedTaskSummaries } from "@/lib/imported-tasks-storage";
import { getParticipantTaskStorageKey } from "@/lib/participant-storage";
import { getStudyTaskAttempt } from "@/services/study-progress";

export function WorkspaceLayout({ task }: { task: ProgrammingTaskDetail }) {
  const aiTutorEnabled = ![
    "task_1_maximum",
    "task_5_minimum",
  ].includes(task.id);
  const [isTutorCollapsed, setIsTutorCollapsed] = useState(false);
  const [currentCode, setCurrentCode] = useState(task.starterCode);
  const [latestRunResult, setLatestRunResult] = useState<CodeRunResult | undefined>();
  const [planReviewRequestId, setPlanReviewRequestId] = useState(0);
  const [planInteraction, setPlanInteraction] = useState<TutorPlanInteraction | undefined>();
  const [entryPath, setEntryPath] = useState<TaskEntryPath>("undecided");
  const [learningContext, setLearningContext] = useState<TutorLearningContext>({
    planningStatus: "not_started",
    planningApproach: "",
    planningSteps: ["", "", ""],
    latestPrediction: "",
    hintLevel: 0,
  });
  const draftSnapshotsRef = useRef<Record<string, {
    code: string;
    entryPath: TaskEntryPath;
    planningStatus: string;
    planningApproach: string;
    planningSteps: string[];
  }>>({});
  draftSnapshotsRef.current[task.id] = {
    code: currentCode,
    entryPath,
    planningStatus: learningContext.planningStatus,
    planningApproach: learningContext.planningApproach,
    planningSteps: learningContext.planningSteps,
  };
  const nextTask = useMemo(() => {
    const tasks = getGeneratedTaskSummaries();
    const currentIndex = tasks.findIndex((candidate) => candidate.id === task.id);
    const next = currentIndex >= 0 ? tasks[currentIndex + 1] : undefined;

    return next ? { href: next.href, title: next.title } : undefined;
  }, [task.id]);

  useEffect(() => {
    setCurrentCode(task.starterCode);
    setLatestRunResult(undefined);
    setPlanInteraction(undefined);
    const storedEntryPath = window.localStorage.getItem(
      getParticipantTaskStorageKey("socratic-task-entry-path", task.id),
    );
    const validStoredPath = storedEntryPath === "understand" ||
      storedEntryPath === "plan" || storedEntryPath === "code";
    setEntryPath(validStoredPath ? storedEntryPath : "undecided");
    setLearningContext({
      planningStatus: "not_started",
      planningApproach: "",
      planningSteps: ["", "", ""],
      latestPrediction: "",
      hintLevel: 0,
    });
    if (!validStoredPath) {
      void getStudyTaskAttempt(task.id).then((attempt) => {
        if (!attempt) return;
        const restoredPath = attempt.entry_path === "understand" ||
          attempt.entry_path === "plan" || attempt.entry_path === "code"
          ? attempt.entry_path
          : ["code", "debug", "reflect"].includes(attempt.current_stage ?? "") ||
              attempt.status === "completed"
            ? "code"
            : attempt.current_stage === "plan" ? "plan" : "undecided";
        setEntryPath(restoredPath);
      });
    }
  }, [aiTutorEnabled, task.id, task.starterCode]);

  useEffect(() => {
    const taskId = task.id;
    const starterCode = task.starterCode;
    const syncDraft = () => {
      const snapshot = draftSnapshotsRef.current[taskId];
      const studySessionId = window.sessionStorage.getItem("socratic-study-session-id");
      if (!snapshot || !studySessionId) return;

      const hasPlan = Boolean(
        snapshot.planningApproach.trim() ||
        snapshot.planningSteps.some((step) => step.trim()),
      );
      const hasActivity =
        snapshot.entryPath !== "undecided" ||
        snapshot.code !== starterCode ||
        hasPlan;
      if (!hasActivity) return;

      void fetch("/api/study/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          studySessionId,
          entryPath:
            snapshot.entryPath === "undecided" ? null : snapshot.entryPath,
          currentStage:
            snapshot.planningStatus === "ready" ? "code" : "plan",
          plan: {
            status: snapshot.planningStatus,
            approach: snapshot.planningApproach,
            steps: snapshot.planningSteps,
          },
          code: snapshot.code,
        }),
        keepalive: true,
      }).catch(() => undefined);
    };

    window.addEventListener("pagehide", syncDraft);
    return () => {
      window.removeEventListener("pagehide", syncDraft);
      syncDraft();
    };
  }, [task.id, task.starterCode]);

  const chooseEntryPath = (path: Exclude<TaskEntryPath, "undecided">) => {
    window.localStorage.setItem(
      getParticipantTaskStorageKey("socratic-task-entry-path", task.id),
      path,
    );
    setEntryPath(path);
  };

  return (
    <div className="min-h-[calc(100dvh-68px)] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)]">
      <div
        className={`grid min-h-[calc(100dvh-68px)] items-start gap-5 p-4 transition-[grid-template-columns] duration-300 lg:items-stretch xl:p-5 ${
          !aiTutorEnabled
            ? "lg:grid-cols-1"
            : isTutorCollapsed
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
            aiTutorEnabled={aiTutorEnabled}
            onCodeChange={setCurrentCode}
            onRunResultChange={setLatestRunResult}
            planInteraction={planInteraction}
            onReviewPlanInTutor={aiTutorEnabled ? (context) => {
              setIsTutorCollapsed(false);
              setPlanInteraction(undefined);
              setLearningContext((current) => ({
                ...context,
                hintLevel: current.hintLevel,
              }));
              setPlanReviewRequestId((requestId) => requestId + 1);
            } : undefined}
            onLearningContextChange={(context) => {
              setLearningContext((current) => ({
                ...context,
                hintLevel: current.hintLevel,
              }));
            }}
            nextTask={nextTask}
            entryPath={entryPath}
            onEntryPathChange={chooseEntryPath}
          />
        </div>

        {aiTutorEnabled ? <div className="min-w-0 lg:flex lg:h-[calc(100dvh-108px)] lg:min-h-0">
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
                entryPath={entryPath}
                onEnterPlanning={() => chooseEntryPath("plan")}
              />
            </div>
          )}
        </div> : null}
      </div>
    </div>
  );
}

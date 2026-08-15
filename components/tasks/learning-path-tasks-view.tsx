import type { MouseEvent } from "react";
import { questionModules } from "@/data/question-modules";
import type { ProgrammingTaskSummary, QuestionBankModuleId } from "@/types/task";
import { TaskCard } from "@/components/tasks/task-card";

function getModuleProgress(tasks: ProgrammingTaskSummary[]) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const total = tasks.length;

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function LearningPathTasksView({
  tasks,
  selectedModuleId,
  onSelectedModuleChange,
  onTaskContextMenu,
}: {
  tasks: ProgrammingTaskSummary[];
  selectedModuleId: QuestionBankModuleId;
  onSelectedModuleChange: (moduleId: QuestionBankModuleId) => void;
  onTaskContextMenu?: (event: MouseEvent, task: ProgrammingTaskSummary) => void;
}) {
  const visibleModules = questionModules.filter((module) =>
    tasks.some((task) => task.moduleId === module.id),
  );
  const selectedModule =
    visibleModules.find((module) => module.id === selectedModuleId) ??
    visibleModules[0] ?? questionModules[0];
  const selectedTasks = tasks.filter((task) => task.moduleId === selectedModule.id);

  return (
    <section
      className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]"
      aria-label="Learning path question modules"
    >
      <aside className="min-w-0 rounded-[22px] border border-[#E4E7F0] bg-white p-4 shadow-[0_16px_45px_rgba(78,91,130,0.08)]">
        <div className="mb-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">
            Learning Path
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Choose one stage at a time.
          </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:overflow-visible lg:pb-0">
          {visibleModules.map((module) => {
            const moduleTasks = tasks.filter((task) => task.moduleId === module.id);
            const progress = getModuleProgress(moduleTasks);
            const isActive = module.id === selectedModule.id;

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => onSelectedModuleChange(module.id)}
                className={`relative min-w-[250px] rounded-[18px] border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 lg:min-w-0 ${
                  isActive
                    ? "border-[#bdb5ff] bg-[#f2f0ff] shadow-[0_14px_32px_rgba(98,85,246,0.12)]"
                    : "border-[#E4E7F0] bg-[#FBFCFF] hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
                aria-pressed={isActive}
              >
                <span className="absolute inset-x-4 top-0 h-1 overflow-hidden rounded-b-full bg-[#EEF2FF]">
                  <span
                    className="block h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </span>
                <span className="block pt-2 text-base font-extrabold text-[#101426]">
                  {module.title}
                </span>
                <span className="mt-2 line-clamp-2 block text-xs font-semibold leading-5 text-slate-500">
                  {module.description}
                </span>
                <span className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                  <span className="rounded-full bg-white px-2.5 py-1 text-[#6255f6]">
                    {progress.total} tasks
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                    {progress.completed} / {progress.total} completed
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-slate-600">
                    {module.difficultyRange}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="min-w-0 rounded-[22px] border border-[#E4E7F0] bg-white/80 p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#E4E7F0] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">
              Selected Module
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-normal text-[#101426]">
              {selectedModule.title}
            </h2>
            <p className="mt-2 max-w-[680px] text-sm leading-6 text-slate-500">
              {selectedModule.description}
            </p>
          </div>
          <span className="w-fit rounded-full bg-[#eceaff] px-3 py-1 text-xs font-extrabold text-[#6255f6]">
            {selectedTasks.length} tasks
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {selectedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onContextMenu={onTaskContextMenu}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

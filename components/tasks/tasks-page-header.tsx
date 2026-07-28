export function TasksPageHeader({
  completedTasks,
  totalTasks,
  currentModuleTitle,
}: {
  completedTasks: number;
  totalTasks: number;
  currentModuleTitle: string;
}) {
  const completionPercentage = totalTasks === 0
    ? 0
    : Math.round((completedTasks / totalTasks) * 100);

  return (
    <section className="rounded-[24px] border border-[#E4E7F0] bg-[linear-gradient(135deg,#ffffff_0%,#f2f5ff_100%)] px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] motion-safe:animate-[fadeIn_300ms_ease-out] sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[34px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[38px] lg:text-[40px]">
            Socratic Question Bank
          </h1>
          <p className="mt-3 max-w-[760px] text-base leading-7 text-slate-600">
            Follow a structured path from syntax basics to integrated challenges.
          </p>
        </div>

        <div className="grid w-full gap-3 rounded-[18px] border border-[#E4E7F0] bg-white/80 p-4 shadow-sm sm:grid-cols-3 lg:w-[520px]">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
              Completed Tasks
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#101426]">
              {completedTasks} / {totalTasks}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
              Current Module
            </p>
            <p className="mt-1 truncate text-sm font-extrabold text-[#101426]">
              {currentModuleTitle}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-400">
              Learning Streak
            </p>
            <p className="mt-1 text-sm font-extrabold text-[#101426]">0 days</p>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[#EEF2FF] sm:col-span-3"
            role="progressbar"
            aria-label={`Overall thinking task completion: ${completionPercentage}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionPercentage}
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

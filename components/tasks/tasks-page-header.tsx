export function TasksPageHeader({
  completedTasks,
  totalTasks,
}: {
  completedTasks: number;
  totalTasks: number;
}) {
  return (
    <section className="rounded-[24px] border border-[#E4E7F0] bg-[linear-gradient(135deg,#ffffff_0%,#f2f5ff_100%)] px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] motion-safe:animate-[fadeIn_300ms_ease-out] sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[34px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[38px] lg:text-[40px]">
            Programming Tasks
          </h1>
          <p className="mt-3 max-w-[760px] text-base leading-7 text-slate-600">
            Practice programming concepts step by step with guidance from your
            Socratic AI tutor.
          </p>
        </div>

        <div className="w-full rounded-[18px] border border-[#E4E7F0] bg-white/80 p-5 shadow-sm lg:w-[320px]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-600">
              {completedTasks} of {totalTasks} tasks completed
            </p>
            <p className="text-sm font-extrabold text-[#6255f6]">40%</p>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
            role="progressbar"
            aria-label="Overall task completion: 40%"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={40}
          >
            <div className="h-full w-2/5 rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

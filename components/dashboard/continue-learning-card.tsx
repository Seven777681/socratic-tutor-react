import Link from "next/link";
import type { ContinueTask } from "@/types/dashboard";
import { ArrowRightIcon, CodeIcon } from "@/components/dashboard/dashboard-icons";

function difficultyLabel(difficulty: ContinueTask["difficulty"]) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

const progressClasses: Record<number, string> = {
  60: "w-3/5",
};

export function ContinueLearningCard({ task }: { task: ContinueTask }) {
  return (
    <section className="rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_18px_55px_rgba(78,91,130,0.09)] sm:p-7">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#6255f6]">Continue Learning</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-normal text-[#101426]">
            {task.title}
          </h2>
          <p className="mt-3 max-w-[620px] text-base leading-7 text-slate-600">
            {task.description}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
              Topic: {task.topic}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              Difficulty: {difficultyLabel(task.difficulty)}
            </span>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Last progress</span>
              <span>{task.progress}%</span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-[#EEF2FF]"
              role="progressbar"
              aria-label={`${task.title} progress: ${task.progress}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={task.progress}
            >
              <div
                className={`h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)] transition-[width] duration-300 ${progressClasses[task.progress]}`}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">
              Last studied: <span className="text-slate-700">{task.lastStudied}</span>
            </p>
            <Link
              href={task.href}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:translate-y-0"
            >
              Continue Task
              <ArrowRightIcon className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:w-[190px]">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-[#F5F7FF]">
            <div className="absolute inset-3 rounded-full border-[10px] border-[#E8ECFF]" />
            <div className="absolute inset-3 rounded-full border-[10px] border-[#6657F5] border-l-transparent border-b-transparent" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#6255f6] shadow-[0_16px_35px_rgba(78,91,130,0.12)]">
              <CodeIcon className="h-8 w-8" />
            </div>
            <span className="absolute -bottom-2 rounded-full border border-[#E4E7F0] bg-white px-3 py-1 text-xs font-bold text-[#101426] shadow-sm">
              {task.progress}%
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

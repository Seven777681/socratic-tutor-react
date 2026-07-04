import Link from "next/link";
import { ArrowRightIcon, CalendarIcon } from "@/components/dashboard/dashboard-icons";

export function TodayGoalCard() {
  return (
    <section className="rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_18px_55px_rgba(78,91,130,0.09)] sm:p-7">
      <div className="flex h-full flex-col">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <CalendarIcon className="h-6 w-6" />
        </span>

        <div className="mt-5">
          <p className="text-sm font-semibold text-[#6255f6]">Today&apos;s Goal</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-normal text-[#101426]">
            Complete 2 programming tasks
          </h2>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Progress</span>
            <span>1 of 2 completed</span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-[#EEF2FF]"
            role="progressbar"
            aria-label="Today's goal progress: 1 of 2 completed"
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={1}
            >
              <div
                className="h-full w-1/2 rounded-full bg-[linear-gradient(90deg,#22C55E,#4F7CFF)] transition-[width] duration-300"
              />
            </div>
          </div>

        <Link
          href="/tasks"
          className="group mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-4 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] lg:mt-auto"
        >
          View Tasks
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}

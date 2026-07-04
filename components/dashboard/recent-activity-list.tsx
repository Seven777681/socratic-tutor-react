import Link from "next/link";
import type { RecentActivity } from "@/types/dashboard";
import { ArrowRightIcon } from "@/components/dashboard/dashboard-icons";
import { RecentActivityItem } from "@/components/dashboard/recent-activity-item";

export function RecentActivityList({
  activities,
}: {
  activities: RecentActivity[];
}) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-[#101426]">
            Recent Activity
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Pick up from the work you touched most recently.
          </p>
        </div>
        <Link
          href="/history"
          className="group hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 sm:inline-flex"
        >
          View History
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="overflow-hidden rounded-[20px] border border-[#E4E7F0] bg-white shadow-[0_16px_45px_rgba(78,91,130,0.08)]">
        {activities.map((activity, index) => (
          <RecentActivityItem
            key={activity.id}
            activity={activity}
            className={index > 0 ? "border-t border-[#E4E7F0]" : ""}
          />
        ))}
      </ul>
    </section>
  );
}

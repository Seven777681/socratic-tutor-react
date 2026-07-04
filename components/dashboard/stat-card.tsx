import type { DashboardStat } from "@/types/dashboard";
import {
  CheckCircleIcon,
  FlameIcon,
  TrendingUpIcon,
} from "@/components/dashboard/dashboard-icons";

const progressClasses: Record<number, string> = {
  40: "w-2/5",
};

function StatIcon({ icon }: { icon: DashboardStat["icon"] }) {
  const className = "h-5 w-5";

  if (icon === "completed") {
    return <CheckCircleIcon className={className} />;
  }

  if (icon === "streak") {
    return <FlameIcon className={className} />;
  }

  return <TrendingUpIcon className={className} />;
}

export function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="rounded-[18px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] transition duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_55px_rgba(78,91,130,0.12)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{stat.title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-normal text-[#101426]">
            {stat.value}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <StatIcon icon={stat.icon} />
        </span>
      </div>

      {typeof stat.progress === "number" ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Progress</span>
            <span>{stat.progress}%</span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
            role="progressbar"
            aria-label={`${stat.title}: ${stat.progress}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stat.progress}
          >
            <div
              className={`h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)] transition-[width] duration-300 ${progressClasses[stat.progress]}`}
            />
          </div>
        </div>
      ) : null}
    </article>
  );
}

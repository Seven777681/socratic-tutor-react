import type { DashboardStat } from "@/types/dashboard";
import {
  CheckCircleIcon,
  FileCodeIcon,
  FlameIcon,
  ListChecksIcon,
} from "@/components/dashboard/dashboard-icons";

function StatIcon({ icon }: { icon: DashboardStat["icon"] }) {
  const className = "h-5 w-5";

  if (icon === "files") {
    return <FileCodeIcon className={className} />;
  }

  if (icon === "questions") {
    return <ListChecksIcon className={className} />;
  }

  if (icon === "streak") {
    return <FlameIcon className={className} />;
  }

  return <CheckCircleIcon className={className} />;
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
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">
            {stat.description}
          </p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <StatIcon icon={stat.icon} />
        </span>
      </div>
    </article>
  );
}

import Link from "next/link";
import type { DashboardModule } from "@/types/dashboard";
import { ArrowRightIcon } from "@/components/dashboard/dashboard-icons";
import { CourseModuleCard } from "@/components/dashboard/course-module-card";

export function CourseModules({ modules }: { modules: DashboardModule[] }) {
  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-[#101426]">
            Course Modules
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Build each programming skill step by step.
          </p>
        </div>
        <Link
          href="/tasks"
          className="group hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 sm:inline-flex"
        >
          View All Tasks
          <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {modules.map((module) => (
          <CourseModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  );
}

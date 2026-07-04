import { Suspense } from "react";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TasksPageContent } from "@/components/tasks/tasks-page-content";
import { mockTasks } from "@/data/tasks";

function TasksLoadingState() {
  return (
    <div className="rounded-[24px] border border-[#E4E7F0] bg-white px-6 py-12 text-center shadow-[0_22px_70px_rgba(78,91,130,0.10)]">
      <p className="text-sm font-bold text-slate-500">Loading tasks...</p>
    </div>
  );
}

export default function TasksPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <DashboardHeader activeItem="tasks" />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9 xl:px-16">
        <Suspense fallback={<TasksLoadingState />}>
          <TasksPageContent tasks={mockTasks} />
        </Suspense>
        <DashboardFooter />
      </div>
    </main>
  );
}

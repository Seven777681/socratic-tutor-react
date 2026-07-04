import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRightIcon } from "@/components/dashboard/dashboard-icons";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  difficultyLabels,
  statusLabels,
  topicLabels,
} from "@/components/tasks/task-formatters";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { mockTasks } from "@/data/tasks";

export function generateStaticParams() {
  return mockTasks.map((task) => ({
    taskId: task.id,
  }));
}

export default function TaskDetailPage({
  params,
}: {
  params: { taskId: string };
}) {
  const task = mockTasks.find((item) => item.id === params.taskId);

  if (!task) {
    notFound();
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <DashboardHeader activeItem="tasks" />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9 xl:px-16">
        <section className="rounded-[24px] border border-[#E4E7F0] bg-white px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] sm:px-8">
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            <ArrowRightIcon className="h-4 w-4 rotate-180" />
            Back to Tasks
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#6255f6]">
                Task {String(task.taskNumber).padStart(2, "0")}
              </p>
              <h1 className="mt-3 text-[32px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[38px]">
                {task.title}
              </h1>
              <p className="mt-3 max-w-[760px] text-base leading-7 text-slate-600">
                {task.description}
              </p>
            </div>
            <TaskStatusBadge status={task.status} />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[18px] border border-[#E4E7F0] bg-[#F8FAFF] p-4">
              <p className="text-xs font-bold text-slate-500">Topic</p>
              <p className="mt-2 text-lg font-extrabold text-[#101426]">
                {topicLabels[task.topic]}
              </p>
            </div>
            <div className="rounded-[18px] border border-[#E4E7F0] bg-[#F8FAFF] p-4">
              <p className="text-xs font-bold text-slate-500">Difficulty</p>
              <p className="mt-2 text-lg font-extrabold text-[#101426]">
                {difficultyLabels[task.difficulty]}
              </p>
            </div>
            <div className="rounded-[18px] border border-[#E4E7F0] bg-[#F8FAFF] p-4">
              <p className="text-xs font-bold text-slate-500">Progress</p>
              <p className="mt-2 text-lg font-extrabold text-[#101426]">
                {task.status === "locked"
                  ? statusLabels.locked
                  : `${task.progress}% complete`}
              </p>
            </div>
          </div>
        </section>

        <DashboardFooter />
      </div>
    </main>
  );
}

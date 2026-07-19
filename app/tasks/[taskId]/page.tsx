import { getTaskDetail } from "@/data/task-details";
import { devDemoTasks } from "@/data/dev-demo-tasks";
import { TaskNotFound } from "@/components/workspace/task-not-found";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { ImportedTaskWorkspace } from "@/components/workspace/imported-task-workspace";
import { isDemoTasksEnabled } from "@/lib/imported-tasks-storage";

export function generateStaticParams() {
  if (!isDemoTasksEnabled()) {
    return [];
  }

  return devDemoTasks.map((task) => ({ taskId: task.id }));
}

export default function TaskWorkspacePage({
  params,
}: {
  params: { taskId: string };
}) {
  const task = isDemoTasksEnabled() ? getTaskDetail(params.taskId) : undefined;

  if (!task) {
    return <ImportedTaskWorkspace taskId={params.taskId} />;
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden text-[#101426]">
      <WorkspaceHeader task={task} />
      <WorkspaceLayout task={task} />
    </main>
  );
}

export const dynamicParams = true;

export const metadata = {
  title: "Programming Workspace - Socratic AI Tutor",
};

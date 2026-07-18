import { getTaskDetail } from "@/data/task-details";
import { mockTasks } from "@/data/tasks";
import { TaskNotFound } from "@/components/workspace/task-not-found";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";
import { ImportedTaskWorkspace } from "@/components/workspace/imported-task-workspace";

export function generateStaticParams() {
  return mockTasks.map((task) => ({
    taskId: task.id,
  }));
}

export default function TaskWorkspacePage({
  params,
}: {
  params: { taskId: string };
}) {
  const task = getTaskDetail(params.taskId);

  if (!task) {
    if (params.taskId.startsWith("imported-task-")) {
      return <ImportedTaskWorkspace taskId={params.taskId} />;
    }

    return <TaskNotFound />;
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

import { getQuestionBankTaskById, questionBankTasks } from "@/data/question-bank";
import { TaskNotFound } from "@/components/workspace/task-not-found";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceLayout } from "@/components/workspace/workspace-layout";

export function generateStaticParams() {
  return questionBankTasks.map((task) => ({ taskId: task.id }));
}

export default function TaskWorkspacePage({
  params,
}: {
  params: { taskId: string };
}) {
  const task = getQuestionBankTaskById(params.taskId);

  if (!task) {
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

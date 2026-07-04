import type { ProgrammingTaskSummary } from "@/types/task";
import { TaskCard } from "@/components/tasks/task-card";

export function TaskGrid({ tasks }: { tasks: ProgrammingTaskSummary[] }) {
  return (
    <section
      className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3"
      aria-label="Programming task list"
    >
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </section>
  );
}

import type { ProgrammingTaskDetail } from "@/types/task";
import {
  CheckCircleIcon,
  LightbulbIcon,
  ListChecksIcon,
  TargetIcon,
} from "@/components/dashboard/dashboard-icons";
import { TaskExample } from "@/components/workspace/task-example";
import { TaskPanelHeader } from "@/components/workspace/task-panel-header";
import { TaskProgressSummary } from "@/components/workspace/task-progress-summary";
import { TaskSection } from "@/components/workspace/task-section";

export function TaskProblemPanel({ task }: { task: ProgrammingTaskDetail }) {
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-[#E4E7F0] bg-white shadow-[0_14px_40px_rgba(78,91,130,0.06)] lg:rounded-r-[20px]">
      <TaskPanelHeader task={task} />

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <TaskSection title="Problem" defaultOpen>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#101426]">
                Problem Description
              </h3>
              <div className="mt-3 space-y-3 text-[15px] leading-[1.6] text-slate-600">
                {task.description.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </TaskSection>

        <TaskSection title="Learning Objectives">
          <div className="rounded-xl border border-[#E4E7F0] bg-[#F8FAFF] p-3">
            <ul className="grid gap-3">
              {task.learningObjectives.map((objective) => (
                <li
                  key={objective}
                  className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                >
                  <TargetIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6255f6]" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        </TaskSection>

        <TaskSection title="Input & Output">
          <div className="grid gap-3">
            <div className="rounded-xl border border-[#E4E7F0] bg-[#F8FAFF] p-3">
              <h3 className="text-sm font-extrabold text-[#101426]">Input</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {task.inputDescription}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-sm text-[#101426]">
                <code>5</code>
              </pre>
            </div>
            <div className="rounded-xl border border-[#E4E7F0] bg-[#F8FAFF] p-3">
              <h3 className="text-sm font-extrabold text-[#101426]">Output</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {task.outputDescription}
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-[#E4E7F0] bg-white px-3 py-2 text-sm text-[#101426]">
                <code>15</code>
              </pre>
            </div>
          </div>
        </TaskSection>

        <TaskSection title="Examples" defaultOpen>
          <div className="grid gap-3">
            {task.examples.map((example, index) => (
              <TaskExample
                key={example.id}
                example={example}
                label={`Example ${index + 1}`}
              />
            ))}
          </div>
        </TaskSection>

        <TaskSection title="Constraints">
          <ul className="grid gap-3">
            {task.constraints.map((constraint) => (
              <li
                key={constraint}
                className="flex items-start gap-2 text-sm leading-6 text-slate-600"
              >
                <ListChecksIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#6255f6]" />
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        </TaskSection>

        {task.helpfulReminder ? (
          <TaskSection title="Helpful Reminder">
            <div className="rounded-xl border border-[#cfc9ff] bg-[#f4f2ff] p-3">
              <div className="flex items-start gap-3">
                <LightbulbIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#6255f6]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#101426]">
                    Helpful Reminder
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {task.helpfulReminder}
                  </p>
                </div>
              </div>
            </div>
          </TaskSection>
        ) : null}

        <section className="rounded-[16px] border border-[#E4E7F0] bg-white p-4">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-[#101426]">
            <CheckCircleIcon className="h-4 w-4 text-[#6255f6]" />
            Starter Note
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the editor area to write your solution in Python. The full code
            editor will be available in the next step.
          </p>
        </section>

        <TaskProgressSummary task={task} />
      </div>
    </aside>
  );
}

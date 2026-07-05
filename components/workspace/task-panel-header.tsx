import type { ProgrammingTaskDetail } from "@/types/task";
import {
  ClockIcon,
  GaugeIcon,
  ModuleIconView,
} from "@/components/dashboard/dashboard-icons";
import {
  difficultyLabels,
  statusLabels,
  topicLabels,
} from "@/components/tasks/task-formatters";

export function TaskPanelHeader({ task }: { task: ProgrammingTaskDetail }) {
  return (
    <div className="border-b border-[#E4E7F0] p-5">
      <p className="text-sm font-extrabold text-[#6255f6]">
        Task {String(task.taskNumber).padStart(2, "0")}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-normal text-[#101426]">
        {task.title}
      </h2>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceaff] px-3 py-1 text-xs font-bold text-[#6255f6]">
          <ModuleIconView icon="refresh" className="h-3.5 w-3.5" />
          {topicLabels[task.topic]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          <GaugeIcon className="h-3.5 w-3.5" />
          {difficultyLabels[task.difficulty]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          <ClockIcon className="h-3.5 w-3.5" />
          {task.estimatedMinutes} min
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold">
          <span className="rounded-full bg-[#eceaff] px-3 py-1 text-xs text-[#6255f6]">
            {statusLabels[task.status]}
          </span>
          <span className="text-slate-600">{task.progress}% complete</span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
          role="progressbar"
          aria-label={`${task.title} progress: ${task.progress}% complete`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={task.progress}
        >
          <div className="h-full w-3/5 rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]" />
        </div>
      </div>
    </div>
  );
}

import type { ProgrammingTaskDetail } from "@/types/task";
import {
  BotIcon,
  PlayCircleIcon,
  SaveIcon,
} from "@/components/dashboard/dashboard-icons";

export function TaskProgressSummary({
  task,
}: {
  task: ProgrammingTaskDetail;
}) {
  return (
    <section className="rounded-[18px] border border-[#E4E7F0] bg-[#F8FAFF] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-[#101426]">Your Progress</h3>
        <p className="text-sm font-bold text-[#6255f6]">{task.progress}% complete</p>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]"
        role="progressbar"
        aria-label={`Your progress: ${task.progress}% complete`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={task.progress}
      >
        <div className="h-full w-3/5 rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]" />
      </div>
      <div className="mt-4 grid gap-2 text-sm font-medium text-slate-600">
        <p className="flex items-center gap-2">
          <PlayCircleIcon className="h-4 w-4 text-[#6255f6]" />
          {task.codeRuns} code runs
        </p>
        <p className="flex items-center gap-2">
          <BotIcon className="h-4 w-4 text-[#6255f6]" />
          {task.tutorInteractions} tutor interactions
        </p>
        <p className="flex items-center gap-2">
          <SaveIcon className="h-4 w-4 text-[#6255f6]" />
          Last saved {task.lastSaved}
        </p>
      </div>
    </section>
  );
}

import Link from "next/link";
import { questionBankModules } from "@/data/question-bank";
import { getGeneratedTaskSummaries } from "@/lib/imported-tasks-storage";
import { ArrowRightIcon, BookOpenIcon } from "@/components/dashboard/dashboard-icons";

export function LearningPath() {
  const tasks = getGeneratedTaskSummaries().filter(
    (task) => task.sourceType === "question_bank",
  );

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-normal text-[#101426]">
            Learning Path
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Follow the recommended path or jump into a module when you are ready.
          </p>
        </div>
        <Link
          href="/tasks"
          className="hidden rounded-lg px-3 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 sm:inline-flex"
        >
          Browse Question Bank
        </Link>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {questionBankModules.map((module) => {
          const moduleTasks = tasks.filter((task) => task.moduleId === module.id);
          const completed = moduleTasks.filter((task) => task.status === "completed").length;
          const progress = moduleTasks.length
            ? Math.round((completed / moduleTasks.length) * 100)
            : 0;
          const nextTask =
            moduleTasks.find((task) => task.status !== "completed") ?? moduleTasks[0];

          return (
            <article
              key={module.id}
              className="flex min-h-[310px] flex-col rounded-[18px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
                <BookOpenIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-extrabold tracking-normal text-[#101426]">
                {module.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {module.description}
              </p>
              <div className="mt-4 space-y-2 text-xs font-bold text-slate-500">
                <p>{moduleTasks.length} tasks</p>
                <p>{module.difficultyRange}</p>
                <p className="text-[#6255f6]">Socratic AI Tutor support</p>
              </div>
              <div className="mt-auto pt-4">
                <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#EEF2FF]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#6657f5,#4F7CFF)]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <Link
                  href={nextTask?.href ?? "/tasks"}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-3 text-sm font-bold text-[#6255f6] hover:bg-indigo-50/70"
                >
                  {progress > 0 ? "Continue" : "Start"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

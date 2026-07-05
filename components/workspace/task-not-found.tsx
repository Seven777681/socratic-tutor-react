import Link from "next/link";
import { ArrowRightIcon, SearchXIcon } from "@/components/dashboard/dashboard-icons";
import { WorkspaceHeaderShell } from "@/components/workspace/workspace-header-shell";

export function TaskNotFound() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <WorkspaceHeaderShell />
      <div className="mx-auto flex min-h-[calc(100dvh-68px)] w-full max-w-[900px] items-center px-5 py-10">
        <section className="w-full rounded-[24px] border border-[#E4E7F0] bg-white px-6 py-12 text-center shadow-[0_22px_70px_rgba(78,91,130,0.10)]">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
            <SearchXIcon className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-normal text-[#101426]">
            Task not found
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            The requested programming task could not be found.
          </p>
          <Link
            href="/tasks"
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Back to Tasks
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}

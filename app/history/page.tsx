import Link from "next/link";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  ArrowRightIcon,
  HistoryIcon,
} from "@/components/dashboard/dashboard-icons";

export default function HistoryPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <DashboardHeader activeItem="history" />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9 xl:px-16">
        <section className="rounded-[24px] border border-[#E4E7F0] bg-white p-6 shadow-[0_22px_70px_rgba(78,91,130,0.10)] sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
            <HistoryIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-[34px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[40px]">
            History
          </h1>
          <p className="mt-3 max-w-[720px] text-base leading-7 text-slate-600">
            Review your imported files, generated tasks, and tutor activity as
            this prototype grows.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#b9b2ff] bg-white px-4 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Back to Dashboard
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </section>

        <DashboardFooter />
      </div>
    </main>
  );
}

export const metadata = {
  title: "History - Socratic AI Tutor",
};

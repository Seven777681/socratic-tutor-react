import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AssignmentImportPage } from "@/components/imports/assignment-import-page";

export default function AssignmentImportRoutePage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <DashboardHeader activeItem="assignment-import" />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9 xl:px-16">
        <AssignmentImportPage />
        <DashboardFooter />
      </div>
    </main>
  );
}

export const metadata = {
  title: "Assignment Import - Socratic AI Tutor",
};

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <DashboardHeader />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9 xl:px-16">
        <DashboardContent />
      </div>
    </main>
  );
}

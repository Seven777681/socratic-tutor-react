"use client";

import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { QuickUploadCard } from "@/components/dashboard/quick-upload-card";
import { RecentUploads } from "@/components/dashboard/recent-uploads";
import { StatCard } from "@/components/dashboard/stat-card";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useDashboardUploads } from "@/hooks/use-dashboard-uploads";
import { continueTask } from "@/data/dashboard";

export function DashboardContent() {
  const dashboardStats = useDashboardStats();
  const { uploads } = useDashboardUploads();

  return (
    <div className="space-y-7">
      <WelcomeSection />

      <section
        className="grid gap-5 md:grid-cols-3"
        aria-label="Learning overview"
      >
        {dashboardStats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,65fr)_minmax(320px,35fr)]">
        <ContinueLearningCard task={continueTask} />
        <QuickUploadCard />
      </section>

      <RecentUploads uploads={uploads} />

      <DashboardFooter />
    </div>
  );
}

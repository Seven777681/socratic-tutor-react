"use client";

import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { MultiAgentPreview } from "@/components/dashboard/multi-agent-preview";
import { StatCard } from "@/components/dashboard/stat-card";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AiTutorIntroduction } from "@/components/dashboard/ai-tutor-introduction";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useDashboardLearning } from "@/hooks/use-dashboard-learning";

export function DashboardContent() {
  const dashboardStats = useDashboardStats();
  const { task } = useDashboardLearning();

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
        <ContinueLearningCard task={task} />
        <MultiAgentPreview />
      </section>

      <RecentActivity />

      <AiTutorIntroduction />

      <DashboardFooter />
    </div>
  );
}

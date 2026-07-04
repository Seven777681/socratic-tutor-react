import { ContinueLearningCard } from "@/components/dashboard/continue-learning-card";
import { CourseModules } from "@/components/dashboard/course-modules";
import { DashboardFooter } from "@/components/dashboard/dashboard-footer";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodayGoalCard } from "@/components/dashboard/today-goal-card";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import {
  continueTask,
  courseModules,
  dashboardStats,
  recentActivities,
} from "@/data/dashboard";

export default function DashboardPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-[#101426]">
      <DashboardHeader />

      <div className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-8 lg:px-12 lg:py-9 xl:px-16">
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
            <TodayGoalCard />
          </section>

          <CourseModules modules={courseModules} />

          <section className="grid gap-5 lg:grid-cols-[minmax(0,65fr)_minmax(280px,35fr)]">
            <RecentActivityList activities={recentActivities} />
            <QuickActions />
          </section>

          <DashboardFooter />
        </div>
      </div>
    </main>
  );
}

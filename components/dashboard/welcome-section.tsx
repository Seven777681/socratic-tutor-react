"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowRightIcon } from "@/components/dashboard/dashboard-icons";
import { getGeneratedTaskSummaries } from "@/lib/imported-tasks-storage";

function getTimeGreeting(hour: number) {
  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

export function WelcomeSection() {
  const greeting = useMemo(() => getTimeGreeting(new Date().getHours()), []);
  const recommendedTask = useMemo(() => {
    const tasks = getGeneratedTaskSummaries();
    return tasks.find((task) => task.status !== "completed") ?? tasks[0];
  }, []);

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#E4E7F0] bg-[linear-gradient(135deg,#ffffff_0%,#f2f5ff_100%)] px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] motion-safe:animate-[fadeIn_300ms_ease-out] sm:px-8 lg:px-9">
      <div className="flex items-center justify-between gap-8 lg:gap-10">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#6255f6]">{greeting}</p>
          <h1 className="mt-3 max-w-[760px] text-[30px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[34px] lg:text-4xl">
            Start your guided coding path
          </h1>
          <p className="mt-3 max-w-[560px] text-base leading-7 text-slate-600">
            Choose a question set and learn with multi-agent Socratic support.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={recommendedTask?.href ?? "/tasks"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200/80"
            >
              Start Recommended Task
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/tasks"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#b9b2ff] bg-white px-4 text-sm font-bold text-[#6255f6]"
            >
              Browse Question Bank
            </Link>
          </div>
        </div>

        <div className="relative hidden min-h-[210px] w-[250px] shrink-0 items-center justify-center md:flex lg:w-[300px]">
          <div className="absolute inset-4 rounded-full bg-[#dfe7ff]/70 blur-3xl" />
          <Image
            src="/images/login-robot.png"
            alt="Small AI robot programming illustration"
            width={480}
            height={320}
            priority
            className="relative h-auto w-[240px] object-contain drop-shadow-[0_22px_38px_rgba(95,102,245,0.16)] lg:w-[280px]"
          />
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useMemo } from "react";

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

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#E4E7F0] bg-[linear-gradient(135deg,#ffffff_0%,#f2f5ff_100%)] px-6 py-7 shadow-[0_22px_70px_rgba(78,91,130,0.10)] motion-safe:animate-[fadeIn_300ms_ease-out] sm:px-8 lg:px-9">
      <div className="flex items-center justify-between gap-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#6255f6]">{greeting}</p>
          <h1 className="mt-3 max-w-[760px] text-[30px] font-extrabold leading-tight tracking-normal text-[#101426] sm:text-[34px] lg:text-4xl">
            Welcome back, Student 001
          </h1>
          <p className="mt-3 max-w-[560px] text-base leading-7 text-slate-600">
            Ready to continue your programming journey?
          </p>
        </div>

        <div className="hidden shrink-0 md:block">
          <Image
            src="/images/login-robot.png"
            alt="Small AI robot programming illustration"
            width={360}
            height={240}
            priority
            className="h-auto w-[180px] object-contain drop-shadow-[0_18px_32px_rgba(95,102,245,0.14)] lg:w-[210px]"
          />
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { BrandPanel } from "@/components/auth/brand-panel";
import { LanguageSelector } from "@/components/auth/language-selector";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_52%,#f8fbff_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-[380px] w-[380px] rounded-full bg-[#b9a8ff]/35 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-[#9fd8ff]/32 blur-3xl" />
        <div className="absolute left-[42%] top-[18%] hidden h-[260px] w-[260px] rounded-full bg-white/50 blur-3xl md:block" />
        <div className="absolute inset-0 opacity-[0.32] [background-image:linear-gradient(rgba(98,85,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(98,85,246,0.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1720px] gap-8 px-5 pb-10 pt-7 sm:px-8 md:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] md:gap-12 md:px-12 md:pb-12 md:pt-8 lg:gap-16 lg:px-16 xl:px-[72px]">
        <BrandPanel />

        <section className="flex min-w-0 flex-col md:items-center md:justify-center">
          <div className="flex w-full max-w-[520px] flex-col md:items-stretch">
            <div className="mb-5 hidden self-end md:block">
              <LanguageSelector />
            </div>

            <div className="relative">
              <div className="absolute inset-4 -z-10 rounded-[28px] bg-[#6657f5]/18 blur-3xl" />
              <div className="w-full rounded-[24px] border border-white/80 bg-white/90 px-6 py-7 shadow-[0_28px_90px_rgba(78,91,130,0.16)] backdrop-blur sm:px-10 md:px-10 md:py-9 xl:px-12">
                <div className="mb-7 text-center">
                  <span className="inline-flex rounded-full border border-indigo-100 bg-[#eceaff] px-3 py-1 text-xs font-extrabold text-[#6255f6]">
                    Multi-Agent Coding Tutor
                  </span>
                  <h2 className="mt-3 text-[32px] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-[34px] lg:text-[36px]">
                    Code with Guidance
                  </h2>
                  <p className="mt-2.5 text-sm leading-6 text-slate-500">
                    Sign in to practice with Socratic guidance.
                  </p>
                </div>

                <LoginForm />
              </div>

              <div className="mt-5 px-2 text-center text-xs leading-6 text-slate-500">
                <p>
                  By signing in, you agree to the{" "}
                  <Link
                    href="/privacy-policy"
                    className="rounded-md font-bold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                  >
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/terms-of-service"
                    className="rounded-md font-bold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                  >
                    Terms of Service
                  </Link>
                  .
                </p>
                <Link
                  href="/study-notice"
                  className="mt-1 inline-flex rounded-md font-bold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                >
                  Study Notice
                </Link>
              </div>
            </div>

            <div className="mt-10 flex w-full justify-center md:hidden">
              <Image
                src="/images/login-robot.png"
                alt="AI robot programming illustration"
                width={1200}
                height={800}
                priority
                className="h-auto w-full max-w-[340px] object-contain drop-shadow-[0_26px_40px_rgba(95,102,245,0.14)]"
              />
            </div>

            <p className="mt-8 pb-2 text-center text-xs text-slate-400">
              Copyright (c) 2026 Socratic AI Programming Tutor.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

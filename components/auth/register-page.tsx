import Link from "next/link";
import Image from "next/image";
import { BrandPanel } from "@/components/auth/brand-panel";
import { FeatureItem } from "@/components/auth/feature-item";
import { LanguageSelector } from "@/components/auth/language-selector";
import { RegisterForm } from "@/components/auth/register-form";

const footerFeatures = [
  {
    title: "Upload & Generate",
    description: "Turn class files into guided coding tasks",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M12 3v10M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14v4a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Socratic Guidance",
    description: "Learn through questions, not shortcuts",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1.4-2.1 1.8-2.6 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    title: "Practice Safely",
    description: "Build confidence with scaffolded tasks",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="m9 12 2 2 4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function RegisterPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto grid w-full max-w-[1720px] gap-8 px-5 pb-10 pt-7 sm:px-8 md:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] md:gap-12 md:px-12 md:pb-12 md:pt-8 lg:gap-16 lg:px-16 xl:px-[72px]">
        <BrandPanel
          title="Create your learning space."
          highlight="Start with guidance."
          description="Upload class files, generate programming tasks, and learn through Socratic questions."
        />

        <section className="flex min-w-0 flex-col md:items-center md:justify-center">
          <div className="flex w-full max-w-[520px] flex-col md:items-stretch">
            <div className="mb-5 hidden self-end md:block">
              <LanguageSelector />
            </div>

            <div className="w-full rounded-[24px] border border-[#dce3f4] bg-white px-6 py-8 shadow-[0_28px_90px_rgba(78,91,130,0.12)] sm:px-10 md:px-10 md:py-10 xl:px-12 xl:py-11">
              <div className="mb-7 text-center">
                <h2 className="text-3xl font-extrabold tracking-normal text-slate-950 lg:text-[34px]">
                  Create Account
                </h2>
                <p className="mt-2.5 text-base leading-6 text-slate-600">
                  Register to generate Socratic programming tasks from your class files.
                </p>
              </div>

              <RegisterForm />

              <p className="mt-6 text-center text-sm leading-7 text-slate-500">
                By creating an account, you agree to our
                <br />
                <Link
                  href="#"
                  className="rounded-md font-bold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="rounded-md font-bold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                >
                  Terms of Service
                </Link>
              </p>

              <div className="mt-3 flex justify-center text-sm">
                <Link
                  href="#"
                  className="rounded-md font-bold text-[#6255f6] underline-offset-4 transition hover:text-[#4b78ff] hover:underline focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                >
                  Study Notice
                </Link>
              </div>
            </div>

            <div className="mt-12 flex w-full justify-center md:hidden">
              <Image
                src="/images/login-robot.png"
                alt="AI robot programming illustration"
                width={1200}
                height={800}
                priority
                className="h-auto w-full max-w-[460px] object-contain drop-shadow-[0_26px_40px_rgba(95,102,245,0.14)]"
              />
            </div>

            <ul className="mt-11 grid w-full grid-cols-1 gap-5 sm:grid-cols-3 md:mt-12 md:gap-6">
              {footerFeatures.map((feature) => (
                <FeatureItem key={feature.title} {...feature} />
              ))}
            </ul>

            <p className="mt-10 pb-2 text-center text-xs text-slate-400">
              Copyright (c) 2026 Socratic AI Programming Tutor.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

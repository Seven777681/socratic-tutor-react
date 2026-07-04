import Link from "next/link";
import Image from "next/image";
import { BrandPanel } from "@/components/auth/brand-panel";
import { FeatureItem } from "@/components/auth/feature-item";
import { LoginForm } from "@/components/auth/login-form";

function LanguageSelector() {
  return (
    <button
      type="button"
      className="flex h-12 items-center gap-3 rounded-[10px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/30 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
      aria-label="Select language"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M3 12h18M12 3c2.2 2.4 3.4 5.4 3.4 9S14.2 18.6 12 21c-2.2-2.4-3.4-5.4-3.4-9S9.8 5.4 12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      English
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path
          d="m7 10 5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

const footerFeatures = [
  {
    title: "Privacy First",
    description: "Your data is secure and protected",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M12 3 5 6v5c0 4.4 2.8 8.4 7 10 4.2-1.6 7-5.6 7-10V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Socratic Method",
    description: "Guiding questions lead to deeper understanding",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M9 4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4M15 4a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4M9 4v16M15 4v16M9 9H6M18 9h-3M9 15H6M18 15h-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Practice & Learn",
    description: "Hands-on coding with instant feedback",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="m9 8-4 4 4 4M15 8l4 4-4 4M13 5l-2 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function LoginPage() {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] text-slate-950">
      <div className="mx-auto grid w-full max-w-[1720px] gap-10 px-5 pb-10 pt-8 sm:px-8 md:grid-cols-[minmax(0,43fr)_minmax(0,57fr)] md:gap-12 md:px-12 md:pb-12 md:pt-9 lg:gap-16 lg:px-16 xl:px-[72px]">
        <BrandPanel />

        <section className="flex min-w-0 flex-col md:items-center">
          <div className="flex w-full max-w-[520px] flex-col md:items-stretch">
            <div className="mb-5 hidden self-end md:block">
              <LanguageSelector />
            </div>

            <div className="w-full rounded-[20px] border border-[#dce3f4] bg-white px-6 py-8 shadow-[0_28px_90px_rgba(78,91,130,0.12)] sm:px-10 md:px-10 md:py-10 xl:px-12 xl:py-11">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold tracking-normal text-slate-950 lg:text-[34px]">
                  Welcome Back
                </h2>
                <p className="mt-2.5 text-base leading-6 text-slate-600">
                  Sign in to continue your learning journey.
                </p>
              </div>

              <LoginForm />

              <p className="mt-8 text-center text-sm leading-6 text-slate-500">
                By signing in, you agree to our
                <br />
                <Link
                  href="#"
                  className="font-medium text-[#6255f6] hover:text-[#4b78ff] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="font-medium text-[#6255f6] hover:text-[#4b78ff] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
                >
                  Terms of Service
                </Link>
              </p>

              <div className="mt-4 flex justify-center text-sm">
                <Link
                  href="#"
                  className="font-medium text-[#6255f6] hover:text-[#4b78ff] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
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
                className="h-auto w-full max-w-[520px] object-contain drop-shadow-[0_26px_40px_rgba(95,102,245,0.14)]"
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

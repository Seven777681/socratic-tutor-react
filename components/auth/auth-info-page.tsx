import Link from "next/link";
import type { ReactNode } from "react";

type InfoSection = {
  title: string;
  body: string;
};

type AuthInfoPageProps = {
  title: string;
  subtitle?: string;
  sections?: InfoSection[];
  children?: ReactNode;
};

function RobotLogo() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7667ff,#4f7cff)] shadow-md shadow-indigo-200">
      <span className="absolute -bottom-0.5 right-1 h-2.5 w-2.5 rounded-sm bg-[#5f66f5]" />
      <svg aria-hidden="true" viewBox="0 0 32 32" className="relative h-7 w-7 text-white" fill="none">
        <rect x="7" y="10" width="18" height="13" rx="6" fill="currentColor" />
        <path d="M16 8V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="4.5" r="2" fill="#8be4ff" />
        <circle cx="13" cy="16.5" r="1.7" fill="#5b63f6" />
        <circle cx="19" cy="16.5" r="1.7" fill="#5b63f6" />
        <path d="M10 17h-3M25 17h-3" stroke="#dce7ff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AuthInfoPage({
  title,
  subtitle,
  sections = [],
  children,
}: AuthInfoPageProps) {
  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[linear-gradient(135deg,#f7f8ff_0%,#eef2ff_100%)] px-5 py-7 text-slate-950 sm:px-8">
      <div className="mx-auto flex w-full max-w-[920px] flex-col">
        <Link
          href="/login"
          className="flex w-fit items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
        >
          <RobotLogo />
          <p className="text-lg font-bold tracking-normal text-slate-950">
            Socratic <span className="text-[#6255f6]">AI</span> Tutor
          </p>
        </Link>

        <section className="mt-10 rounded-[24px] border border-[#dce3f4] bg-white px-6 py-8 shadow-[0_28px_90px_rgba(78,91,130,0.12)] sm:px-10 sm:py-10">
          <div className="mx-auto max-w-[720px]">
            <h1 className="text-[32px] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-[40px]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-base leading-7 text-slate-600">
                {subtitle}
              </p>
            ) : null}

            {children ? <div className="mt-7">{children}</div> : null}

            {sections.length ? (
              <div className="mt-8 space-y-5">
                {sections.map((section, index) => (
                  <article
                    key={section.title}
                    className="rounded-2xl border border-[#E4E7F0] bg-[#FBFCFF] p-5"
                  >
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#6255f6]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <h2 className="mt-2 text-lg font-extrabold tracking-normal text-[#101426]">
                      {section.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                      {section.body}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}

            <Link
              href="/login"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-5 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
            >
              Back to Sign in
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

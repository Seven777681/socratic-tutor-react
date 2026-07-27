import Image from "next/image";

type BrandFeatureCard = {
  title: string;
  description: string;
  className: string;
  icon: JSX.Element;
};

const featureCards: BrandFeatureCard[] = [
  {
    title: "Multi-Agent Guidance",
    description: "Get help from Socratic, Debug, Strategy, Test, and Reflection agents.",
    className: "md:left-0 md:bottom-10 lg:left-2",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="5" y="7" width="14" height="11" rx="5" stroke="currentColor" strokeWidth="2" />
        <path d="M12 7V4M8.5 12h.01M15.5 12h.01M9 21h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Structured Question Bank",
    description: "Practice Python tasks step by step.",
    className: "md:right-0 md:top-8 lg:right-4",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M12 6.5C10.7 5.5 8.8 5 6 5H4v14h2c2.8 0 4.7.5 6 1.5M12 6.5C13.3 5.5 15.2 5 18 5h2v14h-2c-2.8 0-4.7.5-6 1.5M12 6.5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Learn by Thinking",
    description: "Receive questions instead of direct answers.",
    className: "md:right-4 md:bottom-4 lg:right-10",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M9.1 9a3 3 0 1 1 5.8 1c-.5 1.4-2.1 1.8-2.6 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M21 12a8.5 8.5 0 0 1-12.9 7.3L3 20.5l1.2-4.6A8.5 8.5 0 1 1 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function RobotLogo() {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7667ff,#4f7cff)] shadow-md shadow-indigo-200">
      <span className="absolute -bottom-0.5 right-1 h-2.5 w-2.5 rounded-sm bg-[#5f66f5]" />
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="relative h-7 w-7 text-white"
        fill="none"
      >
        <rect x="7" y="10" width="18" height="13" rx="6" fill="currentColor" />
        <path
          d="M16 8V5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="16" cy="4.5" r="2" fill="#8be4ff" />
        <circle cx="13" cy="16.5" r="1.7" fill="#5b63f6" />
        <circle cx="19" cy="16.5" r="1.7" fill="#5b63f6" />
        <path
          d="M10 17h-3M25 17h-3"
          stroke="#dce7ff"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

const codeTokens = [
  { label: "{ }", className: "left-8 top-16" },
  { label: "< />", className: "right-14 top-28" },
  { label: "loop", className: "left-20 bottom-24" },
  { label: "?", className: "right-24 bottom-32" },
];

export function BrandPanel({
  title = "Think. Code. Grow.",
  highlight = "With Guidance.",
  description = "Your AI-powered Socratic tutor helps you think deeper, code better, and learn smarter.",
  features = featureCards,
  illustrationMinHeightClassName = "min-h-[360px] lg:min-h-[410px]",
  illustrationImageClassName = "max-w-[560px]",
}: {
  title?: string;
  highlight?: string;
  description?: string;
  features?: BrandFeatureCard[];
  illustrationMinHeightClassName?: string;
  illustrationImageClassName?: string;
}) {
  return (
    <section className="flex min-h-[calc(100dvh-96px)] text-slate-950 md:py-2">
      <div className="mx-auto flex w-full max-w-[660px] flex-col lg:mx-0">
        <div className="flex items-center gap-3 self-start">
          <RobotLogo />
          <p className="text-lg font-bold tracking-normal text-slate-950 lg:text-xl">
            Socratic <span className="text-[#6255f6]">AI</span> Tutor
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center py-7 md:-mt-2 md:py-8 lg:-mt-4">
          <div className="mb-4 flex w-fit flex-wrap gap-2 rounded-full border border-indigo-100 bg-white/60 px-3 py-1.5 text-xs font-extrabold text-[#6255f6] shadow-sm shadow-indigo-100/70 backdrop-blur">
            <span>Question Bank</span>
            <span className="text-slate-300">·</span>
            <span>Multi-Agent Tutor</span>
            <span className="text-slate-300">·</span>
            <span>Socratic Guidance</span>
          </div>

          <h1 className="max-w-[620px] text-[42px] font-extrabold leading-[1.08] tracking-normal text-slate-950 sm:text-[48px] lg:text-[56px] xl:text-[62px]">
            {title}
            <span className="mt-1 block bg-[linear-gradient(90deg,#725cff,#4b78ff)] bg-clip-text text-transparent">
              {highlight}
            </span>
          </h1>

          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.65] text-slate-600 lg:text-lg">
            {description}
          </p>

          <div className={`relative mt-6 hidden w-full items-center justify-center md:flex lg:mt-7 ${illustrationMinHeightClassName}`}>
            {codeTokens.map((token) => (
              <span
                key={token.label}
                className={`absolute rounded-full border border-indigo-100 bg-white/55 px-3 py-1 text-xs font-extrabold text-[#6255f6]/55 shadow-sm backdrop-blur ${token.className}`}
              >
                {token.label}
              </span>
            ))}
            <Image
              src="/images/login-robot.png"
              alt="AI robot programming illustration"
              width={1200}
              height={800}
              priority
              className={`h-auto w-full object-contain drop-shadow-[0_30px_48px_rgba(95,102,245,0.16)] ${illustrationImageClassName}`}
            />

            {features.map((feature) => (
              <article
                key={feature.title}
                className={`absolute w-[230px] rounded-2xl border border-white/75 bg-white/75 px-4 py-3 shadow-[0_16px_38px_rgba(78,91,130,0.12)] backdrop-blur ${feature.className}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eceaff] text-[#6255f6]">
                    {feature.icon}
                  </span>
                  <h2 className="text-sm font-extrabold leading-5 tracking-normal text-slate-950">
                    {feature.title}
                  </h2>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 md:hidden">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/70 bg-white/72 px-4 py-3.5 shadow-[0_14px_36px_rgba(78,91,130,0.10)] backdrop-blur"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eceaff] text-[#6255f6]">
                    {feature.icon}
                  </span>
                  <h2 className="text-sm font-extrabold leading-5 tracking-normal text-slate-950">
                    {feature.title}
                  </h2>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

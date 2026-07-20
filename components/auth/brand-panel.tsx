import Image from "next/image";

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

export function BrandPanel({
  title = "Think. Code. Grow.",
  highlight = "With Guidance.",
  description = "Your AI-powered Socratic tutor that helps you think deeper, code better, and learn smarter.",
}: {
  title?: string;
  highlight?: string;
  description?: string;
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

        <div className="flex flex-1 flex-col justify-center py-8 md:-mt-4 md:py-10 lg:-mt-6">
          <h1 className="max-w-[620px] text-[42px] font-extrabold leading-[1.08] tracking-normal text-slate-950 sm:text-[48px] lg:text-[56px] xl:text-[62px]">
            {title}
            <span className="mt-1 block bg-[linear-gradient(90deg,#725cff,#4b78ff)] bg-clip-text text-transparent">
              {highlight}
            </span>
          </h1>

          <p className="mt-5 max-w-[520px] text-[17px] leading-[1.65] text-slate-600 lg:text-lg">
            {description}
          </p>

          <div className="mt-8 hidden w-full justify-center md:flex lg:mt-9 lg:justify-center">
            <Image
              src="/images/login-robot.png"
              alt="AI robot programming illustration"
              width={1200}
              height={800}
              priority
              className="h-auto w-full max-w-[700px] object-contain drop-shadow-[0_30px_48px_rgba(95,102,245,0.16)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

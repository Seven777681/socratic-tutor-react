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

export function BrandPanel() {
  return (
    <section className="text-slate-950">
      <div className="mx-auto w-full max-w-[600px] lg:mx-0">
        <div className="flex items-center gap-3">
          <RobotLogo />
          <p className="text-lg font-bold tracking-normal text-slate-950 lg:text-xl">
            Socratic <span className="text-[#6255f6]">AI</span> Tutor
          </p>
        </div>

        <h1 className="mt-14 max-w-[580px] text-[42px] font-extrabold leading-[1.08] tracking-normal text-slate-950 sm:text-[48px] lg:mt-16 lg:text-[54px] xl:text-[58px]">
          Think. Code. Grow.
          <span className="mt-1 block bg-[linear-gradient(90deg,#725cff,#4b78ff)] bg-clip-text text-transparent">
            With Guidance.
          </span>
        </h1>

        <p className="mt-6 max-w-[500px] text-[17px] leading-[1.6] text-slate-600 lg:text-lg">
          Your AI-powered Socratic tutor that helps you think deeper, code
          better, and learn smarter.
        </p>

        <div className="mt-14 hidden w-full justify-center md:flex lg:justify-start">
          <Image
            src="/images/login-robot.png"
            alt="AI robot programming illustration"
            width={1200}
            height={800}
            priority
            className="h-auto w-full max-w-[540px] object-contain drop-shadow-[0_26px_40px_rgba(95,102,245,0.14)]"
          />
        </div>
      </div>
    </section>
  );
}

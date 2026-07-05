import Link from "next/link";
import { RobotLogo } from "@/components/dashboard/dashboard-icons";

export function WorkspaceHeaderShell() {
  return (
    <header className="h-[68px] border-b border-[#E4E7F0] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
        >
          <RobotLogo />
          <span className="truncate text-lg font-bold tracking-normal text-[#101426]">
            Socratic <span className="text-[#6255f6]">AI</span> Tutor
          </span>
        </Link>
      </div>
    </header>
  );
}

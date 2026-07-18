import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  RobotLogo,
} from "@/components/dashboard/dashboard-icons";

const actions = [
  {
    label: "Import Assignment",
    href: "/assignment-import",
    description: "Generate practice tasks from class files.",
    icon: <FileImportIcon className="h-5 w-5" />,
  },
  {
    label: "Browse Tasks",
    href: "/tasks",
    description: "Choose the next practice problem.",
    icon: <PlayCircleIcon className="h-5 w-5" />,
  },
  {
    label: "View History",
    href: "/history",
    description: "Review saved work and tutor sessions.",
    icon: <CheckCircleIcon className="h-5 w-5" />,
  },
  {
    label: "Update Profile",
    href: "/profile",
    description: "Manage your learning preferences.",
    icon: <RobotLogo />,
  },
];

export function QuickActions() {
  return (
    <section className="rounded-[20px] border border-[#E4E7F0] bg-white p-5 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-6">
      <h2 className="text-xl font-extrabold tracking-normal text-[#101426]">
        Quick Actions
      </h2>
      <div className="mt-4 grid gap-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-indigo-100 hover:bg-indigo-50/60 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
              {action.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#101426]">
                {action.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {action.description}
              </span>
            </span>
            <ArrowRightIcon className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#6255f6]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function FileImportIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M12 12v6M9 15l3-3 3 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

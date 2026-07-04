import type { SVGProps } from "react";
import type { ActivityAction, ModuleIcon } from "@/types/dashboard";

type IconProps = SVGProps<SVGSVGElement>;

function IconBase({ children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      {children}
    </svg>
  );
}

export function RobotLogo() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7667ff,#4f7cff)] shadow-md shadow-indigo-200">
      <span className="absolute -bottom-0.5 right-1 h-2.5 w-2.5 rounded-sm bg-[#5f66f5]" />
      <IconBase className="relative h-7 w-7 text-white">
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
      </IconBase>
    </span>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="m7 10 5 5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.7 21a2 2 0 0 1-3.4 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function XIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function TrendingUpIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 17h18M7 14l4-4 3 3 5-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6h4v4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function FlameIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M12 22c4 0 7-2.7 7-6.7 0-2.7-1.5-5.1-4.4-7.2-.3 1.6-1.1 2.8-2.3 3.8.1-2.7-1.3-5.5-4.2-8C8 7 5 9.5 5 15.1 5 19.3 8 22 12 22Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="m9 8-4 4 4 4M15 8l4 4-4 4M13 5l-2 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 3h12l2 2v16H5V3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M8 3v6h8V3M8 21v-7h8v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function BotIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="6" y="8" width="12" height="10" rx="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 8V5M8 13h.01M16 13h.01M9 21h6M4 13H2M22 13h-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function PlayCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="m10 8 6 4-6 4V8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function SearchXIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="m20 20-4-4M9 9l4 4M13 9l-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M12 6.5C10.7 5.5 8.8 5 6 5H4v14h2c2.8 0 4.7.5 6 1.5M12 6.5C13.3 5.5 15.2 5 18 5h2v14h-2c-2.8 0-4.7.5-6 1.5M12 6.5v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function GaugeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 14a8 8 0 1 1 16 0M12 14l4-4M7 18h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    </IconBase>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ModuleIconView({
  icon,
  className,
}: {
  icon: ModuleIcon;
  className?: string;
}) {
  const props = { className };

  if (icon === "braces") {
    return (
      <IconBase {...props}>
        <path
          d="M8 4c-2 0-3 1-3 3v2c0 1.2-.8 2-2 2 1.2 0 2 .8 2 2v4c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.2.8 2 2 2-1.2 0-2 .8-2 2v4c0 2-1 3-3 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </IconBase>
    );
  }

  if (icon === "gitBranch") {
    return (
      <IconBase {...props}>
        <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M6 9v3a6 6 0 0 0 6 6h3M6 15h4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </IconBase>
    );
  }

  if (icon === "refresh") {
    return (
      <IconBase {...props}>
        <path
          d="M20 11a8 8 0 0 0-14.5-4M4 7V3m0 4h4M4 13a8 8 0 0 0 14.5 4M20 17v4m0-4h-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </IconBase>
    );
  }

  if (icon === "sigma") {
    return (
      <IconBase {...props}>
        <path
          d="M18 4H7l6 8-6 8h11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </IconBase>
    );
  }

  return (
    <IconBase {...props}>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ActivityIcon({
  action,
  className,
}: {
  action: ActivityAction;
  className?: string;
}) {
  if (action === "completed") {
    return <CheckCircleIcon className={className} />;
  }

  if (action === "saved") {
    return <SaveIcon className={className} />;
  }

  if (action === "ai_used") {
    return <BotIcon className={className} />;
  }

  return <PlayCircleIcon className={className} />;
}

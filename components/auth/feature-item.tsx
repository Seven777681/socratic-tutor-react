import type { ReactNode } from "react";

type FeatureItemProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function FeatureItem({ title, description, icon }: FeatureItemProps) {
  return (
    <li className="flex min-w-0 items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6] sm:h-9 sm:w-9"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-1.5 block text-[12px] leading-5 text-slate-500 lg:text-[13px]">
          {description}
        </span>
      </span>
    </li>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/dashboard/dashboard-icons";

export function TaskSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = `task-section-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section className="rounded-[16px] border border-[#E4E7F0] bg-white">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-[16px] px-4 py-3 text-left text-sm font-extrabold text-[#101426] transition hover:bg-indigo-50/60 focus:outline-none focus:ring-4 focus:ring-inset focus:ring-[#6255f6]/15"
      >
        {title}
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-slate-500 transition duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? (
        <div
          id={contentId}
          className="border-t border-[#E4E7F0] px-4 py-4 motion-safe:animate-[fadeIn_200ms_ease-out]"
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

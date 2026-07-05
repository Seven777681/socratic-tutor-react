"use client";

import { useEffect, useRef, useState } from "react";
import type { TutorStatus } from "@/types/tutor";
import {
  BotIcon,
  CheckCircleIcon,
  CircleIcon,
  LoaderCircleIcon,
  MoreHorizontalIcon,
} from "@/components/dashboard/dashboard-icons";

function TutorStatusView({ status }: { status: TutorStatus }) {
  if (status === "thinking") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eceaff] px-2 py-1 text-xs font-extrabold text-[#6255f6]">
        <LoaderCircleIcon className="h-3.5 w-3.5 motion-safe:animate-spin" />
        Thinking...
      </span>
    );
  }

  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-600">
        <CircleIcon className="h-3.5 w-3.5" />
        Offline
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-extrabold text-emerald-700">
      <CheckCircleIcon className="h-3.5 w-3.5" />
      Ready
    </span>
  );
}

export function TutorHeader({
  status,
  onStartNew,
  onClear,
  onGuidelines,
}: {
  status: TutorStatus;
  onStartNew: () => void;
  onClear: () => void;
  onGuidelines: () => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#E4E7F0] bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <BotIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-base font-extrabold text-[#101426]">
            Socratic AI Tutor
          </h2>
          <p className="hidden truncate text-xs font-semibold text-slate-500 2xl:block">
            Guided questions, not direct answers
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <TutorStatusView status={status} />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Tutor menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4E7F0] bg-white text-slate-600 transition hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            <MoreHorizontalIcon className="h-5 w-5" />
          </button>
          {isMenuOpen ? (
            <div className="absolute right-0 top-11 z-30 w-56 rounded-2xl border border-[#E4E7F0] bg-white p-2 shadow-[0_18px_45px_rgba(78,91,130,0.14)]">
              {[
                ["Start New Conversation", onStartNew],
                ["Clear Conversation", onClear],
                ["Tutor Guidelines", onGuidelines],
              ].map(([label, action]) => (
                <button
                  key={label as string}
                  type="button"
                  onClick={() => {
                    (action as () => void)();
                    setIsMenuOpen(false);
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 transition hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
                >
                  {label as string}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

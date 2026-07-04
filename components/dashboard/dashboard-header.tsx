"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  BellIcon,
  ChevronDownIcon,
  MenuIcon,
  RobotLogo,
  XIcon,
} from "@/components/dashboard/dashboard-icons";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tasks", href: "/tasks" },
  { label: "History", href: "/history" },
];

const menuItems = [
  { label: "Profile", href: "/profile" },
  { label: "Study Notice", href: "/profile#study-notice" },
  { label: "Sign Out", href: "/login" },
];

type ActiveNavItem = "dashboard" | "tasks" | "history";

function NavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
        active
          ? "bg-[#eceaff] text-[#6255f6]"
          : "text-slate-600 hover:bg-indigo-50/70 hover:text-[#6255f6]"
      }`}
    >
      {label}
    </Link>
  );
}

export function DashboardHeader({
  activeItem = "dashboard",
}: {
  activeItem?: ActiveNavItem;
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E4E7F0] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12 xl:px-16">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          aria-label="Socratic AI Tutor dashboard"
        >
          <RobotLogo />
          <span className="truncate text-lg font-bold tracking-normal text-[#101426] sm:text-xl">
            Socratic <span className="text-[#6255f6]">AI</span> Tutor
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={item.href === `/${activeItem}`}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="View notifications"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E7F0] bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.98]"
          >
            <BellIcon className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block" ref={userMenuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              onClick={() => setIsUserMenuOpen((current) => !current)}
              className="flex h-11 items-center gap-3 rounded-full border border-[#E4E7F0] bg-white py-1 pl-1 pr-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#6657f5,#4F7CFF)] text-sm font-bold text-white">
                S
              </span>
              <span className="hidden lg:inline">Student 001</span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>

            {isUserMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-48 rounded-2xl border border-[#E4E7F0] bg-white p-2 shadow-[0_18px_45px_rgba(78,91,130,0.14)]"
              >
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4E7F0] bg-white text-slate-600 transition hover:bg-indigo-50/60 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 md:hidden"
          >
            {isMobileMenuOpen ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-[#E4E7F0] bg-white px-5 py-4 md:hidden">
          <nav className="mx-auto grid max-w-[1440px] gap-2" aria-label="Mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={item.href === `/${activeItem}`}
              />
            ))}
            <div className="mt-2 border-t border-[#E4E7F0] pt-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50/70 hover:text-[#6255f6] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

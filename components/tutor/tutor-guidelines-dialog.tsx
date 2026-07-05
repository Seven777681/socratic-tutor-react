"use client";

import { useEffect } from "react";

export function TutorGuidelinesDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutor-guidelines-title"
        className="w-full max-w-md rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_24px_70px_rgba(78,91,130,0.22)]"
      >
        <h2
          id="tutor-guidelines-title"
          className="text-xl font-extrabold text-[#101426]"
        >
          How the Socratic Tutor Helps
        </h2>
        <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
          <li>It asks guiding questions.</li>
          <li>It helps you break problems into smaller steps.</li>
          <li>It uses your current code and run results as context.</li>
          <li>It does not provide complete solutions.</li>
          <li>You remain responsible for writing and explaining your code.</li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-xl bg-[linear-gradient(90deg,#6657f5,#4678ff)] text-sm font-extrabold text-white shadow-md shadow-indigo-200/70 transition hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
        >
          Got It
        </button>
      </section>
    </div>
  );
}

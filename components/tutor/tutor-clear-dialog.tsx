"use client";

import { useEffect } from "react";

export function TutorClearDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-tutor-title"
        className="w-full max-w-sm rounded-[22px] border border-[#E4E7F0] bg-white p-6 shadow-[0_24px_70px_rgba(78,91,130,0.22)]"
      >
        <h2
          id="clear-tutor-title"
          className="text-lg font-extrabold text-[#101426]"
        >
          Clear conversation?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This clears the local mock tutor conversation for this task. Your code
          and run results stay unchanged.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 flex-1 rounded-xl border border-[#E4E7F0] bg-white text-sm font-extrabold text-slate-600 transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 flex-1 rounded-xl bg-[#6255f6] text-sm font-extrabold text-white transition hover:bg-[#5748ea] focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Clear
          </button>
        </div>
      </section>
    </div>
  );
}

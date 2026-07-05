"use client";

import { useEffect } from "react";
import { RotateCcwIcon } from "@/components/dashboard/dashboard-icons";

export function EditorResetDialog({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-code-title"
        className="w-full max-w-[420px] rounded-[20px] border border-[#E4E7F0] bg-white p-6 shadow-[0_28px_90px_rgba(78,91,130,0.18)]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
          <RotateCcwIcon className="h-6 w-6" />
        </span>
        <h2
          id="reset-code-title"
          className="mt-5 text-xl font-extrabold tracking-normal text-[#101426]"
        >
          Reset starter code?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This will replace your current code with the original starter code.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-lg border border-[#E4E7F0] bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 rounded-lg bg-[linear-gradient(90deg,#6657f5,#4678ff)] px-4 text-sm font-bold text-white shadow-lg shadow-indigo-200/80 transition hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15"
          >
            Reset Code
          </button>
        </div>
      </section>
    </div>
  );
}

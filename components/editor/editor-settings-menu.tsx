"use client";

import { useEffect, useRef } from "react";
import type { EditorSettingsProps } from "@/components/editor/editor-types";
import type { RunScenario } from "@/types/code-run";

const demoScenarios: { value: RunScenario; label: string }[] = [
  { value: "failed", label: "Failed tests" },
  { value: "success", label: "Success" },
  { value: "syntax_error", label: "Syntax error" },
  { value: "runtime_error", label: "Runtime error" },
  { value: "timeout", label: "Timeout" },
  { value: "system_error", label: "System error" },
];

export function EditorSettingsMenu({
  preferences,
  onPreferencesChange,
  demoRunScenario,
  onDemoRunScenarioChange,
  onClose,
}: EditorSettingsProps & {
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute right-0 top-12 z-40 w-64 rounded-2xl border border-[#E4E7F0] bg-white p-3 shadow-[0_18px_45px_rgba(78,91,130,0.14)]"
    >
      <div>
        <p className="px-2 text-xs font-extrabold uppercase tracking-normal text-slate-500">
          Font Size
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[14, 16, 18].map((size) => (
            <button
              key={size}
              type="button"
              role="menuitem"
              onClick={() =>
                onPreferencesChange({
                  ...preferences,
                  fontSize: size as 14 | 16 | 18,
                })
              }
              className={`rounded-lg px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
                preferences.fontSize === size
                  ? "bg-[#eceaff] text-[#6255f6]"
                  : "text-slate-600 hover:bg-indigo-50/70"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <label className="flex items-center justify-between rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50/50">
          Word Wrap
          <input
            type="checkbox"
            checked={preferences.wordWrap}
            onChange={(event) =>
              onPreferencesChange({
                ...preferences,
                wordWrap: event.target.checked,
              })
            }
            className="h-4 w-4 rounded border-slate-300 text-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        </label>
        <label className="flex items-center justify-between rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-indigo-50/50">
          Minimap
          <input
            type="checkbox"
            checked={preferences.minimapEnabled}
            onChange={(event) =>
              onPreferencesChange({
                ...preferences,
                minimapEnabled: event.target.checked,
              })
            }
            className="h-4 w-4 rounded border-slate-300 text-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          />
        </label>
      </div>

      {process.env.NODE_ENV === "development" ? (
        <div className="mt-4 border-t border-[#E4E7F0] pt-4">
          <label
            htmlFor="demo-run-scenario"
            className="px-2 text-xs font-extrabold uppercase tracking-normal text-slate-500"
          >
            Demo Run Result
          </label>
          <select
            id="demo-run-scenario"
            value={demoRunScenario}
            onChange={(event) =>
              onDemoRunScenarioChange(event.target.value as RunScenario)
            }
            className="mt-2 h-10 w-full rounded-xl border border-[#E4E7F0] bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
          >
            {demoScenarios.map((scenario) => (
              <option key={scenario.value} value={scenario.value}>
                {scenario.label}
              </option>
            ))}
          </select>
          <p className="mt-2 px-2 text-xs leading-5 text-slate-500">
            Mock only. Student code is not executed in the browser.
          </p>
        </div>
      ) : null}
    </div>
  );
}

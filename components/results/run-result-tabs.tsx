"use client";

export type RunResultTab = "console" | "tests" | "errors";

const tabs: { id: RunResultTab; label: string }[] = [
  { id: "console", label: "Console" },
  { id: "tests", label: "Test Results" },
  { id: "errors", label: "Error Details" },
];

export function RunResultTabs({
  activeTab,
  onActiveTabChange,
}: {
  activeTab: RunResultTab;
  onActiveTabChange: (tab: RunResultTab) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Run result views"
      className="flex shrink-0 gap-1 rounded-xl bg-[#F5F7FF] p-1"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`run-result-panel-${tab.id}`}
          id={`run-result-tab-${tab.id}`}
          onClick={() => onActiveTabChange(tab.id)}
          className={`rounded-lg px-3 py-2 text-xs font-extrabold transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 ${
            activeTab === tab.id
              ? "bg-white text-[#6255f6] shadow-sm"
              : "text-slate-500 hover:bg-white/70 hover:text-[#101426]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

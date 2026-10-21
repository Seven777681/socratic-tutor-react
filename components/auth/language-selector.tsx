"use client";

import { useState } from "react";
import { useLanguage, type AppLanguage } from "@/components/i18n/language-provider";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const options: { value: AppLanguage; label: string }[] = [
    { value: "zh", label: "中文" },
    { value: "en", label: "English" },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-10 items-center gap-2 rounded-[10px] border border-slate-200 bg-white/90 px-3.5 text-xs font-bold text-slate-600 shadow-sm shadow-indigo-100/40 backdrop-blur transition hover:border-indigo-200 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
        aria-label={language === "zh" ? "选择语言" : "Select language"}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="M3 12h18M12 3c2.2 2.4 3.4 5.4 3.4 9S14.2 18.6 12 21c-2.2-2.4-3.4-5.4-3.4-9S9.8 5.4 12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {language === "zh" ? "中文" : "English"}
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
        <path
          d="m7 10 5 5 5-5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      </button>
      {isOpen ? (
        <div role="listbox" className="absolute right-0 top-12 z-50 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/60">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={language === option.value}
              onClick={() => {
                setLanguage(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-bold transition ${language === option.value ? "bg-[#eceaff] text-[#6255f6]" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {option.label}
              {language === option.value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

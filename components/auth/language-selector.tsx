export function LanguageSelector() {
  return (
    <button
      type="button"
      className="flex h-10 items-center gap-2 rounded-[10px] border border-slate-200 bg-white/85 px-3.5 text-xs font-bold text-slate-600 shadow-sm shadow-indigo-100/40 backdrop-blur transition hover:border-indigo-200 hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6255f6]/10"
      aria-label="Select language"
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
      English
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
  );
}

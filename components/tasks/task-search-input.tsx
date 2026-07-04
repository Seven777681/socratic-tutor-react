import { SearchIcon } from "@/components/dashboard/dashboard-icons";

export function TaskSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">Search tasks</span>
      <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-slate-500">
        <SearchIcon className="h-5 w-5" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search tasks by title or topic..."
        className="h-12 w-full rounded-xl border border-[#E4E7F0] bg-white py-3 pl-12 pr-4 text-sm font-medium text-[#101426] outline-none transition placeholder:text-slate-400 hover:border-indigo-200 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
      />
    </label>
  );
}

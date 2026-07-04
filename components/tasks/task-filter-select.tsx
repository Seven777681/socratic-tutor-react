import { ChevronDownIcon } from "@/components/dashboard/dashboard-icons";

export interface FilterOption<Value extends string> {
  value: Value;
  label: string;
}

export function TaskFilterSelect<Value extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: Value;
  options: FilterOption<Value>[];
  onChange: (value: Value) => void;
}) {
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as Value)}
        className="h-12 w-full appearance-none rounded-xl border border-[#E4E7F0] bg-white py-3 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition hover:border-indigo-200 focus:border-[#6255f6] focus:ring-4 focus:ring-[#6255f6]/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </label>
  );
}

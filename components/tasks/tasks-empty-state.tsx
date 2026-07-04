import { SearchXIcon } from "@/components/dashboard/dashboard-icons";

export function TasksEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-[#E4E7F0] bg-white px-6 py-14 text-center shadow-[0_16px_45px_rgba(78,91,130,0.08)]">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eceaff] text-[#6255f6]">
        <SearchXIcon className="h-7 w-7" />
      </span>
      <h2 className="mt-5 text-2xl font-extrabold tracking-normal text-[#101426]">
        No tasks found
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Try adjusting your search or filters.
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg border border-[#b9b2ff] bg-white px-5 text-sm font-bold text-[#6255f6] transition hover:border-[#6255f6] hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
      >
        Clear Filters
      </button>
    </section>
  );
}

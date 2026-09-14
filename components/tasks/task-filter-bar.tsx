import type {
  TaskDifficulty,
  TaskFilters,
  TaskSort,
  TaskStatus,
  TaskTopic,
} from "@/types/task";
import { TaskFilterSelect } from "@/components/tasks/task-filter-select";
import { TaskSearchInput } from "@/components/tasks/task-search-input";

const topicOptions: Array<{ value: TaskTopic | "all"; label: string }> = [
  { value: "all", label: "All Concepts" },
  { value: "variables", label: "Variables" },
  { value: "conditionals", label: "Conditionals" },
  { value: "loops", label: "Loops" },
  { value: "functions", label: "Functions" },
  { value: "lists", label: "Lists" },
  { value: "strings", label: "Strings" },
];

const difficultyOptions: Array<{
  value: TaskDifficulty | "all";
  label: string;
}> = [
  { value: "all", label: "All Practice Levels" },
  { value: "easy", label: "Follow" },
  { value: "medium", label: "Apply / Combine" },
  { value: "hard", label: "Solve" },
];

const statusOptions: Array<{ value: TaskStatus | "all"; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const sortOptions: Array<{ value: TaskSort; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest First" },
  { value: "concept", label: "By Concept" },
  { value: "thinking_progress", label: "Thinking Progress" },
  { value: "recently_updated", label: "Recently Updated" },
];

export function TaskFilterBar({
  filters,
  hasActiveFilters,
  onFiltersChange,
  onClearFilters,
}: {
  filters: TaskFilters;
  hasActiveFilters: boolean;
  onFiltersChange: (filters: TaskFilters) => void;
  onClearFilters: () => void;
}) {
  return (
    <section className="rounded-[20px] border border-[#E4E7F0] bg-white p-4 shadow-[0_16px_45px_rgba(78,91,130,0.08)] sm:p-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_190px]">
        <TaskSearchInput
          value={filters.query}
          onChange={(query) => onFiltersChange({ ...filters, query })}
        />
        <TaskFilterSelect
          label="Filter by concept"
          value={filters.topic}
          options={topicOptions}
          onChange={(topic) => onFiltersChange({ ...filters, topic })}
        />
        <TaskFilterSelect
          label="Filter by practice level"
          value={filters.depth}
          options={difficultyOptions}
          onChange={(depth) =>
            onFiltersChange({ ...filters, depth })
          }
        />
        <TaskFilterSelect
          label="Filter by status"
          value={filters.status}
          options={statusOptions}
          onChange={(status) => onFiltersChange({ ...filters, status })}
        />
        <TaskFilterSelect
          label="Sort tasks"
          value={filters.sort}
          options={sortOptions}
          onChange={(sort) => onFiltersChange({ ...filters, sort })}
        />
      </div>

      {hasActiveFilters ? (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-lg px-3 py-2 text-sm font-bold text-[#6255f6] transition hover:bg-indigo-50/70 focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99]"
          >
            Clear Filters
          </button>
        </div>
      ) : null}
    </section>
  );
}

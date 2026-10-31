import type { TaskDifficulty } from "@/types/task";
import { useLanguage } from "@/components/i18n/language-provider";

const difficultyOptions: Array<{
  value: TaskDifficulty;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
}> = [
  {
    value: "easy",
    label: { en: "Foundation", zh: "基础题" },
    description: { en: "Strengthen syntax and core concepts", zh: "巩固语法与核心概念" },
  },
  {
    value: "medium",
    label: { en: "Intermediate", zh: "进阶题" },
    description: { en: "Combine concepts and apply them independently", zh: "组合知识并独立应用" },
  },
  {
    value: "hard",
    label: { en: "Challenge", zh: "挑战题" },
    description: { en: "Solve more complex, integrated problems", zh: "解决更复杂的综合问题" },
  },
];

export function TaskDifficultyTabs({
  value,
  onChange,
}: {
  value: TaskDifficulty;
  onChange: (value: TaskDifficulty) => void;
}) {
  const { language, t } = useLanguage();

  return (
    <section aria-labelledby="difficulty-heading">
      <div className="mb-3">
        <h2 id="difficulty-heading" className="text-lg font-extrabold text-[#101426]">
          {t("Choose a practice difficulty", "选择练习难度")}
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          {t(
            "Select a difficulty first, then choose a task from that category.",
            "先选择一个难度，再从该分类中挑选题目。",
          )}
        </p>
      </div>

      <div
        className="grid gap-3 sm:grid-cols-3"
        role="tablist"
        aria-label={t("Task difficulty", "题目难度")}
      >
        {difficultyOptions.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(option.value)}
              className={`rounded-[18px] border px-5 py-4 text-left transition focus:outline-none focus:ring-4 focus:ring-[#6255f6]/15 active:scale-[0.99] ${
                active
                  ? "border-[#6255f6] bg-[#6255f6] text-white shadow-[0_14px_35px_rgba(98,85,246,0.24)]"
                  : "border-[#E4E7F0] bg-white text-[#101426] shadow-[0_10px_30px_rgba(78,91,130,0.07)] hover:border-[#6255f6]/40 hover:bg-indigo-50/40"
              }`}
            >
              <span className="block text-base font-extrabold">{option.label[language]}</span>
              <span className={`mt-1 block text-xs font-semibold ${active ? "text-indigo-100" : "text-slate-500"}`}>
                {option.description[language]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

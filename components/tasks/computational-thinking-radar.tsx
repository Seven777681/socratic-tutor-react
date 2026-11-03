"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import {
  computationalThinkingDimensionIds,
  type ComputationalThinkingDimensionId,
  type ComputationalThinkingScore,
} from "@/types/computational-thinking";
import type { ProgrammingTaskSummary } from "@/types/task";
import {
  generateComputationalThinkingScore,
  getComputationalThinkingScores,
} from "@/services/computational-thinking";

const labels: Record<ComputationalThinkingDimensionId, [string, string]> = {
  decomposition: ["Decomposition", "问题分解"],
  algorithmic_thinking: ["Algorithmic thinking", "算法思维"],
  abstraction: ["Abstraction", "抽象能力"],
  pattern_recognition: ["Pattern recognition", "模式识别"],
  evaluation: ["Evaluation", "评估能力"],
  debugging: ["Debugging", "调试能力"],
};

function point(index: number, value: number, radius = 116) {
  const angle = -Math.PI / 2 + index * (Math.PI * 2 / 6);
  const distance = radius * Math.max(0, Math.min(5, value)) / 5;
  return [210 + Math.cos(angle) * distance, 160 + Math.sin(angle) * distance] as const;
}

function polygon(values: number[], radius = 116) {
  return values.map((value, index) => point(index, value, radius).join(",")).join(" ");
}

export function ComputationalThinkingRadar({ tasks }: { tasks: ProgrammingTaskSummary[] }) {
  const { language, t } = useLanguage();
  const [scores, setScores] = useState<ComputationalThinkingScore[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "scoring" | "error">("loading");
  const autoAttemptedRef = useRef(new Set<string>());

  const groups = useMemo(() => {
    const grouped = new Map<string, ProgrammingTaskSummary[]>();
    for (const task of tasks) {
      // Formal pre/post assessment tasks use a separate blind scoring flow.
      // This radar is only for regular question-bank knowledge modules.
      if (!task.questionSetId || !task.moduleId) continue;
      grouped.set(task.questionSetId, [...(grouped.get(task.questionSetId) ?? []), task]);
    }
    return [...grouped.entries()].map(([id, groupTasks]) => ({
      id,
      title: groupTasks[0]?.questionSetTitle ?? id,
      tasks: groupTasks,
      completed: groupTasks.length >= 2 && groupTasks.every((task) => task.status === "completed"),
    }));
  }, [tasks]);

  const completionSignature = groups
    .map((group) => `${group.id}:${group.completed}`)
    .join("|");

  useEffect(() => {
    let cancelled = false;
    const sessionId = window.sessionStorage.getItem("socratic-study-session-id") ?? "";
    if (!sessionId) {
      setStatus("ready");
      return;
    }

    void (async () => {
      try {
        setStatus("loading");
        const loaded = await getComputationalThinkingScores(sessionId);
        if (cancelled) return;
        setScores(loaded);
        setSelectedId((current) => current || loaded[0]?.question_set_id || "");

        const scoredIds = new Set(loaded.map((score) => score.question_set_id));
        const pendingGroup = groups.find(
          (group) => group.completed && !scoredIds.has(group.id) && !autoAttemptedRef.current.has(group.id),
        );
        if (!pendingGroup) {
          setStatus("ready");
          return;
        }

        autoAttemptedRef.current.add(pendingGroup.id);
        setStatus("scoring");
        const generated = await generateComputationalThinkingScore({
          studySessionId: sessionId,
          questionSetId: pendingGroup.id,
          questionSetTitle: pendingGroup.title,
          tasks: pendingGroup.tasks,
        });
        if (cancelled) return;
        setScores((current) => [generated, ...current.filter((item) => item.question_set_id !== generated.question_set_id)]);
        setSelectedId(generated.question_set_id);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => { cancelled = true; };
    // Re-check only when a whole question set changes completion state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionSignature]);

  const selected = scores.find((score) => score.question_set_id === selectedId) ?? scores[0];
  const rawValues = computationalThinkingDimensionIds.map(
    (id) => selected?.dimensions[id]?.score ?? null,
  );
  const completeRadarValues = rawValues.filter((value): value is number => value !== null);
  const hasCompleteRadar = completeRadarValues.length === computationalThinkingDimensionIds.length;
  const nextIncomplete = groups.find((group) => !group.completed);
  const completedInNext = nextIncomplete?.tasks.filter((task) => task.status === "completed").length ?? 0;
  const strengths = selected
    ? (language === "zh" ? selected.overall_strengths_zh : selected.overall_strengths_en) ?? selected.overall_strengths
    : [];
  const nextSteps = selected
    ? (language === "zh" ? selected.next_steps_zh : selected.next_steps_en) ?? selected.next_steps
    : [];
  const limitations = selected
    ? (language === "zh" ? selected.overall_limitations_zh : selected.overall_limitations_en) ?? selected.overall_limitations
    : [];

  return (
    <section className="overflow-hidden rounded-[22px] border border-[#ddd9ff] bg-[linear-gradient(135deg,#fbfaff,#f3f5ff)] shadow-[0_14px_36px_rgba(91,76,180,0.08)]">
      <div className="border-b border-[#e5e2fb] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#6255f6]">
              {t("Computational thinking", "计算思维")}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#101426]">
              {selected
                ? t(`${selected.question_set_title} competency profile`, `${selected.question_set_title}能力画像`)
                : t("Your six-dimension profile", "你的六维能力画像")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
              {selected
                ? t(
                    `Based on ${selected.task_count} completed tasks and their observable learning evidence.`,
                    `根据已完成的 ${selected.task_count} 道题及其可观察学习证据生成。`,
                  )
                : t(
                    "Complete every task in a related question set to generate an evidence-based radar chart.",
                    "完成一个相关知识点题组中的全部题目后，将生成基于证据的雷达图。",
                  )}
            </p>
          </div>
          {selected ? (
            <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
              <p className="text-xs font-bold text-slate-400">
                {selected.overall_status === "scored" ? t("Overall", "总分") : t("Provisional", "暂定分数")}
              </p>
              <p className="mt-0.5 text-2xl font-extrabold text-[#6255f6]">
                {selected.percentage}<span className="text-sm text-slate-400"> / 100</span>
              </p>
              <p className="text-xs font-bold text-slate-500">
                {t("Evidence-covered dimensions", "已有证据维度")}：{selected.assessed_dimensions}/{selected.total_dimensions}
              </p>
            </div>
          ) : null}
        </div>

        {scores.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {scores.map((score) => (
              <button
                key={score.question_set_id}
                type="button"
                onClick={() => setSelectedId(score.question_set_id)}
                className={`rounded-xl px-3 py-2 text-xs font-extrabold transition ${
                  selected?.question_set_id === score.question_set_id
                    ? "bg-[#6255f6] text-white"
                    : "border border-[#dedaf8] bg-white text-slate-600 hover:bg-[#f3f1ff]"
                }`}
              >
                {score.question_set_title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {status === "scoring" || status === "loading" ? (
        <div className="px-6 py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#dedaff] border-t-[#6255f6]" />
          <p className="mt-3 text-sm font-bold text-slate-600">
            {status === "scoring"
              ? t("Analyzing evidence across the completed question set…", "正在分析整个题组的学习证据……")
              : t("Loading your competency profile…", "正在加载能力画像……")}
          </p>
        </div>
      ) : selected ? (
        <div className="grid gap-5 px-4 py-5 lg:grid-cols-[minmax(0,460px)_1fr] lg:px-6">
          <div className="min-w-0 rounded-2xl bg-white/80 p-2">
            <svg viewBox="0 0 420 340" role="img" aria-label={t("Computational thinking radar chart", "计算思维雷达图")} className="h-auto w-full">
              {[1, 2, 3, 4, 5].map((level) => (
                <polygon key={level} points={polygon(Array(6).fill(level))} fill={level === 5 ? "#f7f6ff" : "none"} stroke="#dcd9ef" strokeWidth="1" />
              ))}
              {computationalThinkingDimensionIds.map((id, index) => {
                const [x, y] = point(index, 5);
                return <line key={id} x1="210" y1="160" x2={x} y2={y} stroke="#dedbea" strokeWidth="1" />;
              })}
              {hasCompleteRadar ? (
                <polygon points={polygon(completeRadarValues)} fill="rgba(98,85,246,0.22)" stroke="#6255f6" strokeWidth="3" strokeLinejoin="round" />
              ) : rawValues.map((value, index) => {
                if (value === null) return null;
                const [x, y] = point(index, value);
                return <line key={`score-line-${computationalThinkingDimensionIds[index]}`} x1="210" y1="160" x2={x} y2={y} stroke="#6255f6" strokeWidth="3" strokeLinecap="round" />;
              })}
              {rawValues.map((value, index) => {
                if (value === null) return null;
                const [x, y] = point(index, value);
                return <circle key={computationalThinkingDimensionIds[index]} cx={x} cy={y} r="4.5" fill="#6255f6" stroke="white" strokeWidth="2" />;
              })}
              {computationalThinkingDimensionIds.map((id, index) => {
                const [x, y] = point(index, 6.25);
                return (
                  <text key={id} x={x} y={y} textAnchor={x < 195 ? "end" : x > 225 ? "start" : "middle"} dominantBaseline="middle" fill="#34405a" fontSize="12" fontWeight="700">
                    {labels[id][language === "zh" ? 1 : 0]}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="grid content-start gap-3 sm:grid-cols-2">
            {computationalThinkingDimensionIds.map((id) => {
              const dimension = selected.dimensions[id];
              const summary = (language === "zh" ? dimension.summary_zh : dimension.summary_en) ?? dimension.summary;
              const nextLevel = (language === "zh" ? dimension.missing_for_next_score_zh : dimension.missing_for_next_score_en) ?? dimension.missing_for_next_score;
              return (
                <article key={id} className="rounded-2xl border border-[#e5e2f5] bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-extrabold text-[#20263a]">{labels[id][language === "zh" ? 1 : 0]}</h3>
                    <span className="text-base font-extrabold text-[#6255f6]">
                      {dimension.score === null ? "—" : `${dimension.score}/5`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {t("Confidence", "可信度")}：{t(dimension.confidence, dimension.confidence === "high" ? "高" : dimension.confidence === "medium" ? "中" : "低")}
                    <span className="mx-1.5">·</span>
                    {t("Evidence", "证据覆盖")}：{Math.round(dimension.evidence_coverage * 100)}%
                  </p>
                  {dimension.status === "insufficient_evidence" || dimension.status === "not_applicable" ? (
                    <p className="mt-2 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold leading-5 text-slate-600">
                      {t("Not enough observable evidence yet — no points were deducted.", "目前可观察证据不足，不会因此扣分。")}
                    </p>
                  ) : dimension.status === "provisional" ? (
                    <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-bold leading-5 text-amber-700">
                      {t("Provisional score based on limited evidence.", "该分数为基于有限证据的暂定结果。")}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                    {summary || dimension.status_reason || t("No summary available.", "暂无维度说明。")}
                  </p>
                  {nextLevel ? (
                    <p className="mt-2 border-t border-slate-100 pt-2 text-xs font-semibold leading-5 text-amber-700">
                      {t("Next level", "提升方向")}：{nextLevel}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>

          {(strengths.length > 0 || nextSteps.length > 0 || limitations.length > 0) ? (
            <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                <h3 className="text-sm font-extrabold text-emerald-800">{t("Observed strengths", "已观察到的优势")}</h3>
                <ul className="mt-2 space-y-1 text-sm font-semibold leading-6 text-emerald-900/80">
                  {strengths.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                <h3 className="text-sm font-extrabold text-amber-800">{t("Recommended next steps", "下一步建议")}</h3>
                <ul className="mt-2 space-y-1 text-sm font-semibold leading-6 text-amber-900/80">
                  {(nextSteps.length ? nextSteps : limitations).slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="px-6 py-7">
          <div className="h-2 overflow-hidden rounded-full bg-[#e5e2f5]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#6C4CF5,#536DFE)] transition-all"
              style={{ width: `${nextIncomplete ? Math.round(completedInNext / nextIncomplete.tasks.length * 100) : 0}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-600">
            {nextIncomplete
              ? t(
                  `${completedInNext} of ${nextIncomplete.tasks.length} tasks completed in ${nextIncomplete.title}.`,
                  `${nextIncomplete.title} 已完成 ${completedInNext}/${nextIncomplete.tasks.length} 道题。`,
                )
              : t("Start a question set to build your profile.", "开始完成一个题组来建立能力画像。")}
          </p>
          {status === "error" ? (
            <p className="mt-2 text-xs font-semibold text-rose-600">
              {t("The score could not be generated yet. It will retry when this page is reopened.", "评分暂时无法生成，重新打开此页面时会再次尝试。")}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

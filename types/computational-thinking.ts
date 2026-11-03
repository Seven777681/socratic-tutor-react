export const computationalThinkingDimensionIds = [
  "decomposition",
  "algorithmic_thinking",
  "abstraction",
  "pattern_recognition",
  "evaluation",
  "debugging",
] as const;

export type ComputationalThinkingDimensionId =
  (typeof computationalThinkingDimensionIds)[number];

export interface ComputationalThinkingDimension {
  score: number | null;
  max_score: number;
  confidence: "low" | "medium" | "high";
  status: "scored" | "provisional" | "insufficient_evidence" | "not_applicable";
  evidence_coverage: number;
  status_reason?: string;
  summary?: string;
  summary_en?: string;
  summary_zh?: string;
  observations?: string[];
  plan_evidence?: unknown;
  code_evidence?: unknown;
  run_evidence?: unknown;
  missing_for_next_score?: string;
  missing_for_next_score_en?: string;
  missing_for_next_score_zh?: string;
}

export interface ComputationalThinkingScore {
  question_set_id: string;
  question_set_title: string;
  task_ids: string[];
  task_count: number;
  rubric_version: string;
  scoring_status: "scored";
  dimensions: Record<ComputationalThinkingDimensionId, ComputationalThinkingDimension>;
  total: number;
  total_max: number;
  percentage: number;
  overall_status: "scored" | "provisional" | "insufficient_evidence";
  assessed_dimensions: number;
  total_dimensions: number;
  overall_strengths: string[];
  overall_limitations: string[];
  next_steps: string[];
  overall_strengths_en?: string[];
  overall_strengths_zh?: string[];
  overall_limitations_en?: string[];
  overall_limitations_zh?: string[];
  next_steps_en?: string[];
  next_steps_zh?: string[];
  generated_at: string;
}

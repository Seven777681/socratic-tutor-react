export interface MemoryDebugMessage {
  id: string;
  source_message_id: string;
  role: "student" | "tutor";
  content: string;
  stage?: string | null;
  sequence_number: number;
  created_at: string;
}

export interface MemoryDebugProfile {
  programming_level?: string | null;
  preferred_language: string;
  preferred_explanation_style?: string | null;
  known_concepts: string[];
  struggling_concepts: string[];
  profile_summary?: string | null;
  evidence_count: number;
  updated_at: string;
}

export interface MemoryDebugObservation {
  id: string;
  task_id: string;
  conversation_id: string;
  observation_type: string;
  concept?: string | null;
  value: string;
  confidence: number;
  evidence: string;
  status: string;
  created_at: string;
}

export interface ConceptMastery {
  id: string;
  concept: string;
  mastery_score: number;
  status: "known" | "developing" | "struggling";
  positive_evidence_count: number;
  negative_evidence_count: number;
  total_evidence_count: number;
  last_observed_at: string;
  updated_at: string;
}

export interface ProfileScoreEvent {
  id: string;
  concept: string;
  observation_key: string;
  evidence_type: "mastery" | "struggle";
  confidence: number;
  score_before: number;
  score_delta: number;
  score_after: number;
  status_before: string;
  status_after: string;
  created_at: string;
}

export interface MemoryDebugEvent {
  id: string;
  memory_type: string;
  event_name: string;
  evidence?: Record<string, unknown> | null;
  created_at: string;
}

export interface MemoryDebugSnapshot {
  task_id: string;
  conversation_id: string;
  short_term_messages: MemoryDebugMessage[];
  profile?: MemoryDebugProfile | null;
  concept_masteries: ConceptMastery[];
  score_events: ProfileScoreEvent[];
  profile_observations: MemoryDebugObservation[];
  latest_usage?: MemoryDebugEvent | null;
  recent_events: MemoryDebugEvent[];
}

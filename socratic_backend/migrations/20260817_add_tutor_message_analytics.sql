-- Structured Tutor analytics only. Never store chain-of-thought, secrets,
-- or directly identifying information in these columns.
alter table public.tutor_messages
  add column if not exists question_type text,
  add column if not exists learner_state_evidence jsonb,
  add column if not exists plan_review_result jsonb,
  add column if not exists model_provider text,
  add column if not exists model_name text,
  add column if not exists model_version text,
  add column if not exists prompt_version text,
  add column if not exists response_latency_ms integer;

comment on column public.tutor_messages.question_type is
  'Teaching purpose such as understanding, decomposition, or debugging.';
comment on column public.tutor_messages.learner_state_evidence is
  'Structured learner-state judgment with observable evidence; never chain-of-thought.';
comment on column public.tutor_messages.plan_review_result is
  'Structured plan review, missing steps, and coding-readiness decision.';
comment on column public.tutor_messages.response_latency_ms is
  'Backend Tutor processing time in milliseconds.';

create index if not exists tutor_messages_attempt_question_type_idx
  on public.tutor_messages (attempt_id, question_type);

-- Feedback is collected externally in Wenjuanxing and joined by anonymous
-- participant code, so this application does not own a feedback table.
drop table if exists public.task_feedback;

-- event_id duplicated id on every row and did not add another identity.
alter table public.interaction_events
  drop column if exists event_id;

-- Preserve complete hidden/public test evidence for each code run.
alter table public.code_runs
  add column if not exists test_results jsonb;

comment on column public.code_runs.test_results is
  'Per-test outcomes, diagnostics, and misconception tags for this run.';

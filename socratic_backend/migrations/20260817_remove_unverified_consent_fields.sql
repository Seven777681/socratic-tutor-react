-- The current interface does not implement a versioned informed-consent step,
-- so these fields would imply evidence that the application does not collect.
alter table public.users
  drop column if exists consented_at;

alter table public.study_sessions
  drop column if exists consent_version;

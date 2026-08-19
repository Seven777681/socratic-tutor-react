-- These values are not collected or assigned by the current study design.
alter table public.users
  drop column if exists programming_experience,
  drop column if exists study_group;

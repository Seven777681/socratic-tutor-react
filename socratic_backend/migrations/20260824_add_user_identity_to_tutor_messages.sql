-- Make raw tutor_messages exports directly attributable to an anonymous
-- participant code while retaining the normalized relational links.
alter table public.tutor_messages
  add column if not exists user_id uuid references public.users(id),
  add column if not exists user_code text;

-- Backfill every existing message through its attempt and study session.
update public.tutor_messages as tm
set
  user_id = ss.user_id,
  user_code = u.user_code
from public.task_attempts as ta
join public.study_sessions as ss on ss.id = ta.session_id
join public.users as u on u.id = ss.user_id
where tm.attempt_id = ta.id
  and (tm.user_id is distinct from ss.user_id
       or tm.user_code is distinct from u.user_code);

create index if not exists tutor_messages_user_code_created_at_idx
  on public.tutor_messages (user_code, created_at);

comment on column public.tutor_messages.user_id is
  'Anonymous participant UUID copied from the study session for direct exports.';
comment on column public.tutor_messages.user_code is
  'Research participant code such as U001; do not store names or emails.';

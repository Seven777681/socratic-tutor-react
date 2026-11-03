create table if not exists public.verification_codes (
  id varchar(36) primary key,
  destination varchar(255) not null,
  purpose varchar(32) not null,
  code_hash varchar(64) not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ix_verification_codes_destination
  on public.verification_codes (destination);

create index if not exists ix_verification_codes_lookup
  on public.verification_codes (destination, purpose, created_at desc);

comment on table public.verification_codes is
  'Hashed, short-lived verification codes used before account registration.';

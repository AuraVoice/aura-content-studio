create extension if not exists pgcrypto;

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_date date not null unique,
  thread_id text not null unique,
  status text not null default 'researching' check (status in (
    'researching', 'awaiting_idea', 'directing', 'awaiting_generation',
    'evaluating', 'awaiting_regeneration_approval', 'approved', 'skipped',
    'cancelled', 'failed'
  )),
  current_step text not null default 'created',
  run_version integer not null default 1,
  selected_idea_id uuid,
  current_prompt_version integer,
  state jsonb not null default '{}'::jsonb,
  error text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trend_ideas (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  rank smallint not null check (rank between 1 and 3),
  concept text not null,
  hook text not null,
  format text not null,
  platform text not null,
  aura_relevance text not null,
  sources jsonb not null default '[]'::jsonb,
  shelf_life text not null,
  higgsfield_needed boolean not null,
  generation_risk text not null,
  risk_reason text not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, rank)
);

alter table campaigns
  drop constraint if exists campaigns_selected_idea_id_fkey;
alter table campaigns
  add constraint campaigns_selected_idea_id_fkey
  foreign key (selected_idea_id) references trend_ideas(id) on delete set null;

create table if not exists prompt_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  idea_id uuid references trend_ideas(id) on delete set null,
  version integer not null,
  parent_version integer,
  change_request text,
  final_concept text not null,
  hook text not null,
  spoken_script text not null,
  shots jsonb not null,
  higgsfield_prompt text not null,
  negative_constraints jsonb not null,
  duration_seconds integer not null,
  recommended_model text not null,
  failure_points jsonb not null,
  locked_attributes jsonb not null,
  validation jsonb not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, version)
);

create table if not exists media_uploads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  prompt_version integer not null,
  telegram_file_id text,
  telegram_file_unique_id text unique,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null,
  sha256 text not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, sha256)
);

create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  upload_id uuid not null unique references media_uploads(id) on delete cascade,
  prompt_version integer not null,
  verdict text not null check (verdict in (
    'APPROVE', 'APPROVE_WITH_MINOR_ISSUES', 'SURGICAL_REGENERATION', 'ABANDON'
  )),
  summary text not null,
  issues jsonb not null default '[]'::jsonb,
  credit_recommendation text not null,
  worth_another_generation boolean not null,
  cheaper_fixes jsonb not null default '[]'::jsonb,
  regenerate_only jsonb not null default '[]'::jsonb,
  locked_attributes_to_preserve jsonb not null default '[]'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists studio_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete cascade,
  telegram_update_id bigint unique,
  telegram_message_id bigint,
  direction text not null check (direction in ('inbound', 'outbound', 'system')),
  source text not null check (source in ('telegram', 'dashboard', 'orchestrator')),
  text text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  campaign_id uuid references campaigns(id) on delete cascade,
  run_version integer not null,
  event_type text not null,
  status text not null default 'claimed' check (status in ('claimed', 'completed', 'failed', 'stale')),
  result jsonb,
  error text,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists studio_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  username text not null,
  credential_fingerprint text not null,
  ip_hash text not null,
  user_agent text not null,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table studio_sessions
  add column if not exists credential_fingerprint text;
delete from studio_sessions where credential_fingerprint is null;
alter table studio_sessions
  alter column credential_fingerprint set not null;

create table if not exists auth_login_rate_limits (
  key_hash text primary key,
  failures integer not null default 0,
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  last_attempt_at timestamptz not null default now()
);

create index if not exists campaigns_status_idx on campaigns(status, campaign_date desc);
create index if not exists messages_campaign_created_idx on studio_messages(campaign_id, created_at desc);
create index if not exists prompts_campaign_version_idx on prompt_versions(campaign_id, version desc);
create index if not exists uploads_campaign_created_idx on media_uploads(campaign_id, created_at desc);
create index if not exists studio_sessions_expiry_idx
  on studio_sessions(expires_at)
  where revoked_at is null;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists campaigns_set_updated_at on campaigns;
create trigger campaigns_set_updated_at
before update on campaigns
for each row execute function set_updated_at();

create or replace function claim_daily_campaign(p_date date)
returns campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  result campaigns;
begin
  perform pg_advisory_xact_lock(hashtext('aura-daily-' || p_date::text));
  insert into campaigns (campaign_date, thread_id)
  values (p_date, 'campaign:' || p_date::text)
  on conflict (campaign_date) do nothing;
  select * into result from campaigns where campaign_date = p_date;
  return result;
end;
$$;

create or replace function claim_workflow_run(
  p_key text,
  p_campaign_id uuid,
  p_run_version integer,
  p_event_type text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result workflow_runs;
begin
  insert into workflow_runs (idempotency_key, campaign_id, run_version, event_type)
  values (p_key, p_campaign_id, p_run_version, p_event_type)
  on conflict (idempotency_key) do nothing
  returning * into result;
  if found then
    return to_jsonb(result) || jsonb_build_object('is_new', true);
  end if;
  select * into result from workflow_runs where idempotency_key = p_key;
  return to_jsonb(result) || jsonb_build_object('is_new', false);
end;
$$;

create or replace function login_is_allowed(p_key_hash text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from auth_login_rate_limits
    where key_hash = p_key_hash
      and locked_until is not null
      and locked_until > now()
  );
$$;

create or replace function record_login_attempt(
  p_key_hash text,
  p_success boolean,
  p_limit integer,
  p_lock_minutes integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row auth_login_rate_limits;
  next_failures integer;
begin
  perform pg_advisory_xact_lock(hashtext('aura-login-' || p_key_hash));

  if p_success then
    delete from auth_login_rate_limits where key_hash = p_key_hash;
    return;
  end if;

  select * into current_row
  from auth_login_rate_limits
  where key_hash = p_key_hash
  for update;

  if not found or current_row.window_started_at < now() - interval '15 minutes' then
    insert into auth_login_rate_limits (
      key_hash,
      failures,
      window_started_at,
      locked_until,
      last_attempt_at
    )
    values (p_key_hash, 1, now(), null, now())
    on conflict (key_hash) do update set
      failures = 1,
      window_started_at = now(),
      locked_until = null,
      last_attempt_at = now();
    return;
  end if;

  next_failures := current_row.failures + 1;
  update auth_login_rate_limits set
    failures = next_failures,
    locked_until = case
      when next_failures >= greatest(p_limit, 1)
        then now() + make_interval(mins => greatest(p_lock_minutes, 1))
      else locked_until
    end,
    last_attempt_at = now()
  where key_hash = p_key_hash;
end;
$$;

alter table campaigns enable row level security;
alter table trend_ideas enable row level security;
alter table prompt_versions enable row level security;
alter table media_uploads enable row level security;
alter table evaluations enable row level security;
alter table studio_messages enable row level security;
alter table workflow_runs enable row level security;
alter table studio_sessions enable row level security;
alter table auth_login_rate_limits enable row level security;

revoke all on table campaigns from anon, authenticated;
revoke all on table trend_ideas from anon, authenticated;
revoke all on table prompt_versions from anon, authenticated;
revoke all on table media_uploads from anon, authenticated;
revoke all on table evaluations from anon, authenticated;
revoke all on table studio_messages from anon, authenticated;
revoke all on table workflow_runs from anon, authenticated;
revoke all on table studio_sessions from anon, authenticated;
revoke all on table auth_login_rate_limits from anon, authenticated;

revoke all on function claim_daily_campaign(date) from public, anon, authenticated;
revoke all on function claim_workflow_run(text, uuid, integer, text)
  from public, anon, authenticated;
revoke all on function login_is_allowed(text) from public, anon, authenticated;
revoke all on function record_login_attempt(text, boolean, integer, integer)
  from public, anon, authenticated;

grant execute on function claim_daily_campaign(date) to service_role;
grant execute on function claim_workflow_run(text, uuid, integer, text) to service_role;
grant execute on function login_is_allowed(text) to service_role;
grant execute on function record_login_attempt(text, boolean, integer, integer)
  to service_role;

insert into storage.buckets (id, name, public)
values ('aura-content-media', 'aura-content-media', false)
on conflict (id) do update set public = false;

-- No client policies are created. The private dashboard accesses data and media
-- through authenticated server routes using the service role.

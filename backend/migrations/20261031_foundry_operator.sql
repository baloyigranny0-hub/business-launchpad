create extension if not exists pgcrypto;

create table if not exists public.founder_profiles (
  founder_id uuid primary key default gen_random_uuid(),
  auth_subject text unique,
  trade text not null default '',
  business_name text not null default '',
  business_stage text not null default 'idea',
  location_context text not null default 'South Africa',
  weekly_capacity_hours integer,
  revenue_goal numeric,
  current_blocker text not null default 'unknown',
  timezone text not null default 'Africa/Johannesburg',
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.business_sprints (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(founder_id) on delete cascade,
  title text not null,
  objective text not null,
  status text not null default 'active',
  start_date date not null,
  target_date date,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(founder_id) on delete cascade,
  sprint_id uuid references public.business_sprints(id) on delete set null,
  task_date date not null,
  plan_key text not null,
  title text not null,
  category text not null,
  priority integer not null default 1 check (priority between 1 and 3),
  revenue_proximity text not null default 'direct',
  why_now text not null default '',
  steps jsonb not null default '[]'::jsonb,
  expected_output text not null default '',
  definition_of_done text not null default '',
  estimated_minutes integer not null default 30,
  status text not null default 'open',
  blocked_reason text,
  completion_evidence text,
  source text not null default 'agent',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (founder_id, task_date, id)
);

create unique index if not exists daily_tasks_plan_key_idx on public.daily_tasks(founder_id, task_date, plan_key, id);

create table if not exists public.operational_templates (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(founder_id) on delete cascade,
  template_type text not null,
  name text not null,
  content jsonb not null,
  trade text not null default '',
  version integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(founder_id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  task_id uuid references public.daily_tasks(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(founder_id) on delete cascade,
  session_date date not null,
  diagnosis text not null,
  recommended_focus text not null,
  outcome text,
  token_usage integer,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.agent_audit_log (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founder_profiles(founder_id) on delete cascade,
  tool_name text not null,
  arguments jsonb not null default '{}'::jsonb,
  validation_result jsonb not null default '{}'::jsonb,
  result_summary jsonb not null default '{}'::jsonb,
  success boolean not null,
  model_provider text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists daily_tasks_founder_date_idx on public.daily_tasks(founder_id, task_date);
create index if not exists audit_founder_created_idx on public.agent_audit_log(founder_id, created_at desc);

alter table public.founder_profiles enable row level security;
alter table public.business_sprints enable row level security;
alter table public.daily_tasks enable row level security;
alter table public.operational_templates enable row level security;
alter table public.reminders enable row level security;
alter table public.mentor_sessions enable row level security;
alter table public.agent_audit_log enable row level security;

create policy founder_profiles_owner on public.founder_profiles for all using (auth.uid()::text = auth_subject) with check (auth.uid()::text = auth_subject);
create policy sprint_owner on public.business_sprints for all using (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject)) with check (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject));
create policy daily_tasks_owner on public.daily_tasks for all using (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject)) with check (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject));
create policy templates_owner on public.operational_templates for all using (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject)) with check (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject));
create policy reminders_owner on public.reminders for all using (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject)) with check (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject));
create policy mentor_owner on public.mentor_sessions for all using (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject)) with check (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject));
create policy audit_owner on public.agent_audit_log for all using (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject)) with check (founder_id in (select founder_id from public.founder_profiles where auth.uid()::text = auth_subject));

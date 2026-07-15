-- Mesa Padawan — Supabase schema
--
-- Run this once in your Supabase project: SQL Editor → New query → paste →
-- Run. It creates the shared tables and Row Level Security policies so that
-- every logged-in user reads and writes the SAME data (shared team + ranking).

-- Assessores da mesa
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  photo_url text,
  tempo_mesa_meses numeric default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Lançamentos semanais
create table if not exists public.weekly_entries (
  id uuid primary key default gen_random_uuid(),
  assessor text not null,
  week_start date not null,
  captacao numeric default 0,
  consorcio numeric default 0,
  reuniao_agendada numeric default 0,
  reuniao_realizada numeric default 0,
  r1 numeric default 0,
  r2 numeric default 0,
  reuniao_ip numeric default 0,
  reuniao_ap numeric default 0,
  pa numeric default 0,
  receita_escritorio numeric default 0,
  recomendacoes numeric default 0,
  contas numeric default 0,
  contas_totais numeric default 0,
  patrimonio_liquido numeric default 0,
  pipe_proxima_semana numeric default 0,
  pipe_ip numeric default 0,
  pipe_ap numeric default 0,
  total_points numeric default 0,
  breakdown jsonb default '[]'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Migration (safe to re-run): add PIPE columns to an existing weekly_entries.
alter table public.weekly_entries add column if not exists pipe_proxima_semana numeric default 0;
alter table public.weekly_entries add column if not exists pipe_ip numeric default 0;
alter table public.weekly_entries add column if not exists pipe_ap numeric default 0;

-- Migration (safe to re-run): add tempo de mesa to an existing team_members.
alter table public.team_members add column if not exists tempo_mesa_meses numeric default 0;

-- Enable Row Level Security
alter table public.team_members enable row level security;
alter table public.weekly_entries enable row level security;

-- Any authenticated (logged-in) user can read and write the shared data.
drop policy if exists "team_members access" on public.team_members;
create policy "team_members access" on public.team_members
  for all to authenticated using (true) with check (true);

drop policy if exists "weekly_entries access" on public.weekly_entries;
create policy "weekly_entries access" on public.weekly_entries
  for all to authenticated using (true) with check (true);

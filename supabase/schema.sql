-- ============================================================
-- Kämpe Hub, databaseskjema
-- Kjøres i Supabase: SQL Editor > New query > lim inn > Run.
-- Trygg å kjøre flere ganger (alt er idempotent).
--
-- Alle tabeller har id, user_id, created_at.
-- user_id settes automatisk til den innloggede brukeren, slik at
-- verken appen eller de schedulerte oppgavene trenger å sende den.
-- Row Level Security er på overalt og låser hver rad til eieren.
-- ============================================================

-- ---------- Hjelpere ----------

create or replace function public.set_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

-- Setter user_id-default, trigger, RLS og eier-policy på en tabell.
create or replace function public.secure_table(tbl text)
returns void
language plpgsql
as $$
begin
  execute format('alter table public.%I enable row level security', tbl);

  execute format(
    'drop trigger if exists set_user_id_trg on public.%I', tbl);
  execute format(
    'create trigger set_user_id_trg before insert on public.%I
     for each row execute function public.set_user_id()', tbl);

  execute format('drop policy if exists owner_all on public.%I', tbl);
  execute format(
    'create policy owner_all on public.%I
     for all to authenticated
     using (user_id = auth.uid())
     with check (user_id = auth.uid())', tbl);

  execute format(
    'create index if not exists %I on public.%I (user_id)',
    tbl || '_user_id_idx', tbl);
end;
$$;

-- ---------- Tabeller ----------

-- Timer per bucket per dag. Unik på dato og bucket slik at
-- hurtigloggen kan skrive med upsert i stedet for å lage duplikater.
create table if not exists public.time_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null default current_date,
  bucket text not null check (bucket in ('biz_dev', 'client', 'content', 'growth', 'travel')),
  hours numeric(5, 2) not null default 0 check (hours >= 0 and hours <= 24),
  note text,
  unique (user_id, date, bucket)
);

-- De fem vekstpunktene, avkrysning per dag.
create table if not exists public.growth_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null default current_date,
  item text not null check (item in ('workout', 'yoga', 'read', 'connection', 'skill')),
  done boolean not null default false,
  note text,
  unique (user_id, date, item)
);

create table if not exists public.mandates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  client_name text not null,
  area text,
  stage text not null default 'mandat signert'
    check (stage in ('mandat signert', 'søk', 'visning', 'bud', 'compromesso', 'rogito', 'ferdig')),
  next_step text,
  next_step_due date,
  viewing_from date,
  viewing_to date,
  fee_total numeric(12, 2),
  fee_paid numeric(12, 2) default 0,
  notes text,
  notion_url text
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  area text not null default 'jobb' check (area in ('jobb', 'privat')),
  category text check (category in ('kunde', 'admin', 'innhold', 'økonomi', 'vekst')),
  status text not null default 'åpen' check (status in ('åpen', 'i gang', 'ferdig')),
  due_date date,
  priority smallint not null default 2 check (priority between 1 and 3),
  linked_type text,
  linked_id uuid,
  source text not null default 'manuell' check (source in ('manuell', 'claude', 'notion')),
  url text
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  category text check (category in ('P.IVA', 'FIF', 'juridisk', 'skatt', 'drift')),
  status text not null default 'åpen' check (status in ('åpen', 'i gang', 'ferdig', 'blokkert')),
  due_date date,
  blocker text,
  owner text check (owner in ('Kristine', 'commercialista', 'Carlo', 'Irene')),
  notes text,
  url text
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  client text not null,
  amount_eur numeric(12, 2) not null,
  issued_date date,
  paid_date date,
  status text not null default 'sendt' check (status in ('utkast', 'sendt', 'betalt', 'forfalt')),
  mandate_id uuid references public.mandates (id) on delete set null
);

create table if not exists public.content_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  week_start date not null,
  account text not null check (account in ('kampeestates', 'kristinehasselo')),
  followers_net integer,
  reach integer,
  engagement_rate numeric(6, 3),
  profile_visits integer,
  link_clicks integer,
  posts_published integer,
  unique (user_id, week_start, account)
);

create table if not exists public.content_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  planned_date date,
  format text check (format in ('reel', 'karusell', 'enkeltbilde')),
  theme text,
  caption_dir text,
  status text not null default 'idé' check (status in ('idé', 'produseres', 'klar', 'publisert')),
  canva_url text,
  notion_url text
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null,
  area text,
  price_eur numeric(12, 2),
  sqm numeric(8, 2),
  price_per_sqm numeric(12, 2) generated always as (
    case when sqm is not null and sqm > 0 then round(price_eur / sqm, 2) end
  ) stored,
  status text,
  listing_url text,
  notion_url text,
  client_shortlist uuid references public.mandates (id) on delete set null
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  metric text,
  target_value numeric(14, 2),
  current_value numeric(14, 2) default 0,
  unit text,
  deadline date,
  category text
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  label text not null,
  url text not null,
  category text not null default 'annet',
  sort_order integer not null default 0
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  period_type text not null check (period_type in ('dag', 'uke', 'måned', 'kvartal', 'år')),
  period_start date not null,
  summary text,
  patterns text,
  adjustments text,
  written_by text default 'claude',
  unique (user_id, period_type, period_start)
);

-- ---------- Sikring ----------

select public.secure_table(t) from unnest(array[
  'time_logs', 'growth_log', 'mandates', 'tasks', 'milestones',
  'invoices', 'content_metrics', 'content_plan', 'properties',
  'goals', 'links', 'reviews'
]) as t;

-- ---------- Indekser på det appen sorterer og filtrerer på ----------

create index if not exists time_logs_date_idx on public.time_logs (user_id, date desc);
create index if not exists growth_log_date_idx on public.growth_log (user_id, date desc);
create index if not exists tasks_open_idx on public.tasks (user_id, status, priority, due_date);
create index if not exists mandates_stage_idx on public.mandates (user_id, stage);
create index if not exists milestones_due_idx on public.milestones (user_id, due_date);
create index if not exists invoices_issued_idx on public.invoices (user_id, issued_date desc);
create index if not exists content_metrics_week_idx on public.content_metrics (user_id, week_start desc);
create index if not exists content_plan_date_idx on public.content_plan (user_id, planned_date);
create index if not exists reviews_period_idx on public.reviews (user_id, period_type, period_start desc);
create index if not exists links_sort_idx on public.links (user_id, category, sort_order);

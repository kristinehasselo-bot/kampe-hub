-- ============================================================
-- Kämpe Hub, fase 4: gjør basen skrivbar for de schedulerte oppgavene
-- Kjøres i SQL Editor etter schema.sql. Trygg å kjøre flere ganger.
--
-- Problemet den løser:
-- De schedulerte oppgavene skriver med service role-nøkkelen. Den
-- omgår Row Level Security, men den har ingen innlogget bruker, så
-- auth.uid() er NULL. Triggeren som fyller user_id hadde da ingenting
-- å fylle med, og hver skriving ville feilet på not-null.
--
-- Løsningen: én rad som sier hvem huben tilhører. Er det ingen
-- innlogget bruker, faller triggeren tilbake på den raden. Dermed
-- slipper oppgavene å kjenne bruker-id-en din i det hele tatt, og
-- SQL Editor virker også.
-- ============================================================

create table if not exists public.app_owner (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- Huben har én eier. Indeksen gjør det umulig å legge til rad nummer to.
create unique index if not exists app_owner_single_row on public.app_owner ((true));

insert into public.app_owner (user_id, email)
select id, email from auth.users where email = 'kristine@kampeestates.com'
on conflict (user_id) do nothing;

alter table public.app_owner enable row level security;

drop policy if exists owner_read on public.app_owner;
create policy owner_read on public.app_owner
  for select to authenticated
  using (user_id = auth.uid());

-- ---------- Hvem raden tilhører ----------

create or replace function public.owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.uid(),
    (select user_id from public.app_owner limit 1)
  );
$$;

-- Appen bruker fortsatt auth.uid(). Service role og SQL Editor faller
-- tilbake på eierraden. Anonyme kallere stoppes uansett av RLS, som
-- kun slipper inn rollen authenticated, så fallbacken kan ikke
-- misbrukes til å skrive rader i hennes navn.
create or replace function public.set_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := public.owner_id();
  end if;

  if new.user_id is null then
    raise exception 'Ingen eier funnet. Kjor insert i public.app_owner forst.';
  end if;

  return new;
end;
$$;

-- ---------- Mål må kunne oppdateres på navn ----------
-- Ukesretroen og kvartalsgjennomgangen skriver current_value tilbake.
-- Uten denne kan de ikke bruke upsert og måtte lest først.

create unique index if not exists goals_user_name_idx
  on public.goals (user_id, name);

-- ---------- Kontroll ----------

select
  (select count(*) from public.app_owner) as eierrader,
  (select email from public.app_owner limit 1) as eier,
  public.owner_id() as owner_id_loser_til;

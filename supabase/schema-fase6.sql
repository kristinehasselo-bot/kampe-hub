-- ============================================================
-- Kämpe Hub, fase 6: valutakurs
-- Kjøres i SQL Editor etter schema.sql og schema-fase4.sql.
-- Trygg å kjøre flere ganger.
--
-- Kursen skrives av en GitHub Action, ikke av Claude. Den bruker
-- service role-nøkkelen, som ikke har noen innlogget bruker, så den
-- er avhengig av eierraden fra schema-fase4.sql for at user_id skal
-- fylles. Kjør fase 4 først hvis du ikke har gjort det.
-- ============================================================

create table if not exists public.rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  date date not null default current_date,
  base text not null default 'EUR',
  quote text not null default 'NOK',
  rate numeric(12, 6) not null check (rate > 0),
  -- Én kurs per dag per par, så jobben kan upserte i stedet for å
  -- lage en ny rad hver gang den kjører.
  unique (user_id, date, base, quote)
);

-- secure_table er definert i schema.sql: setter user_id-trigger, RLS og
-- eier-policy. Trigger-funksjonen ble oppdatert i fase 4 til å falle
-- tilbake på eierraden når det ikke finnes en innlogget bruker.
select public.secure_table('rates');

create index if not exists rates_lookup_idx
  on public.rates (user_id, base, quote, date desc);

-- Kontroll.
select count(*) as rader, max(date) as nyeste from public.rates;

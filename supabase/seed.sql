-- ============================================================
-- Kämpe Hub, startdata
-- Kjøres i SQL Editor etter schema.sql.
--
-- VIKTIG: SQL Editor kjører som rollen postgres, ikke som deg som
-- innlogget bruker. auth.uid() er derfor NULL her inne, og triggeren
-- som ellers fyller user_id automatisk har ingenting å fylle med.
-- Derfor slår denne filen opp bruker-id-en din eksplisitt.
--
-- Logget du inn med en annen adresse, bytt den ut begge steder under.
--
-- Bytt ut lenkene med de du faktisk bruker. Kategoriene styrer
-- grupperingen i lenkegriden nederst på Hjem.
--
-- Trygg å kjøre flere ganger. Rader som allerede finnes hoppes over.
-- ============================================================

with me as (
  select id from auth.users where email = 'kristine@kampeestates.com'
)
insert into public.links (user_id, label, url, category, sort_order)
select me.id, v.label, v.url, v.category, v.sort_order
from me
cross join (values
  ('Notion, eiendommer',  'https://notion.so',                     'arbeid',  1),
  ('Notion, kunder',      'https://notion.so',                     'arbeid',  2),
  ('Google Drive',        'https://drive.google.com',              'arbeid',  3),
  ('Gmail',               'https://mail.google.com',               'arbeid',  4),
  ('Kalender',            'https://calendar.google.com',           'arbeid',  5),
  ('Canva',               'https://canva.com',                     'innhold', 1),
  ('Instagram, KE',       'https://instagram.com/kampeestates',    'innhold', 2),
  ('Instagram, Kristine', 'https://instagram.com/kristinehasselo', 'innhold', 3),
  ('Idealista',           'https://idealista.it',                  'marked',  1),
  ('Immobiliare',         'https://immobiliare.it',                'marked',  2),
  ('Agenzia Entrate',     'https://agenziaentrate.gov.it',         'admin',   1),
  ('Supabase',            'https://supabase.com/dashboard',        'admin',   2)
) as v(label, url, category, sort_order)
where not exists (
  select 1 from public.links l
  where l.user_id = me.id and l.label = v.label
);

-- Inntektsmålet som vises i nøkkeltallsraden på Hjem. Appen leter etter
-- akkurat dette navnet, så ikke endre det uten å endre constants.ts.
with me as (
  select id from auth.users where email = 'kristine@kampeestates.com'
)
insert into public.goals (user_id, name, metric, target_value, current_value, unit, category)
select me.id, 'Månedlig fakturert', 'invoices.amount_eur', 3500, 0, 'EUR', 'økonomi'
from me
where not exists (
  select 1 from public.goals g
  where g.user_id = me.id and g.name = 'Månedlig fakturert'
);

-- Kontroll. Forventet: 12 lenker og 1 mål etter første kjøring.
select
  (select count(*) from public.links
     where user_id = (select id from auth.users where email = 'kristine@kampeestates.com')) as lenker,
  (select count(*) from public.goals
     where user_id = (select id from auth.users where email = 'kristine@kampeestates.com')) as maal;

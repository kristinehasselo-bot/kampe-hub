-- ============================================================
-- Kämpe Hub, startdata
-- Kjøres i SQL Editor MENS du er logget inn i Supabase, etter schema.sql.
-- user_id fylles automatisk av triggeren.
--
-- Bytt ut lenkene under med de du faktisk bruker. Kategoriene
-- styrer grupperingen i lenkegriden nederst på Hjem.
-- ============================================================

insert into public.links (label, url, category, sort_order) values
  ('Notion, eiendommer',   'https://notion.so',              'arbeid',    1),
  ('Notion, kunder',       'https://notion.so',              'arbeid',    2),
  ('Google Drive',         'https://drive.google.com',       'arbeid',    3),
  ('Gmail',                'https://mail.google.com',        'arbeid',    4),
  ('Kalender',             'https://calendar.google.com',    'arbeid',    5),
  ('Canva',                'https://canva.com',              'innhold',   1),
  ('Instagram, KE',        'https://instagram.com/kampeestates',    'innhold', 2),
  ('Instagram, Kristine',  'https://instagram.com/kristinehasselo', 'innhold', 3),
  ('Idealista',            'https://idealista.it',           'marked',    1),
  ('Immobiliare',          'https://immobiliare.it',         'marked',    2),
  ('Agenzia Entrate',      'https://agenziaentrate.gov.it',  'admin',     1),
  ('Supabase',             'https://supabase.com/dashboard', 'admin',     2);

-- Inntektsmålet som vises i nøkkeltallsraden. Appen leter etter
-- akkurat dette navnet, så ikke endre det uten å endre constants.ts.
insert into public.goals (name, metric, target_value, current_value, unit, category) values
  ('Månedlig fakturert', 'invoices.amount_eur', 3500, 0, 'EUR', 'økonomi');

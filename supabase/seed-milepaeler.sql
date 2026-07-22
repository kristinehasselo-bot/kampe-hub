-- ============================================================
-- Kämpe Hub, milepælene som er fremhevet i kravspesifikasjonen.
-- Kjøres i SQL Editor etter schema.sql.
--
-- VIKTIG: SQL Editor kjører som rollen postgres, ikke som deg som
-- innlogget bruker. auth.uid() er derfor NULL her inne, og triggeren
-- som ellers fyller user_id automatisk har ingenting å fylle med.
-- Derfor slår denne filen opp bruker-id-en din eksplisitt.
--
-- Logget du inn med en annen adresse, bytt den ut under.
--
-- Trygg å kjøre flere ganger. Rader som allerede finnes hoppes over.
-- ============================================================

with me as (
  select id from auth.users where email = 'kristine@kampeestates.com'
)
insert into public.milestones
  (user_id, title, category, status, due_date, blocker, owner, notes)
select me.id, v.title, v.category, v.status, v.due_date, v.blocker, v.owner, v.notes
from me
cross join (values
  (
    'P.IVA-registrering',
    'P.IVA',
    'åpen',
    null::date,
    null::text,
    'commercialista',
    'Forutsetning for å fakturere. Alt annet i økonomisporet henger på denne.'
  ),
  (
    'FIF Sezione G',
    'FIF',
    'åpen',
    null::date,
    null::text,
    'Kristine',
    'Registrering i meglerregisteret. Kreves for å ta mandat i eget navn.'
  ),
  (
    'Carlos gjennomgang av oppdragsavtalen',
    'juridisk',
    'åpen',
    null::date,
    null::text,
    'Carlo',
    'Standard oppdragsavtale må være juridisk gjennomgått før neste mandat signeres.'
  ),
  (
    'Impatriati',
    'skatt',
    'åpen',
    null::date,
    'Krever registrert residenza',
    'commercialista',
    'Tidssensitiv. Fristen løper mot datoen residenza faktisk blir registrert, ikke mot søknadsdatoen. Sett frist så snart residenza-datoen er kjent.'
  )
) as v(title, category, status, due_date, blocker, owner, notes)
where not exists (
  select 1 from public.milestones m
  where m.user_id = me.id and m.title = v.title
);

-- Kontroll. Forventet: 4 etter første kjøring.
select count(*) as milepaeler_lagt_inn
from public.milestones
where user_id = (select id from auth.users where email = 'kristine@kampeestates.com');

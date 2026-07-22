-- ============================================================
-- Kämpe Hub, milepælene som er fremhevet i kravspesifikasjonen.
-- Kjøres i SQL Editor mens du er innlogget, etter schema.sql.
--
-- Frister og blokkeringer er satt til det spesifikasjonen sier, og
-- der den ikke sier noe står feltet tomt. Rediger dem i appen, ikke her.
-- ============================================================

insert into public.milestones (title, category, status, due_date, blocker, owner, notes) values
  (
    'P.IVA-registrering',
    'P.IVA',
    'åpen',
    null,
    null,
    'commercialista',
    'Forutsetning for å fakturere. Alt annet i økonomisporet henger på denne.'
  ),
  (
    'FIF Sezione G',
    'FIF',
    'åpen',
    null,
    null,
    'Kristine',
    'Registrering i meglerregisteret. Kreves for å ta mandat i eget navn.'
  ),
  (
    'Carlos gjennomgang av oppdragsavtalen',
    'juridisk',
    'åpen',
    null,
    null,
    'Carlo',
    'Standard oppdragsavtale må være juridisk gjennomgått før neste mandat signeres.'
  ),
  (
    'Impatriati',
    'skatt',
    'åpen',
    null,
    'Krever registrert residenza',
    'commercialista',
    'Tidssensitiv. Fristen løper mot datoen residenza faktisk blir registrert, ikke mot søknadsdatoen. Sett due_date så snart residenza-datoen er kjent.'
  );

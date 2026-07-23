-- ============================================================
-- Kämpe Hub, Notion-synk av eiendommer
-- Kjøres i SQL Editor etter schema.sql og schema-fase4.sql.
-- Trygg å kjøre flere ganger.
--
-- Eiendommene lever i Notion. En schedulert oppgave i claude.ai leser
-- dem med Notion-koblingen og skriver dem hit via Edge Function-en, på
-- samme smale mønster som de andre oppgavene. Idealista har ingen API,
-- så ingenting skrapes.
--
-- Denne unike nøkkelen lar synken bruke upsert: en eiendom som allerede
-- finnes oppdateres i stedet for å bli lagt inn på nytt. Notion-sidens
-- URL er stabil per eiendom og brukes som nøkkel.
-- ============================================================

create unique index if not exists properties_user_notion_idx
  on public.properties (user_id, notion_url);

-- Kontroll.
select count(*) as eiendommer from public.properties;

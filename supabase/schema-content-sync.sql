-- ============================================================
-- Kämpe Hub, innholdssynk fra Notion
-- Kjøres i SQL Editor etter schema.sql. Trygg å kjøre flere ganger.
--
-- To ting:
-- 1. Newsletter blir et gyldig format ved siden av reel, karusell og
--    enkeltbilde, siden nyhetsbrevene skal med i huben.
-- 2. content_plan får en unik nøkkel på notion_url, så synken kan
--    oppdatere en post i stedet for å lage en ny hver gang.
-- ============================================================

alter table public.content_plan drop constraint if exists content_plan_format_check;
alter table public.content_plan add constraint content_plan_format_check
  check (format in ('reel', 'karusell', 'enkeltbilde', 'newsletter'));

create unique index if not exists content_plan_notion_url_idx
  on public.content_plan (user_id, notion_url);

-- Kontroll.
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'content_plan' and column_name = 'notion_url';

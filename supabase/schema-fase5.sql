-- ============================================================
-- Kämpe Hub, fase 5: innhold og økonomi
-- Kjøres i SQL Editor etter schema.sql. Trygg å kjøre flere ganger.
--
-- Format-rangeringen skal vise hva som faktisk driver rekkevidde.
-- Rekkevidde per post finnes ikke i content_metrics, som er ukesnivå
-- per konto. Derfor får content_plan to valgfrie tall som fylles inn
-- når en post er publisert, enten i appen eller av KE-review. Uten dem
-- rangerer appen bare på antall, med dem rangerer den på rekkevidde.
-- ============================================================

alter table public.content_plan
  add column if not exists reach integer,
  add column if not exists engagement_rate numeric(6, 3);

-- Kontroll.
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'content_plan'
  and column_name in ('reach', 'engagement_rate')
order by column_name;

# Notion til hub-synk

Speiler innhold og eiendommer fra Notion inn i huben. Kjører som en GitHub
Action fire ganger om dagen, fordi GitHub-kjøringene når både Notion og
huben, i motsetning til claude.ai-oppgavene.

Dette erstatter den gamle eiendomsoppgaven (oppgave 6 i claude.ai), som
aldri virket fordi den ble stoppet av nettverksblokkeringen. Den kan du
slette i claude.ai når denne står.

## Hva som synkes

**Innhold, Content Calendar → content_plan.** Reel, Carousel, Post og
Newsletter, med status og dato. Story hoppes over. Du jobber i Notion,
huben speiler kalenderen.

**Eiendommer, Properties → properties.** Bare de som er Godkjent og ikke
Solgt. Navn, beliggenhet, pris, størrelse, status og lenke.

Begge oppdaterer på Notion-sidens URL, så en post eller eiendom som
allerede finnes rettes i stedet for å dupliseres. Retningen er én vei,
Notion skriver til huben, aldri motsatt.

## Oppsett, gjøres én gang

**1. Kjør SQL.** `supabase/schema-content-sync.sql` gir content_plan plass
til newsletter og en nøkkel for synken.

**2. Lag en Notion-integrasjon.**
- Gå til notion.so/my-integrations, ny intern integrasjon, kall den for
  eksempel «Kämpe Hub synk».
- Kopier hemmeligheten, den starter med `secret_` eller `ntn_`.
- Åpne Properties-databasen og Content Calendar i Notion, trykk de tre
  prikkene øverst til høyre, Connections, og legg til integrasjonen. Uten
  dette ser den ikke databasene.

**3. Legg hemmeligheten i GitHub.** Settings, Secrets and variables,
Actions, ny hemmelighet `NOTION_TOKEN` med verdien fra steg 2.
`SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` ligger der allerede fra
valutakursjobben.

**4. Kjør den.** Actions-fanen, «Notion til hub», kjør manuelt én gang.
Deretter går den av seg selv fire ganger om dagen.

## Kjøre lokalt

Med de tre miljøvariablene satt:

```bash
node claude-tasks/notion-sync.mjs         # begge
node claude-tasks/notion-sync.mjs content # bare innhold
node claude-tasks/notion-sync.mjs props   # bare eiendommer
node claude-tasks/notion-sync.mjs --dry   # vis uten å skrive
```

## Feltmapping

Innhold:

| Notion Content type | Hub-format |
| :-- | :-- |
| Reel | reel |
| Carousel | karusell |
| Post | enkeltbilde |
| Newsletter | newsletter |
| Story | hoppes over |

| Notion Status | Hub-status |
| :-- | :-- |
| Not started | idé |
| Writing, Filming/editing | produseres |
| Planned | klar |
| Published | publisert |

Eiendommer: Navn → tittel, Beliggenhet → område, Pris (€) → pris,
Størrelse (m2) → kvadratmeter, Status → status uten emoji, Lenke →
annonselenke.

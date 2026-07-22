# De schedulerte oppgavene

Fem oppgaver skriver til Kämpe Hub. Appen leser bare ut. Integrasjonene mot
Notion, Google Calendar, Gmail og Drive lever fortsatt på Claude-siden, og
resultatet havner i Supabase i stedet for i en artifact.

| Fil | Når | Skriver til |
| :-- | :-- | :-- |
| [1-hverdagsbrief.md](1-hverdagsbrief.md) | hverdager 09:00 | `tasks`, `reviews` (dag) |
| [2-ukesretro.md](2-ukesretro.md) | søndag 10:00 | `reviews` (uke), `goals` |
| [3-ke-ukentlig-review.md](3-ke-ukentlig-review.md) | mandag | `content_metrics`, `content_plan` |
| [4-manedsgjennomgang.md](4-manedsgjennomgang.md) | siste dag i måneden | `reviews` (måned), `goals` |
| [5-kvartalsgjennomgang.md](5-kvartalsgjennomgang.md) | hvert kvartal | `reviews` (kvartal), `goals` |

## Hvorfor et skript og ikke rå HTTP i hver prompt

Service role-nøkkelen omgår all sikkerhet i basen. Skrives den inn i fem
prompt-tekster, finnes den fem steder, og de stedene er lette å dele
videre ved et uhell. `hub.mjs` eier nøkkelen alene. Promptene kaller
skriptet og ser den aldri.

Skriptet skriver heller aldri nøkkelen ut, heller ikke i feilmeldinger.

## Oppsett

**1. Kjør `supabase/schema-fase4.sql`** i SQL Editor. Uten den feiler alle
fem oppgavene på `user_id`, fordi service role-nøkkelen ikke har noen
innlogget bruker å utlede eieren fra.

**2. Lag nøkkelfilen.** Den skal ligge utenfor repoet:

```
C:\Users\krist\.kampe-hub\env
```

med to linjer:

```
SUPABASE_URL=https://ilcevdjpybfkrpgdauob.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Service role-nøkkelen finner du i Supabase under Project Settings, API.
Den skal aldri inn i repoet, aldri i en prompt og aldri i en chat.

**3. Test uten å skrive noe.** Legg til `--dry` på slutten, så viser
skriptet hva det ville sendt uten å røre basen:

```bash
node C:\Users\krist\dev\kampe-hub\claude-tasks\hub.mjs context
```

`context` leser bare, så den er trygg å kjøre når som helst. Får du JSON
tilbake, virker oppsettet.

**4. Lim inn promptene** der de fem oppgavene faktisk kjører, én fil per
oppgave. Cron-uttrykkene står øverst i hver fil.

## Kommandoene

| Kommando | Gjør |
| :-- | :-- |
| `context` | Leser hele statusbildet i ett kall. Kun lesing. |
| `tasks:add '<json>'` | Legger til oppgaver, hopper over titler som allerede står åpne. |
| `review '<json>'` | Skriver en retro. Én per periode, gjentatt kjøring oppdaterer. |
| `metrics '<json>'` | Ukens instagramtall. Unik på uke og konto. |
| `plan '<json>'` | Forslag til innholdsplanen. Dedupliserer ikke. |
| `goal '<json>'` | Oppdaterer eller oppretter et mål på navn. |

Alle tar `--dry` for å se hva som ville skjedd.

## Det som er trygt å kjøre om igjen

`review`, `metrics` og `goal` bruker upsert og retter seg selv hvis en
oppgave kjører to ganger. `tasks:add` sjekker mot åpne titler først.
`plan` er den eneste som lager duplikater, så den skal kalles én gang per
forslag.

## Krav til kjøremiljøet

Oppgavene må kunne kjøre `node`. Skriptet bruker innebygd `fetch` og
trenger derfor Node 18 eller nyere. Kan ikke miljøet der oppgavene kjører
starte prosesser, virker ikke denne løsningen, og da må oppgavene i stedet
gjøre HTTP-kallene selv med nøkkelen i prompten. Det er en dårligere løsning,
og vi bør heller flytte oppgavene til et miljø som kan kjøre skript.

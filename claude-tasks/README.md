# De schedulerte oppgavene

Fem oppgaver skriver til Kämpe Hub. Appen leser bare ut. Integrasjonene mot
Notion, Google Calendar, Gmail og Drive lever fortsatt på Claude-siden, og
resultatet havner i Supabase i stedet for i en artifact.

| Fil | Når | Får lov til |
| :-- | :-- | :-- |
| [1-hverdagsbrief.md](1-hverdagsbrief.md) | hverdager 09:00 | `context`, `tasks.add`, retro `dag` |
| [2-ukesretro.md](2-ukesretro.md) | søndag 10:00 | `context`, `goal.write`, retro `uke` |
| [3-ke-ukentlig-review.md](3-ke-ukentlig-review.md) | mandag | `metrics.write`, `plan.add`, `plan.recent`, `plan.setreach` |
| [4-manedsgjennomgang.md](4-manedsgjennomgang.md) | siste dag i måneden | `context`, `goal.write`, retro `måned` |
| [5-kvartalsgjennomgang.md](5-kvartalsgjennomgang.md) | hvert kvartal | `context`, `goal.write`, retro `kvartal` |

## Hvordan de skriver

Oppgavene kjører inne i claude.ai. De kan gjøre HTTP-kall, men de kan ikke
starte en prosess og har ikke noe filsystem. De snakker derfor med ett smalt
endepunkt, ikke med databasen direkte:

```
POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub
Authorization: Bearer <oppgavens eget token>
Content-Type: application/json

{ "op": "context" }
```

Koden ligger i [`supabase/functions/hub/index.ts`](../supabase/functions/hub/index.ts).

## Hvorfor det er bygget slik

**Service role-nøkkelen forlater aldri Supabase.** Supabase injiserer den
selv i Edge Functions, så den kopieres ikke av noen, står ingen steder i en
prompt og finnes ikke på din PC.

**Hvert token er smalt.** Ett token per oppgave, med en eksplisitt liste
over hva det får lov til. KE-review-tokenet kan skrive instagramtall,
innholdsforslag og rekkevidde per post, og lese innholdsplanen for å finne
riktig post. Det kan ikke lese kunde- eller økonomidata og ikke skrive
retroer. Hverdagsbrief-tokenet kan skrive dagsretro, men ikke overskrive
kvartalsgjennomgangen.

**Endepunktet stoler ikke på avsender.** Ingen tabellnavn kommer utenfra.
Felter som ikke står på listen kastes. Enumverdier valideres. Antall rader
per kall er begrenset. Det finnes ingen sletteoperasjon i det hele tatt.
`status`, `source` og `written_by` settes av serveren og kan ikke overstyres.

Et lekket token kan altså i verste fall gjøre nøyaktig det den ene oppgaven
gjør, og det kan trekkes tilbake alene uten å røre de fire andre.

## Oppsett

**1. Kjør `supabase/schema-fase4.sql`** i SQL Editor. Uten den feiler alle
fem, fordi service role-nøkkelen ikke har noen innlogget bruker å utlede
eieren fra.

**2. Lag fem tokens.** Kjør dette lokalt, én gang per oppgave:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Ikke lim dem inn i en chat. De skal bare to steder: inn i hemmeligheten
under, og inn i den ene prompten de tilhører.

**3. Sett hemmeligheten i Supabase.** Edge Functions, Secrets, ny
hemmelighet med navn `HUB_TOKENS` og denne JSON-en som verdi, med dine
egne tokens satt inn:

```json
{
  "TOKEN1": { "name": "hverdagsbrief", "ops": ["context", "tasks.add", "review.write"], "periods": ["dag"] },
  "TOKEN2": { "name": "ukesretro", "ops": ["context", "review.write", "goal.write"], "periods": ["uke"] },
  "TOKEN3": { "name": "ke-review", "ops": ["metrics.write", "plan.add", "plan.recent", "plan.setreach"] },
  "TOKEN4": { "name": "manedsgjennomgang", "ops": ["context", "review.write", "goal.write"], "periods": ["måned"] },
  "TOKEN5": { "name": "kvartalsgjennomgang", "ops": ["context", "review.write", "goal.write"], "periods": ["kvartal"] }
}
```

Du trenger ikke sette `SUPABASE_SERVICE_ROLE_KEY`. Den er der allerede.

**4. Deploy funksjonen:**

```bash
npx supabase functions deploy hub --project-ref ilcevdjpybfkrpgdauob --no-verify-jwt
```

`--no-verify-jwt` er nødvendig. Endepunktet gjør sin egen autentisering med
oppgavetokens, og uten flagget måtte oppgavene i tillegg sendt en
Supabase-nøkkel, som er nøyaktig det vi unngår.

**5. Test at det står.** Bytt inn hverdagsbrief-tokenet:

```bash
curl -s -X POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub -H "Authorization: Bearer DITT_TOKEN" -H "Content-Type: application/json" -d "{\"op\":\"context\"}"
```

Uten token skal du få 401. Med KE-review-tokenet skal `context` gi 403.
Skjer det ikke, er noe galt med `HUB_TOKENS`.

**6. Lim inn promptene** i de fem oppgavene i claude.ai, én fil per oppgave,
med riktig token satt inn der det står `TOKEN_HER`.

## Rotere et token

Bytt verdien i `HUB_TOKENS` og i den ene prompten. De fire andre oppgavene
merker ingenting.

## hub.mjs

[`hub.mjs`](hub.mjs) gjør det samme fra kommandolinjen med service
role-nøkkelen direkte. Den er beholdt for lokal bruk og for GitHub Actions
i fase 6, der nøkkelen kan ligge som repo-hemmelighet og aldri passerer
gjennom en prompt.

Den leser nøkkelen fra `~/.kampe-hub/env` eller fra miljøvariabler, og
skriver den aldri ut. Bruk den ikke fra claude.ai-oppgavene, de kan hverken
kjøre node eller nå filsystemet ditt.

## Trygt å kjøre om igjen

`review.write`, `metrics.write` og `goal.write` bruker upsert og retter seg
selv hvis en oppgave kjører to ganger. `tasks.add` hopper over titler som
allerede står åpne. `plan.add` er den eneste som lager duplikater, så den
skal kalles én gang per forslag.

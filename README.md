# Kämpe Hub

Personlig hub og startside. React og Vite i front, Supabase som database og
innlogging, GitHub Pages som hosting.

Appen leser og skriver kun mot Supabase. De schedulerte Claude-oppgavene
skriver inn, appen leser ut. Ingen integrasjoner lever i frontend.

## Kom i gang lokalt

```bash
npm install
cp .env.example .env   # fyll inn de to verdiene
npm run dev
```

`.env` skal inneholde:

```
VITE_SUPABASE_URL=https://ditt-prosjekt.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

Begge finnes i Supabase under Project Settings, API. Anon-nøkkelen er ment å
ligge i frontend og er trygg fordi Row Level Security er på alle tabeller.
Service role-nøkkelen skal aldri inn i dette repoet.

## Databasen

1. Supabase, SQL Editor, ny query, lim inn `supabase/schema.sql`, kjør.
2. Samme sted, lim inn `supabase/seed.sql`, rediger lenkene, kjør.
3. `supabase/seed-milepaeler.sql` legger inn P.IVA, FIF Sezione G,
   oppdragsavtalen og Impatriati på Admin-siden.

`schema.sql` kan kjøres på nytt uten å ødelegge data.

Hver tabell har en trigger som setter `user_id` automatisk, og en RLS-policy
som låser hver rad til eieren. Det betyr at verken appen eller de schedulerte
oppgavene trenger å sende `user_id` når de skriver.

## Innlogging

Magic link til én adresse, satt i `src/lib/constants.ts`. I Supabase under
Authentication, URL Configuration, må disse ligge under Redirect URLs:

```
http://localhost:5173/
https://kristinehasselo-bot.github.io/kampe-hub/
```

Under Authentication, Providers, Email: skru av "Allow new users to sign up"
når kontoen din finnes, så kan ingen andre registrere seg.

## Deploy

Push til `main` bygger og publiserer automatisk. Før første push:

1. GitHub, Settings, Secrets and variables, Actions. Legg inn
   `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY`.
2. GitHub, Settings, Pages. Sett Source til "GitHub Actions".

Adressen blir `https://kristinehasselo-bot.github.io/kampe-hub/`.

## Struktur

```
src/
  lib/          supabase-klient, typer, datoer, konstanter
  auth/         innloggingstilstand
  components/   Hjem-modulene, layout, innlogging
  pages/        sider
  styles/
    tokens/     kopi av Kämpe-designsystemet, endres ikke her
    app.css     applayeret, bygger kun på tokens
supabase/
  schema.sql        tabeller, RLS, indekser
  schema-fase4.sql  eierrad, så de schedulerte oppgavene kan skrive
  seed.sql          lenker og mål
  functions/hub/    smalt skriveendepunkt for claude.ai-oppgavene
claude-tasks/
  1- til 5-*.md     de fem promptene, én fil per schedulert oppgave
  hub.mjs           kommandolinje for lokal bruk og GitHub Actions
```

De schedulerte oppgavene skriver aldri rett i basen. De går gjennom Edge
Function-endepunktet med hvert sitt smale token, så service role-nøkkelen
aldri forlater Supabase. Se [claude-tasks/README.md](claude-tasks/README.md).

Fargene og typografien kommer fra designsystemet i
`Brand/k-mpe-estates-design-system`. Endres paletten der, kopieres
`tokens/*.css` inn på nytt.

## Faser

- [x] Fase 1, base. Innlogging, tabeller, Hjem med hurtiglogg, nøkkeltall og lenker.
- [x] Fase 2, struktur. Oppgaver, mandater, milepæler, fanene Jobb og Privat.
- [x] Fase 3, grafer. Periodebryter og alle grafene.
- [x] Fase 4, Claude inn. De fem oppgavene skriver til Supabase.
- [ ] Fase 5, innhold og økonomi.
- [ ] Fase 6, automatikk. GitHub Actions for valutakurs og nedtellinger.

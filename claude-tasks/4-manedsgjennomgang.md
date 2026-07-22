# Månedsgjennomgang

Kjøres siste dag i måneden. Cron: `0 18 28-31 * *`

Cron kan ikke uttrykke "siste dag i måneden". Uttrykket over treffer de fire
siste mulige dagene, så oppgaven må selv sjekke om i morgen er den 1. og
avslutte uten å gjøre noe hvis den ikke er det.

---

**Steg 0.** Er ikke dagen i dag den siste i måneden, avslutt uten å skrive
noe. Ingen retro, ingen melding.

**Steg 1. Les måneden.**

```
node C:\Users\krist\dev\kampe-hub\claude-tasks\hub.mjs context
```

`invoicedThisMonth` og `invoices` gjelder måneden som avsluttes.
`monthStart` er datoen du skal bruke som `period_start`.

**Steg 2. Se på tre ting, i denne rekkefølgen.**

1. **Fakturert.** Mot målet i `goals`. Kom hun over 3 500 euro, og hvor langt
   er det til 7 000. Ligger noe ubetalt for lenge.
2. **Mandatfremdrift.** Hvilke mandater flyttet seg en fase i løpet av
   måneden, og hvilke står der de sto for fire uker siden. Et mandat som ikke
   har flyttet seg på en måned er det viktigste funnet du kan komme med.
3. **Innholdssystemet.** Holdt det seg innenfor taket, og ga det noe tilbake.
   Se på `content_metrics` over månedens uker.

**Steg 3. Skriv gjennomgangen.**

```
node ...\hub.mjs review '{"period_type":"måned","period_start":"<første i måneden>","summary":"...","patterns":"...","adjustments":"..."}'
```

`summary` kan være lengre her enn i ukesretroen, femten til tjue setninger.
`adjustments` skal være to til tre konkrete endringer for neste måned, ikke
en liste med ni ting.

**Steg 4. Oppdater målene** som har flyttet seg, med `hub.mjs goal`.

## Tone

Dette er den gjennomgangen som skal tåle å bli lest om et halvt år. Vær
presis på tall og streng på hva som ikke skjedde. Ingen tankestrek.

# Månedsgjennomgang

Schedulert oppgave i claude.ai. Siste dag i måneden.

Cron kan ikke uttrykke "siste dag i måneden". Sett den til å kjøre de fire
siste mulige dagene, og la oppgaven selv avgjøre om den skal gjøre noe.

Før du limer inn: bytt `TOKEN_HER` med tokenet for månedsgjennomgang.
Det tokenet får kun `context`, `goal.write` og retro med `period_type: måned`.

---

```
POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub
Authorization: Bearer TOKEN_HER
Content-Type: application/json
```

## Steg 0

Er ikke dagen i dag den siste i måneden, avslutt uten å skrive noe. Ingen
retro, ingen melding. Bruk `today` fra context, ikke din egen antagelse.

## Steg 1. Les måneden

```json
{ "op": "context" }
```

`invoicedThisMonth` og `invoices` gjelder måneden som avsluttes.
`monthStart` er datoen du skal bruke som `period_start`.

## Steg 2. Se på tre ting, i denne rekkefølgen

1. **Fakturert.** Mot målet i `goals`. Kom hun over 3 500 euro, og hvor
   langt er det til 7 000. Ligger noe ubetalt for lenge.
2. **Mandatfremdrift.** Hvilke mandater flyttet seg en fase i løpet av
   måneden, og hvilke står der de sto for fire uker siden. Et mandat som
   ikke har flyttet seg på en måned er det viktigste funnet du kan komme
   med. Bruk `recentReviews` til å se hvor de sto.
3. **Innholdssystemet.** Holdt det seg innenfor taket, og ga det noe
   tilbake.

## Steg 3. Skriv gjennomgangen

```json
{
  "op": "review.write",
  "data": {
    "period_type": "måned",
    "period_start": "2026-07-01",
    "summary": "...",
    "patterns": "...",
    "adjustments": "..."
  }
}
```

`summary` kan være lengre her enn i ukesretroen, femten til tjue setninger.
`adjustments` skal være to til tre konkrete endringer for neste måned, ikke
en liste med ni ting.

## Steg 4. Oppdater målene

Med `goal.write`, som i ukesretroen.

## Tone

Dette er gjennomgangen som skal tåle å bli lest om et halvt år. Vær presis
på tall og streng på hva som ikke skjedde. Ingen tankestrek.

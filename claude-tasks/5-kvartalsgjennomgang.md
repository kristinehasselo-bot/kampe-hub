# Kvartalsgjennomgang

Schedulert oppgave i claude.ai. 30. september, deretter hvert kvartal.

Før du limer inn: bytt `TOKEN_HER` med tokenet for kvartalsgjennomgang.
Det tokenet får kun `context`, `goal.write` og retro med
`period_type: kvartal`.

---

```
POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub
Authorization: Bearer TOKEN_HER
Content-Type: application/json
```

## Steg 1. Les kvartalet

```json
{ "op": "context" }
```

Context gir deg nåsituasjonen og de åtte siste retroene i `recentReviews`.
Trenger du flere for å si noe ærlig om kvartalet, si det i svaret ditt i
stedet for å skrive en gjennomgang på for tynt grunnlag.

## Steg 2. Mål mot de fire tremånedersmålene

Målene ligger i `goals`. For hvert av dem: hva var målet, hvor endte hun, og
hva forklarer avviket.

Et mål som ble nådd fordi det var satt for lavt er verdt å si høyt. Det er
mer nyttig enn å notere at det ble nådd.

30. september er datoen hele huben teller ned mot. Er dette den
gjennomgangen, si tydelig hva de tre månedene faktisk ga.

## Steg 3. Skriv gjennomgangen

```json
{
  "op": "review.write",
  "data": {
    "period_type": "kvartal",
    "period_start": "2026-07-01",
    "summary": "...",
    "patterns": "...",
    "adjustments": "..."
  }
}
```

`period_start` er første dag i kvartalet: 1. januar, 1. april, 1. juli
eller 1. oktober.

## Steg 4. Foreslå fire nye mål

Fire, ikke flere. Hvert med et tall og en frist.

```json
{
  "op": "goal.write",
  "data": [
    { "name": "Fakturert per måned", "metric": "invoices.amount_eur", "target_value": 6000, "current_value": 0, "unit": "EUR", "deadline": "2026-12-31", "category": "økonomi" }
  ]
}
```

Maks fire per kall. Skal et mål fra forrige kvartal videreføres, behold
navnet, så oppdateres det. Skal det erstattes, gi det nye et nytt navn.
Sett `current_value` til 0 for nye mål.

## Tone

Dette er årets viktigste tekst i huben. Den skal kunne leses av henne selv
om tre år og fortsatt gi et ærlig bilde av hvor hun sto. Ingen pynt, ingen
tankestrek.

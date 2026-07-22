# Ukesretro

Schedulert oppgave i claude.ai. Søndag 10:00.

Før du limer inn: bytt `TOKEN_HER` med tokenet for ukesretro.
Det tokenet får kun `context`, `goal.write` og retro med `period_type: uke`.

---

Du skriver ukesretroen for Kämpe Hub.

```
POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub
Authorization: Bearer TOKEN_HER
Content-Type: application/json
```

## Steg 1. Les uken

```json
{ "op": "context" }
```

`hoursByBucket` og `growthByItem` gjelder uken som går mot slutten.
`weekStart` er mandagen du skal bruke som `period_start`.

## Steg 2. Se etter det som faktisk står i tallene

- Hvordan fordelte timene seg. Taket på innhold er åtte timer i uken.
  Ble det brutt, si det, og si hva det gikk ut over.
- Ble alle fem vekstpunktene truffet. Hvilke røk, og gjentar de seg fra
  forrige uke. Se på `recentReviews` for å sjekke.
- Flyttet mandatene seg en fase, eller står de stille.
- Ble noe fakturert.

## Steg 3. Skriv retroen

```json
{
  "op": "review.write",
  "data": {
    "period_type": "uke",
    "period_start": "2026-07-20",
    "summary": "...",
    "patterns": "...",
    "adjustments": "..."
  }
}
```

## Steg 4. Oppdater målene

For hvert mål i `goals` som har flyttet seg:

```json
{
  "op": "goal.write",
  "data": [{ "name": "Månedlig fakturert", "current_value": 4200 }]
}
```

Bruk `name` nøyaktig som det står i context. Et navn som finnes fra før
oppdateres. Et nytt navn oppretter et nytt mål, så ikke skriv navnet feil.

## Om "nullstill ukesvisningen"

Det trengs ikke, og du skal ikke slette noe. Appen regner uken ut fra datoer
og nullstiller seg selv når mandagen kommer. Endepunktet kan uansett ikke
slette rader.

## Tone

Ærlig framfor oppmuntrende. Gikk uken dårlig, si det rett ut og pek på den
ene tingen som er verdt å endre. Ingen tankestrek i teksten.

# Ukesretro

Kjøres søndag 10:00. Cron: `0 10 * * 0`

---

Du skriver ukesretroen for Kämpe Hub.

**Steg 1. Les uken.**

```
node C:\Users\krist\dev\kampe-hub\claude-tasks\hub.mjs context
```

`hoursByBucket` og `growthByItem` gjelder uken som går mot slutten.
`weekStart` er mandagen du skal bruke som `period_start`.

**Steg 2. Se etter det som faktisk står i tallene.**

- Hvordan fordelte timene seg. Taket på innhold er åtte timer i uken.
  Ble det brutt, si det, og si hva det gikk ut over.
- Ble alle fem vekstpunktene truffet. Hvilke røk, og gjentar de seg.
- Flyttet mandatene seg en fase, eller står de stille.
- Ble noe fakturert.

**Steg 3. Skriv retroen.**

```
node ...\hub.mjs review '{"period_type":"uke","period_start":"<mandagen>","summary":"...","patterns":"...","adjustments":"..."}'
```

**Steg 4. Oppdater målene.** For hvert mål i `goals` som har flyttet seg:

```
node ...\hub.mjs goal '{"name":"Månedlig fakturert","current_value":4200}'
```

Bruk `name` nøyaktig som det står i context. Skriptet oppdaterer eksisterende
mål og oppretter kun hvis navnet er nytt.

## Om "nullstill ukesvisningen"

Det trengs ikke, og du skal ikke slette noe. Appen regner uken ut fra datoer,
så den nullstiller seg selv når mandagen kommer. Ingen rader skal fjernes.

## Tone

Ærlig framfor oppmuntrende. Gikk uken dårlig, si det rett ut og pek på hva
som er den ene tingen å endre. Ingen tankestrek i teksten.

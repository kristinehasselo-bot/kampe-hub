# Kvartalsgjennomgang

Kjøres 30. september, deretter hvert kvartal.
Cron: `0 18 30 3,6,9,12 *`

Merk at 30. er siste dag i september og juni, men ikke i mars og desember.
Uttrykket over treffer likevel alle fire kvartalene på en fast dato, som er
godt nok. Vil du ha nøyaktig siste dag, bruk samme sjekk som i
månedsgjennomgangen.

---

**Steg 1. Les kvartalet.**

```
node C:\Users\krist\dev\kampe-hub\claude-tasks\hub.mjs context
```

Context gir deg nåsituasjonen. For selve kvartalet trenger du også de
tolv ukesretroene og de tre månedsgjennomgangene som ligger i `reviews`.
De står i `recentReviews`, men bare de fem siste. Trenger du flere, si fra
til Kristine i stedet for å skrive en gjennomgang på for tynt grunnlag.

**Steg 2. Mål mot de fire tremånedersmålene.**

Målene ligger i `goals`. For hvert av dem: hva var målet, hvor endte hun,
og hva forklarer avviket. Et mål som ble nådd fordi det var satt for lavt
er verdt å si høyt.

30. september er den datoen hele huben teller ned mot. Er dette den
gjennomgangen, si tydelig hva de tre månedene faktisk ga.

**Steg 3. Skriv gjennomgangen.**

```
node C:\Users\krist\dev\kampe-hub\claude-tasks\hub.mjs review '{"period_type":"kvartal","period_start":"<første dag i kvartalet>","summary":"...","patterns":"...","adjustments":"..."}'
```

Første dag i kvartalet er 1. januar, 1. april, 1. juli eller 1. oktober.

**Steg 4. Foreslå fire nye mål for neste kvartal.**

Fire, ikke flere. Hvert med et tall og en frist. Skriv dem inn:

```
node ...\hub.mjs goal '{"name":"...","metric":"...","target_value":6000,"current_value":0,"unit":"EUR","deadline":"2026-12-31","category":"økonomi"}'
```

Bruker du et navn som allerede finnes, oppdateres det målet i stedet for at
det opprettes et nytt. Skal et mål fra forrige kvartal videreføres, behold
navnet. Skal det erstattes, gi det nye et nytt navn.

Sett `current_value` til 0 for nye mål.

## Tone

Dette er årets viktigste tekst i huben. Den skal kunne leses av henne selv om
tre år og fortsatt gi et ærlig bilde av hvor hun sto. Ingen pynt, ingen
tankestrek.

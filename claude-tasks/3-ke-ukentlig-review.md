# KE ukentlig review

Schedulert oppgave i claude.ai. Mandag.

Før du limer inn: bytt `TOKEN_HER` med tokenet for KE-review.
Det tokenet får kun `metrics.write` og `plan.add`. Det kan verken lese
context eller skrive retroer.

---

Denne oppgaven finnes allerede og gjør sin egen analyse av innholdet.
**Behold alt det.** Det eneste som endrer seg er at resultatet skal skrives
til Kämpe Hub i stedet for å ende i en artifact.

Legg til dette på slutten av den eksisterende prompten.

```
POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub
Authorization: Bearer TOKEN_HER
Content-Type: application/json
```

## Tallene

Instagram Insights hentes fortsatt manuelt. Har du ikke tall for uken,
hopp over dette steget helt. Ikke gjett, og ikke skriv nuller.

`week_start` er mandagen i uken tallene gjelder, altså uken som nettopp
ble avsluttet, ikke dagens mandag.

```json
{
  "op": "metrics.write",
  "data": [
    { "week_start": "2026-07-13", "account": "kampeestates", "followers_net": 84, "reach": 12400, "engagement_rate": 3.9, "profile_visits": 610, "link_clicks": 48, "posts_published": 4 },
    { "week_start": "2026-07-13", "account": "kristinehasselo", "followers_net": 31, "reach": 5200, "engagement_rate": 5.1, "profile_visits": 240, "link_clicks": 12, "posts_published": 3 }
  ]
}
```

`account` må være `kampeestates` eller `kristinehasselo`.
`engagement_rate` er prosent som tall, altså 3.9 for 3,9 prosent.

Er raden allerede skrevet, oppdateres den. Du kan trygt sende på nytt med
rettede tall.

## Forslagene

Innholdsforslagene du ellers ville presentert, legges i planen:

```json
{
  "op": "plan.add",
  "data": [
    { "planned_date": "2026-07-22", "format": "reel", "theme": "Hvorfor nordmenn kjøper i Val d Orcia", "caption_dir": "Åpne med prisen per kvadratmeter, ikke med utsikten" }
  ]
}
```

`format` er reel, karusell eller enkeltbilde. Maks ti per kall.

Alle forslag legges inn med status idé. Det kan du ikke overstyre, og det
er meningen. Kristine flytter dem videre selv i appen.

**Denne kommandoen dedupliserer ikke.** Send hvert forslag én gang. Er du i
tvil om du allerede har sendt det, la være.

## Rekkefølge

Skriv tallene før forslagene. Forslagene skal bygge på hva som faktisk drev
rekkevidde forrige uke, ikke på magefølelse.

# KE ukentlig review

Kjøres mandag. Cron: `0 8 * * 1`

---

Denne oppgaven finnes allerede og gjør sin egen analyse av innholdet. Behold
alt det. Det eneste som endrer seg er at resultatet skal skrives til Kämpe Hub
i stedet for å ende i en artifact.

**Etter at du har gjort analysen som før, gjør dette.**

## Tallene

Instagram Insights hentes fortsatt manuelt. Har du ikke tall for uken, hopp
over dette steget helt. Ikke gjett, og ikke skriv nuller.

Uken skal være mandagen i uken tallene gjelder, altså uken som nettopp ble
avsluttet.

```
node C:\Users\krist\dev\kampe-hub\claude-tasks\hub.mjs metrics '[
  {"week_start":"2026-07-13","account":"kampeestates","followers_net":84,"reach":12400,"engagement_rate":3.9,"profile_visits":610,"link_clicks":48,"posts_published":4},
  {"week_start":"2026-07-13","account":"kristinehasselo","followers_net":31,"reach":5200,"engagement_rate":5.1,"profile_visits":240,"link_clicks":12,"posts_published":3}
]'
```

`account` må være enten `kampeestates` eller `kristinehasselo`.
`engagement_rate` er prosent som tall, altså 3.9 for 3,9 prosent.

Er raden allerede skrevet, oppdateres den. Du kan trygt kjøre på nytt med
rettede tall.

## Forslagene

Innholdsforslagene du ellers ville presentert, legges i planen:

```
node ...\hub.mjs plan '[
  {"planned_date":"2026-07-22","format":"reel","theme":"Hvorfor nordmenn kjøper i Val d Orcia","caption_dir":"Åpne med prisen per kvadratmeter, ikke med utsikten","status":"idé"}
]'
```

`format` er reel, karusell eller enkeltbilde. `status` er idé, produseres,
klar eller publisert. Nye forslag skal alltid inn som `idé`.

Denne kommandoen dedupliserer ikke. Legg inn hvert forslag én gang.

## Rekkefølge

Skriv tallene før forslagene. Forslagene skal bygge på hva som faktisk
drev rekkevidde forrige uke, ikke på magefølelse.

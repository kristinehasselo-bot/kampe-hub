# Eiendommer, Notion til Hub

Schedulert oppgave i claude.ai. Daglig, gjerne morgen.

Krever at Notion-koblingen er aktiv i denne oppgaven. Bytt `TOKEN_HER`
med tokenet for notion-properties. Det tokenet får kun `properties.upsert`,
ingenting annet.

---

Du speiler godkjente eiendommer fra Notion inn i Kämpe Hub, så de kan vises
som shortlist under mandater i appen. Idealista har ingen API, så alt kommer
fra Notion, ingenting skrapes.

## Steg 1. Les eiendommene fra Notion

Bruk Notion-koblingen din og hent eiendommene fra databasen Properties:

```
collection://33b1573c-e82d-80e1-9683-000b28318cc0
```

Ta bare med rader der **Godkjent** er huket av og **Status** ikke er
`⚫️Solgt`. Resten skal ikke inn i huben. Solgte eiendommer arkiveres et
annet sted og hører ikke hjemme i det klientvendte.

## Steg 2. Map hvert felt

For hver eiendom, bygg et objekt slik:

| Hub-felt | Fra Notion |
| :-- | :-- |
| `title` | Navn |
| `area` | Beliggenhet, alle valgte slått sammen med komma. Er den tom, bruk Provins, ellers Område |
| `price_eur` | Pris (€), som tall |
| `sqm` | Størrelse (m2), som tall |
| `status` | Status, men uten emoji: `🟢Aktiv` blir `Aktiv`, `🟡Under vurdering` blir `Under vurdering` |
| `listing_url` | Lenke |
| `notion_url` | URL-en til selve Notion-siden for eiendommen |

`notion_url` er nøkkelen synken oppdaterer på, så den må alltid være med og
peke på riktig eiendomsside. Uten den avvises raden.

Utelat felter der Notion er tom, ikke send tom streng eller null.

## Steg 3. Skriv til huben

```
POST https://ilcevdjpybfkrpgdauob.supabase.co/functions/v1/hub
Authorization: Bearer TOKEN_HER
Content-Type: application/json
```

```json
{
  "op": "properties.upsert",
  "data": [
    { "title": "Casale i Chianti", "area": "Chianti, Siena", "price_eur": 690000, "sqm": 320, "status": "Aktiv", "listing_url": "https://...", "notion_url": "https://notion.so/..." }
  ]
}
```

Maks seksti eiendommer per kall. Har du flere, del dem i bolker.

En eiendom som allerede finnes fra en tidligere kjøring oppdateres, den
dupliseres ikke. `price_per_sqm` regnes ut i appen, den skal du ikke sende.

## Om eiendommer som blir solgte

Blir en eiendom solgt i Notion, slutter den bare å komme med i synken. Den
blir liggende i huben med sin siste status. Det er greit for nå. Skal solgte
fjernes helt fra huben, si ifra til Kristine, det krever en egen sletterunde
vi ikke har bygget.

## Tone

Dette er en ren datajobb. Ingen rapport i chatten med mindre noe feilet.
Feilet en skriving, si kort hva som gikk galt og hvilke eiendommer det
gjaldt.

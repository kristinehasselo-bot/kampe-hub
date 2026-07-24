#!/usr/bin/env node
/**
 * Kämpe Hub, Notion til hub-synk.
 *
 * Kjøres av en GitHub Action, ikke av Claude. GitHub-kjøringene når både
 * Notion og Supabase, i motsetning til claude.ai-sandkassen, så all ren
 * dataflytting Notion til hub bor her.
 *
 * Synker to databaser:
 *   content  Content Calendar → content_plan
 *   props    Properties       → properties (bare Godkjent, ikke Solgt)
 *
 * Miljøvariabler (settes som GitHub-hemmeligheter):
 *   NOTION_TOKEN                 intern Notion-integrasjon
 *   SUPABASE_URL                 samme som ellers
 *   SUPABASE_SERVICE_ROLE_KEY    service role-nøkkelen
 *
 * Bruk:  node notion-sync.mjs           (synker begge)
 *        node notion-sync.mjs content   (bare innhold)
 *        node notion-sync.mjs props      (bare eiendommer)
 *        legg til --dry for å se hva som ville blitt skrevet
 */

const DRY = process.argv.includes('--dry')
const only = process.argv.find((a) => a === 'content' || a === 'props')

const NOTION_TOKEN = process.env.NOTION_TOKEN
const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!NOTION_TOKEN || !SUPABASE_URL || !SERVICE_KEY) {
  console.error('Mangler NOTION_TOKEN, SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

// Databasene under Kämpe Estates i Notion.
const CONTENT_DB = '37d1573c-e82d-8055-a32e-ce3dd825ba30'
const PROPERTIES_DB = '33b1573c-e82d-80e6-ae7ef008c4a26fa6'

// ---------- Notion ----------

async function notionQuery(databaseId) {
  const rows = []
  let cursor
  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cursor ? { start_cursor: cursor, page_size: 100 } : { page_size: 100 }),
    })
    if (!res.ok) {
      throw new Error(`Notion svarte ${res.status}: ${await res.text()}`)
    }
    const data = await res.json()
    rows.push(...data.results)
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)
  return rows
}

// Hjelpere som plukker verdier ut av Notions egenskapsobjekter.
const title = (p) => (p?.title ?? []).map((t) => t.plain_text).join('').trim() || null
const selectName = (p) => p?.select?.name ?? null
const statusName = (p) => p?.status?.name ?? null
const multi = (p) => (p?.multi_select ?? []).map((o) => o.name)
const num = (p) => (typeof p?.number === 'number' ? p.number : null)
const urlOf = (p) => p?.url ?? null
const checkbox = (p) => p?.checkbox === true

// ---------- Supabase ----------

async function upsert(table, onConflict, rows) {
  if (rows.length === 0) return { skrevet: 0 }
  if (DRY) {
    for (const r of rows) console.error(`[dry] ${table}: ${JSON.stringify(r)}`)
    return { skrevet: 0, dry: rows.length }
  }
  const res = await fetch(
    `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=${onConflict}`,
    {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    },
  )
  if (!res.ok) {
    throw new Error(`Supabase avviste ${table}: ${res.status} ${await res.text()}`)
  }
  return { skrevet: rows.length }
}

// ---------- Innhold ----------

const FORMAT = { Reel: 'reel', Carousel: 'karusell', Post: 'enkeltbilde', Newsletter: 'newsletter' }
const STATUS = {
  'Not started': 'idé',
  Writing: 'produseres',
  'Filming/editing': 'produseres',
  Planned: 'klar',
  Published: 'publisert',
}

async function syncContent() {
  const pages = await notionQuery(CONTENT_DB)

  const rows = []
  for (const page of pages) {
    const p = page.properties
    const type = selectName(p['Content type'])
    const format = FORMAT[type] // Story og ukjente typer faller ut
    if (!format) continue

    // Alle rader får samme nøkkelsett, ellers avviser PostgREST bulken.
    rows.push({
      notion_url: page.url,
      theme: title(p['Title']),
      format,
      status: STATUS[statusName(p['Status'])] ?? 'idé',
      planned_date: p['Date']?.date?.start?.slice(0, 10) ?? null,
    })
  }

  const res = await upsert('content_plan', 'user_id,notion_url', rows)
  console.log(`Innhold: ${pages.length} i Notion, ${rows.length} synket. ${JSON.stringify(res)}`)
}

// ---------- Eiendommer ----------

/** Fjerner statusens emoji, så 🟢Aktiv blir Aktiv. */
const cleanStatus = (s) => (s ? s.replace(/^[^\p{L}]+/u, '').trim() : null)

async function syncProperties() {
  const pages = await notionQuery(PROPERTIES_DB)

  const rows = []
  for (const page of pages) {
    const p = page.properties
    if (!checkbox(p['Godkjent'])) continue // bare godkjente
    const status = cleanStatus(selectName(p['Status']))
    if (status === 'Solgt') continue // solgte hører ikke hjemme i huben

    const area =
      multi(p['Beliggenhet']).join(', ') ||
      selectName(p['Provins']) ||
      selectName(p['Område']) ||
      null

    rows.push({
      notion_url: page.url,
      title: title(p['Navn']),
      area,
      price_eur: num(p['Pris (€)']),
      sqm: num(p['Størrelse (m2)']),
      status,
      listing_url: urlOf(p['Lenke']),
    })
  }

  const res = await upsert('properties', 'user_id,notion_url', rows)
  console.log(`Eiendommer: ${pages.length} i Notion, ${rows.length} godkjente synket. ${JSON.stringify(res)}`)
}

// ---------- Kjøring ----------

// Innhold og eiendommer kjøres uavhengig, så en feil på den ene ikke
// skjuler den andre. Begge feilene skrives ut.
let failed = false

async function runOne(name, fn) {
  try {
    await fn()
  } catch (err) {
    failed = true
    console.error(`${name} feilet: ${err instanceof Error ? err.message : err}`)
  }
}

if (only !== 'props') await runOne('Innhold', syncContent)
if (only !== 'content') await runOne('Eiendommer', syncProperties)

if (failed) process.exitCode = 1

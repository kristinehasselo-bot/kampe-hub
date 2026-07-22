#!/usr/bin/env node
/**
 * Kämpe Hub, kommandolinjeverktøy mot basen.
 *
 * IKKE for de schedulerte oppgavene. De kjører inne i claude.ai, kan
 * hverken starte en prosess eller nå dette filsystemet, og skal bruke
 * Edge Function-endepunktet i supabase/functions/hub med sitt eget
 * smale token. Se claude-tasks/README.md.
 *
 * Dette skriptet er for lokal bruk og for GitHub Actions i fase 6, der
 * service role-nøkkelen kan ligge som repo-hemmelighet og aldri passerer
 * gjennom en prompt. Nøkkelen skrives aldri ut, heller ikke i feilmeldinger.
 *
 * Nøkkelen leses fra, i denne rekkefølgen:
 *   1. miljøvariabelen SUPABASE_SERVICE_ROLE_KEY
 *   2. filen ~/.kampe-hub/env med linjer på formen NOKKEL=verdi
 *
 * Bruk:
 *   node hub.mjs context
 *   node hub.mjs tasks:add '[{"title":"Ring Carlo","priority":1}]'
 *   node hub.mjs review '{"period_type":"dag","period_start":"2026-07-22","summary":"..."}'
 *   node hub.mjs metrics '[{"week_start":"2026-07-20","account":"kampeestates","followers_net":84}]'
 *   node hub.mjs plan '[{"planned_date":"2026-07-24","format":"reel","theme":"Val d Orcia"}]'
 *   node hub.mjs goal '{"name":"Månedlig fakturert","current_value":4200}'
 *
 * Legg til --dry for å se hva som ville blitt sendt uten å skrive.
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DRY = process.argv.includes('--dry')

/**
 * Egen feiltype så vi kan avslutte pent. process.exit() midt i et åpent
 * nettverkskall river ned libuv før det er ferdig, og Node krasjer med
 * en assertion i stedet for å skrive feilmeldingen. Vi kaster i stedet,
 * fanger på toppnivå og setter exitCode, så Node får tømme køen selv.
 */
class HubError extends Error {}

function die(message) {
  throw new HubError(message)
}

/** Skriver ikke ut noe i tørrkjøring, der har vi allerede logget planen. */
function output(value) {
  if (DRY) return
  console.log(JSON.stringify(value, null, 2))
}

// ---------- Konfigurasjon ----------

function loadConfig() {
  const fromEnv = {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
  if (fromEnv.url && fromEnv.key) return fromEnv

  const path = join(homedir(), '.kampe-hub', 'env')
  let text
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    die(
      `Fant ingen konfigurasjon.\n` +
        `Lag filen ${path} med to linjer:\n` +
        `  SUPABASE_URL=https://ditt-prosjekt.supabase.co\n` +
        `  SUPABASE_SERVICE_ROLE_KEY=...\n` +
        `Den filen ligger utenfor repoet og skal aldri committes.`,
    )
  }

  const parsed = {}
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    parsed[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }

  const url = fromEnv.url ?? parsed.SUPABASE_URL
  const key = fromEnv.key ?? parsed.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) die(`${path} mangler SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY.`)
  return { url, key }
}

// Lastes først når den trengs, så en manglende nøkkelfil gir en ren
// melding gjennom feilhåndteringen nederst i stedet for en stack trace.
let cached = null
function config() {
  cached ??= loadConfig()
  return cached
}

// ---------- HTTP ----------

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const { url, key } = config()
  const base = `${url.replace(/\/$/, '')}/rest/v1`

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: prefer ?? 'return=representation',
  }

  if (DRY && method !== 'GET') {
    console.error(`[dry] ${method} ${path} ${body ? JSON.stringify(body) : ''}`)
    return []
  }

  const res = await fetch(`${base}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  if (!res.ok) {
    // Aldri ekko nøkkelen, kun status og svaret fra PostgREST.
    die(`${method} ${path} feilet med ${res.status}: ${text}`)
  }
  return text ? JSON.parse(text) : []
}

const get = (path) => rest(path)

const insert = (table, rows) =>
  rest(table, { method: 'POST', body: rows })

const upsert = (table, onConflict, rows) =>
  rest(`${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    body: rows,
    prefer: 'resolution=merge-duplicates,return=representation',
  })

// ---------- Datoer, lokal tid ----------

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function mondayOf(d = new Date()) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7))
  return copy
}

const today = iso(new Date())
const weekStart = iso(mondayOf())
const monthStart = iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

// ---------- Kommandoer ----------

/**
 * Alt en oppgave trenger for å skrive en brief, i ett kall.
 * Skriv aldri en brief uten å ha lest denne først.
 */
async function context() {
  const [openTasks, mandates, milestones, hours, growth, invoices, goals, reviews] =
    await Promise.all([
      get(`tasks?status=neq.ferdig&order=priority.asc,due_date.asc.nullslast`),
      get(`mandates?stage=neq.ferdig&order=next_step_due.asc.nullslast`),
      get(`milestones?status=neq.ferdig&order=due_date.asc.nullslast`),
      get(`time_logs?date=gte.${weekStart}&order=date.asc`),
      get(`growth_log?date=gte.${weekStart}&order=date.asc`),
      get(`invoices?issued_date=gte.${monthStart}`),
      get(`goals?order=name.asc`),
      get(`reviews?order=period_start.desc&limit=5`),
    ])

  const hoursByBucket = {}
  for (const row of hours) {
    hoursByBucket[row.bucket] = (hoursByBucket[row.bucket] ?? 0) + Number(row.hours ?? 0)
  }

  const growthByItem = {}
  for (const row of growth) {
    if (!row.done) continue
    growthByItem[row.item] = (growthByItem[row.item] ?? 0) + 1
  }

  console.log(
    JSON.stringify(
      {
        today,
        weekStart,
        monthStart,
        weekday: new Date().getDay(),
        openTasks,
        mandates,
        milestones,
        hoursByBucket,
        weekHoursTotal: Object.values(hoursByBucket).reduce((a, b) => a + b, 0),
        growthByItem,
        invoicedThisMonth: invoices.reduce((sum, i) => sum + Number(i.amount_eur ?? 0), 0),
        invoices,
        goals,
        recentReviews: reviews,
      },
      null,
      2,
    ),
  )
}

/**
 * Legger til oppgaver, men hopper over titler som allerede står åpne.
 * Uten det ville hverdagsbriefen bygget opp duplikater hver morgen.
 */
async function tasksAdd(json) {
  const wanted = JSON.parse(json)
  const existing = await get(`tasks?status=neq.ferdig&select=title`)
  const seen = new Set(existing.map((t) => t.title.trim().toLowerCase()))

  const fresh = wanted
    .filter((t) => !seen.has(String(t.title).trim().toLowerCase()))
    .map((t) => ({
      area: 'jobb',
      status: 'åpen',
      priority: 2,
      ...t,
      source: 'claude',
    }))

  if (fresh.length === 0) {
    output({ lagtTil: 0, hoppetOver: wanted.length })
    return
  }

  const rows = await insert('tasks', fresh)
  output({ lagtTil: rows.length, hoppetOver: wanted.length - fresh.length, rows })
}

/** Én retro per periode. Kjøres oppgaven på nytt, oppdateres raden. */
async function review(json) {
  const row = { written_by: 'claude', ...JSON.parse(json) }
  if (!row.period_type || !row.period_start) {
    die('review krever period_type og period_start.')
  }
  output(await upsert('reviews', 'user_id,period_type,period_start', [row]))
}

/** Ukens instagramtall. Unik på uke og konto, så gjentatt kjøring retter. */
async function metrics(json) {
  output(await upsert('content_metrics', 'user_id,week_start,account', JSON.parse(json)))
}

/** Forslag til innholdsplanen. Rene innlegg, ingen deduplisering. */
async function plan(json) {
  output(await insert('content_plan', JSON.parse(json)))
}

/** Oppdaterer eller oppretter et mål på navn. */
async function goal(json) {
  const row = JSON.parse(json)
  if (!row.name) die('goal krever name.')
  output(await upsert('goals', 'user_id,name', [row]))
}

// ---------- Kjøring ----------

const [, , command, payload] = process.argv

const commands = {
  context: () => context(),
  'tasks:add': () => tasksAdd(payload),
  review: () => review(payload),
  metrics: () => metrics(payload),
  plan: () => plan(payload),
  goal: () => goal(payload),
}

try {
  if (!commands[command]) {
    die(
      `Ukjent kommando: ${command ?? '(ingen)'}\n` +
        `Gyldige: ${Object.keys(commands).join(', ')}`,
    )
  }
  await commands[command]()
} catch (error) {
  // Forventede feil får en ren melding. Alt annet får full stack, siden
  // det da er noe vi ikke har tenkt på.
  console.error(error instanceof HubError ? error.message : error)
  process.exitCode = 1
}

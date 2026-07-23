/**
 * Kämpe Hub, smalt skriveendepunkt for de schedulerte Claude-oppgavene.
 *
 * Oppgavene kjører inne i claude.ai. De kan gjøre HTTP-kall, men de kan
 * ikke starte en prosess og har ikke noe filsystem. De trenger derfor et
 * endepunkt, ikke et skript.
 *
 * Hele sikkerhetstanken:
 * Service role-nøkkelen blir her inne. Supabase injiserer den selv i
 * Edge Functions, så den kopieres aldri av noen og står ingen steder i
 * en prompt. Ut mot oppgavene finnes bare smale tokens, ett per oppgave,
 * og hvert token har en eksplisitt liste over hva det får lov til.
 *
 * Et lekket token kan altså i verste fall gjøre nøyaktig det den ene
 * oppgaven gjør. Det kan ikke lese en vilkårlig tabell, ikke slette noe,
 * ikke røre auth, og ikke skrive felter utenfor listen under.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const REST = `${SUPABASE_URL}/rest/v1`

interface TokenScope {
  name: string
  ops: string[]
  /** Begrenser hvilke period_type et token får skrive. */
  periods?: string[]
}

function loadTokens(): Record<string, TokenScope> {
  try {
    return JSON.parse(Deno.env.get('HUB_TOKENS') ?? '{}')
  } catch {
    console.error('HUB_TOKENS er ikke gyldig JSON. Alle kall avvises.')
    return {}
  }
}

const TOKENS = loadTokens()

// ---------- Autentisering ----------

/**
 * Sammenligner uten å lekke hvor langt den kom, så et token ikke kan
 * gjettes tegn for tegn ved å måle svartid.
 */
function sameSecret(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a)
  const bb = new TextEncoder().encode(b)
  if (ab.length !== bb.length) return false
  let diff = 0
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i]
  return diff === 0
}

function authorise(req: Request): TokenScope | null {
  const header = req.headers.get('Authorization') ?? ''
  const presented = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!presented) return null

  for (const [token, scope] of Object.entries(TOKENS)) {
    if (sameSecret(token, presented)) return scope
  }
  return null
}

// ---------- Validering ----------

class BadRequest extends Error {}

function fail(message: string): never {
  throw new BadRequest(message)
}

/** Kaster alt som ikke står på listen, i stedet for å stole på avsender. */
function pick<T extends Record<string, unknown>>(row: T, fields: string[]) {
  const out: Record<string, unknown> = {}
  for (const field of fields) {
    if (row[field] !== undefined && row[field] !== null) out[field] = row[field]
  }
  return out
}

function oneOf(value: unknown, allowed: string[], field: string) {
  if (value === undefined) return
  if (typeof value !== 'string' || !allowed.includes(value)) {
    fail(`${field} må være en av: ${allowed.join(', ')}`)
  }
}

function isDate(value: unknown, field: string) {
  if (value === undefined) return
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${field} må være på formen ÅÅÅÅ-MM-DD`)
  }
}

function asArray(body: unknown, max: number, what: string): Record<string, unknown>[] {
  if (!Array.isArray(body)) fail(`${what} forventer en liste`)
  if (body.length === 0) fail(`${what} fikk en tom liste`)
  if (body.length > max) fail(`${what} tar maks ${max} rader per kall`)
  return body as Record<string, unknown>[]
}

function isUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    fail(`${field} må være en gyldig id`)
  }
  return value as string
}

// ---------- Databasen ----------

async function rest(path: string, init: RequestInit & { prefer?: string } = {}) {
  const { prefer, ...rest } = init
  const res = await fetch(`${REST}/${path}`, {
    ...rest,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer ?? 'return=representation',
    },
  })

  const text = await res.text()
  if (!res.ok) {
    // Logges fullt for feilsøking, men sendes tilbake uten detaljer om
    // basen. Oppgaven trenger å vite at det feilet, ikke hvordan.
    console.error(`PostgREST ${res.status} på ${path}: ${text}`)
    fail(`Databasen avviste skrivingen (${res.status})`)
  }
  return text ? JSON.parse(text) : []
}

const post = (table: string, rows: unknown) =>
  rest(table, { method: 'POST', body: JSON.stringify(rows) })

const upsert = (table: string, onConflict: string, rows: unknown) =>
  rest(`${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    body: JSON.stringify(rows),
    prefer: 'resolution=merge-duplicates,return=representation',
  })

const patch = (table: string, filter: string, values: unknown) =>
  rest(`${table}?${filter}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  })

// ---------- Operasjonene ----------

const AREAS = ['jobb', 'privat']
const TASK_CATEGORIES = ['kunde', 'admin', 'innhold', 'økonomi', 'vekst']
const PERIOD_TYPES = ['dag', 'uke', 'måned', 'kvartal', 'år']
const ACCOUNTS = ['kampeestates', 'kristinehasselo']
const FORMATS = ['reel', 'karusell', 'enkeltbilde']

async function opContext() {
  const monday = new Date()
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const now = new Date()
  const weekStart = iso(monday)
  const monthStart = iso(new Date(now.getFullYear(), now.getMonth(), 1))

  const [tasks, mandates, milestones, hours, growth, invoices, goals, reviews] =
    await Promise.all([
      rest('tasks?status=neq.ferdig&order=priority.asc,due_date.asc.nullslast'),
      rest('mandates?stage=neq.ferdig&order=next_step_due.asc.nullslast'),
      rest('milestones?status=neq.ferdig&order=due_date.asc.nullslast'),
      rest(`time_logs?date=gte.${weekStart}`),
      rest(`growth_log?date=gte.${weekStart}`),
      rest(`invoices?issued_date=gte.${monthStart}`),
      rest('goals?order=name.asc'),
      rest('reviews?order=period_start.desc&limit=8'),
    ])

  const hoursByBucket: Record<string, number> = {}
  for (const row of hours) {
    hoursByBucket[row.bucket] = (hoursByBucket[row.bucket] ?? 0) + Number(row.hours ?? 0)
  }

  const growthByItem: Record<string, number> = {}
  for (const row of growth) {
    if (row.done) growthByItem[row.item] = (growthByItem[row.item] ?? 0) + 1
  }

  return {
    today: iso(now),
    weekStart,
    monthStart,
    weekday: now.getDay(),
    openTasks: tasks,
    mandates,
    milestones,
    hoursByBucket,
    weekHoursTotal: Object.values(hoursByBucket).reduce((a, b) => a + b, 0),
    growthByItem,
    invoicedThisMonth: invoices.reduce(
      (sum: number, i: { amount_eur: number }) => sum + Number(i.amount_eur ?? 0),
      0,
    ),
    invoices,
    goals,
    recentReviews: reviews,
  }
}

async function opTasksAdd(body: unknown) {
  const wanted = asArray(body, 6, 'tasks.add')

  const clean = wanted.map((row) => {
    oneOf(row.area, AREAS, 'area')
    oneOf(row.category, TASK_CATEGORIES, 'category')
    isDate(row.due_date, 'due_date')
    if (typeof row.title !== 'string' || row.title.trim() === '') fail('title mangler')
    if (row.priority !== undefined && ![1, 2, 3].includes(Number(row.priority))) {
      fail('priority må være 1, 2 eller 3')
    }

    return {
      area: 'jobb',
      priority: 2,
      ...pick(row, ['title', 'area', 'category', 'priority', 'due_date', 'url']),
      // Ikke overstyrbart. Et token skal ikke kunne lage ferdige
      // oppgaver eller utgi seg for å være manuelt registrert.
      status: 'åpen',
      source: 'claude',
    }
  })

  // Hverdagsbriefen kjører hver morgen. Uten dette ville den bygget
  // opp den samme oppgaven om og om igjen.
  const existing = await rest('tasks?status=neq.ferdig&select=title')
  const seen = new Set(
    existing.map((t: { title: string }) => t.title.trim().toLowerCase()),
  )
  const fresh = clean.filter((t) => !seen.has(String(t.title).trim().toLowerCase()))

  if (fresh.length === 0) {
    return { lagtTil: 0, hoppetOver: clean.length }
  }

  const rows = await post('tasks', fresh)
  return { lagtTil: rows.length, hoppetOver: clean.length - fresh.length, rows }
}

async function opReviewWrite(body: unknown, scope: TokenScope) {
  const row = (body ?? {}) as Record<string, unknown>
  oneOf(row.period_type, PERIOD_TYPES, 'period_type')
  isDate(row.period_start, 'period_start')
  if (!row.period_type || !row.period_start) fail('period_type og period_start kreves')

  // Hverdagsbriefens token skal ikke kunne overskrive kvartalsretroen.
  if (scope.periods && !scope.periods.includes(row.period_type as string)) {
    fail(`Dette tokenet får kun skrive period_type: ${scope.periods.join(', ')}`)
  }

  const clean = {
    ...pick(row, [
      'period_type',
      'period_start',
      'summary',
      'patterns',
      'adjustments',
    ]),
    written_by: 'claude',
  }

  return await upsert('reviews', 'user_id,period_type,period_start', [clean])
}

async function opMetricsWrite(body: unknown) {
  const rows = asArray(body, 4, 'metrics.write').map((row) => {
    oneOf(row.account, ACCOUNTS, 'account')
    isDate(row.week_start, 'week_start')
    if (!row.account || !row.week_start) fail('account og week_start kreves')

    return pick(row, [
      'week_start',
      'account',
      'followers_net',
      'reach',
      'engagement_rate',
      'profile_visits',
      'link_clicks',
      'posts_published',
    ])
  })

  return await upsert('content_metrics', 'user_id,week_start,account', rows)
}

async function opPlanAdd(body: unknown) {
  const rows = asArray(body, 10, 'plan.add').map((row) => {
    oneOf(row.format, FORMATS, 'format')
    isDate(row.planned_date, 'planned_date')

    return {
      ...pick(row, [
        'planned_date',
        'format',
        'theme',
        'caption_dir',
        'canva_url',
        'notion_url',
      ]),
      // Forslag kommer alltid inn som idé. Publisert setter hun selv.
      status: 'idé',
    }
  })

  return await post('content_plan', rows)
}

/**
 * De siste postene i planen, så review kan finne riktig rad å skrive
 * rekkevidde på. Kun innholdsplanen, ikke kunde- eller økonomidata.
 * Returnerer id, dato, format, tema og status, nok til å matche mot det
 * Kristine har oppgitt, uten å gi et lekket token noe verdifullt.
 */
async function opPlanRecent() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 28)
  const iso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`

  return await rest(
    `content_plan?or=(status.eq.publisert,planned_date.gte.${iso})` +
      `&select=id,planned_date,format,theme,status,reach,engagement_rate` +
      `&order=planned_date.desc&limit=60`,
  )
}

/**
 * Setter rekkevidde og engasjement på en post review har identifisert,
 * og markerer den publisert. Kun disse tre feltene kan røres, og bare på
 * en rad review selv har hentet id-en til via plan.recent.
 */
async function opPlanSetReach(body: unknown) {
  const rows = asArray(body, 12, 'plan.setreach')

  const updated = []
  for (const row of rows) {
    const id = isUuid(row.id, 'id')
    if (row.reach !== undefined && row.reach !== null) {
      if (typeof row.reach !== 'number' || row.reach < 0) fail('reach må være et tall')
    }
    if (row.engagement_rate !== undefined && row.engagement_rate !== null) {
      if (typeof row.engagement_rate !== 'number' || row.engagement_rate < 0) {
        fail('engagement_rate må være et tall')
      }
    }

    const values = {
      ...pick(row, ['reach', 'engagement_rate']),
      // Å ha rekkevidde betyr at posten er ute.
      status: 'publisert',
    }

    const result = await patch('content_plan', `id=eq.${id}`, values)
    if (result.length === 0) fail(`Fant ingen post med id ${id}`)
    updated.push(...result)
  }

  return updated
}

/**
 * Speiler godkjente eiendommer fra Notion. Notion-sidens URL er nøkkelen,
 * så en eiendom som allerede finnes oppdateres. Kun kjernefeltene tas
 * inn, resten av Notion-basen er ikke appens ansvar.
 */
async function opPropertiesUpsert(body: unknown) {
  const rows = asArray(body, 60, 'properties.upsert').map((row) => {
    if (typeof row.title !== 'string' || row.title.trim() === '') fail('title mangler')
    if (typeof row.notion_url !== 'string' || row.notion_url.trim() === '') {
      fail('notion_url kreves, den er nøkkelen synken oppdaterer på')
    }

    return pick(row, [
      'title',
      'area',
      'price_eur',
      'sqm',
      'status',
      'listing_url',
      'notion_url',
    ])
  })

  return await upsert('properties', 'user_id,notion_url', rows)
}

async function opGoalWrite(body: unknown) {
  const rows = asArray(body, 4, 'goal.write').map((row) => {
    if (typeof row.name !== 'string' || row.name.trim() === '') fail('name mangler')
    isDate(row.deadline, 'deadline')

    return pick(row, [
      'name',
      'metric',
      'target_value',
      'current_value',
      'unit',
      'deadline',
      'category',
    ])
  })

  return await upsert('goals', 'user_id,name', rows)
}

// ---------- Ruting ----------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Kun POST' }, 405)
  }

  const scope = authorise(req)
  if (!scope) {
    return json({ ok: false, error: 'Ugyldig eller manglende token' }, 401)
  }

  let payload: { op?: string; data?: unknown }
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'Kroppen må være JSON' }, 400)
  }

  const op = payload.op ?? ''
  if (!scope.ops.includes(op)) {
    return json(
      {
        ok: false,
        error: `Tokenet "${scope.name}" har ikke tilgang til ${op || '(ingen op)'}`,
        tillatt: scope.ops,
      },
      403,
    )
  }

  try {
    let result: unknown
    switch (op) {
      case 'context':
        result = await opContext()
        break
      case 'tasks.add':
        result = await opTasksAdd(payload.data)
        break
      case 'review.write':
        result = await opReviewWrite(payload.data, scope)
        break
      case 'metrics.write':
        result = await opMetricsWrite(payload.data)
        break
      case 'plan.add':
        result = await opPlanAdd(payload.data)
        break
      case 'plan.recent':
        result = await opPlanRecent()
        break
      case 'plan.setreach':
        result = await opPlanSetReach(payload.data)
        break
      case 'properties.upsert':
        result = await opPropertiesUpsert(payload.data)
        break
      case 'goal.write':
        result = await opGoalWrite(payload.data)
        break
      default:
        return json({ ok: false, error: `Ukjent op: ${op}` }, 400)
    }

    return json({ ok: true, op, result })
  } catch (error) {
    if (error instanceof BadRequest) {
      return json({ ok: false, error: error.message }, 400)
    }
    console.error('Uventet feil', error)
    return json({ ok: false, error: 'Uventet feil, se funksjonsloggen' }, 500)
  }
})

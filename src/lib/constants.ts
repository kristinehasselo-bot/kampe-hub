import type {
  Area,
  Bucket,
  ContentPlanItem,
  GrowthItem,
  InvoiceStatus,
  MandateStage,
  Milestone,
  TaskCategory,
  TaskStatus,
} from './types'

/** Eneste konto som får logge inn. */
export const ALLOWED_EMAIL = 'kristine@kampeestates.com'

export const BUCKETS: { key: Bucket; label: string; hint: string }[] = [
  { key: 'biz_dev', label: 'Forretningsutvikling', hint: 'Nye kunder, partnere, posisjon' },
  { key: 'client', label: 'Kunde', hint: 'Mandater, visninger, oppfølging' },
  { key: 'content', label: 'Innhold', hint: 'Produksjon og publisering' },
  { key: 'growth', label: 'Vekst', hint: 'Læring, språk, fag' },
  { key: 'travel', label: 'Reise', hint: 'Transport og reisedager' },
]

/** Taket på innhold, timer per uke. Vises som referanse i hurtigloggen. */
export const CONTENT_CAP_HOURS_PER_WEEK = 8

export const GROWTH_ITEMS: { key: GrowthItem; label: string }[] = [
  { key: 'workout', label: 'Trening' },
  { key: 'yoga', label: 'Yoga' },
  { key: 'read', label: 'Lesing' },
  { key: 'connection', label: 'Relasjon' },
  { key: 'skill', label: 'Ferdighet' },
]

/** Reisen fra signert mandat til rogito, i rekkefølge. */
export const MANDATE_STAGES: MandateStage[] = [
  'mandat signert',
  'søk',
  'visning',
  'bud',
  'compromesso',
  'rogito',
  'ferdig',
]

export const MILESTONE_CATEGORIES: NonNullable<Milestone['category']>[] = [
  'P.IVA',
  'FIF',
  'juridisk',
  'skatt',
  'drift',
]

export const MILESTONE_OWNERS: NonNullable<Milestone['owner']>[] = [
  'Kristine',
  'commercialista',
  'Carlo',
  'Irene',
]

export const MILESTONE_STATUSES: Milestone['status'][] = [
  'åpen',
  'i gang',
  'ferdig',
  'blokkert',
]

export const TASK_AREAS: Area[] = ['jobb', 'privat']
export const TASK_CATEGORIES: TaskCategory[] = ['kunde', 'admin', 'innhold', 'økonomi', 'vekst']
export const TASK_STATUSES: TaskStatus[] = ['åpen', 'i gang', 'ferdig']

/** Frister nærmere enn dette markeres med oker. Aldri rødt. */
export const DUE_SOON_DAYS = 7

/** Navnet på inntektsmålet i goals-tabellen. */
export const REVENUE_GOAL_NAME = 'Månedlig fakturert'
export const REVENUE_GOAL_FLOOR_EUR = 3500
export const REVENUE_GOAL_CEILING_EUR = 7000

/**
 * Taket i regime forfettario. Over dette faller den flate skattesatsen
 * bort og hun må over på ordinær beskatning. Årlig, ikke per periode.
 */
export const FORFETTARIO_CEILING_EUR = 85_000

export const INVOICE_STATUSES: InvoiceStatus[] = ['utkast', 'sendt', 'betalt', 'forfalt']

export const CONTENT_FORMATS: NonNullable<ContentPlanItem['format']>[] = [
  'reel',
  'karusell',
  'enkeltbilde',
]

export const CONTENT_STATUSES: ContentPlanItem['status'][] = [
  'idé',
  'produseres',
  'klar',
  'publisert',
]

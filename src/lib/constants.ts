import type { Bucket, GrowthItem } from './types'

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

/** Navnet på inntektsmålet i goals-tabellen. */
export const REVENUE_GOAL_NAME = 'Månedlig fakturert'
export const REVENUE_GOAL_FLOOR_EUR = 3500
export const REVENUE_GOAL_CEILING_EUR = 7000

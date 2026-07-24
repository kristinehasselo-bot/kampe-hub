/**
 * Typer som speiler supabase/schema.sql.
 * Holdes håndskrevet slik at appen ikke er avhengig av kodegenerering.
 */

export type Bucket = 'biz_dev' | 'client' | 'content' | 'growth' | 'travel'
export type GrowthItem = 'workout' | 'yoga' | 'read' | 'connection' | 'skill'
export type Area = 'jobb' | 'privat'
export type TaskCategory = 'kunde' | 'admin' | 'innhold' | 'økonomi' | 'vekst'
export type TaskStatus = 'åpen' | 'i gang' | 'ferdig'
export type TaskSource = 'manuell' | 'claude' | 'notion'
export type MandateStage =
  | 'mandat signert'
  | 'søk'
  | 'visning'
  | 'bud'
  | 'compromesso'
  | 'rogito'
  | 'ferdig'
export type InvoiceStatus = 'utkast' | 'sendt' | 'betalt' | 'forfalt'
export type PeriodType = 'dag' | 'uke' | 'måned' | 'kvartal' | 'år'

export type TimeLog = {
  id: string
  user_id: string
  created_at: string
  date: string
  bucket: Bucket
  hours: number
  note: string | null
}

export type GrowthLog = {
  id: string
  user_id: string
  created_at: string
  date: string
  item: GrowthItem
  done: boolean
  note: string | null
}

export type Task = {
  id: string
  user_id: string
  created_at: string
  title: string
  area: Area
  category: TaskCategory | null
  status: TaskStatus
  due_date: string | null
  priority: 1 | 2 | 3
  linked_type: string | null
  linked_id: string | null
  source: TaskSource
  url: string | null
}

export type Mandate = {
  id: string
  user_id: string
  created_at: string
  client_name: string
  area: string | null
  stage: MandateStage
  next_step: string | null
  next_step_due: string | null
  viewing_from: string | null
  viewing_to: string | null
  fee_total: number | null
  fee_paid: number | null
  notes: string | null
  notion_url: string | null
}

export type Invoice = {
  id: string
  user_id: string
  created_at: string
  client: string
  amount_eur: number
  issued_date: string | null
  paid_date: string | null
  status: InvoiceStatus
  mandate_id: string | null
}

export type Goal = {
  id: string
  user_id: string
  created_at: string
  name: string
  metric: string | null
  target_value: number | null
  current_value: number | null
  unit: string | null
  deadline: string | null
  category: string | null
}

export type LinkRow = {
  id: string
  user_id: string
  created_at: string
  label: string
  url: string
  category: string
  sort_order: number
}

export type Review = {
  id: string
  user_id: string
  created_at: string
  period_type: PeriodType
  period_start: string
  summary: string | null
  patterns: string | null
  adjustments: string | null
  written_by: string | null
}

export type Milestone = {
  id: string
  user_id: string
  created_at: string
  title: string
  category: 'P.IVA' | 'FIF' | 'juridisk' | 'skatt' | 'drift' | null
  status: 'åpen' | 'i gang' | 'ferdig' | 'blokkert'
  due_date: string | null
  blocker: string | null
  owner: 'Kristine' | 'commercialista' | 'Carlo' | 'Irene' | null
  notes: string | null
  url: string | null
}

export type ContentMetric = {
  id: string
  user_id: string
  created_at: string
  week_start: string
  account: 'kampeestates' | 'kristinehasselo'
  followers_net: number | null
  reach: number | null
  engagement_rate: number | null
  profile_visits: number | null
  link_clicks: number | null
  posts_published: number | null
}

export type ContentPlanItem = {
  id: string
  user_id: string
  created_at: string
  planned_date: string | null
  format: 'reel' | 'karusell' | 'enkeltbilde' | 'newsletter' | null
  theme: string | null
  caption_dir: string | null
  status: 'idé' | 'produseres' | 'klar' | 'publisert'
  canva_url: string | null
  notion_url: string | null
  reach: number | null
  engagement_rate: number | null
}

export type Rate = {
  id: string
  user_id: string
  created_at: string
  date: string
  base: string
  quote: string
  rate: number
}

export type Property = {
  id: string
  user_id: string
  created_at: string
  title: string
  area: string | null
  price_eur: number | null
  sqm: number | null
  price_per_sqm: number | null
  status: string | null
  listing_url: string | null
  notion_url: string | null
  client_shortlist: string | null
}

/**
 * supabase-js krever Row, Insert, Update og Relationships per tabell.
 * Insert og Update utledes fra Row, siden id, user_id og created_at
 * alltid settes av databasen.
 */
type TableDef<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      time_logs: TableDef<TimeLog>
      growth_log: TableDef<GrowthLog>
      tasks: TableDef<Task>
      mandates: TableDef<Mandate>
      milestones: TableDef<Milestone>
      invoices: TableDef<Invoice>
      content_metrics: TableDef<ContentMetric>
      content_plan: TableDef<ContentPlanItem>
      properties: TableDef<Property>
      goals: TableDef<Goal>
      links: TableDef<LinkRow>
      reviews: TableDef<Review>
      rates: TableDef<Rate>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

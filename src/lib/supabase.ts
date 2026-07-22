import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Anon-nøkkelen er ment å ligge i frontend. Den er trygg så lenge
 * Row Level Security er på, og det er den på alle tabeller.
 * Service role-nøkkelen skal aldri inn hit.
 */
export const isConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient<Database> = createClient<Database>(
  url ?? 'http://localhost',
  anonKey ?? 'ikke-konfigurert',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

/** Hvor magic link-en skal sende henne tilbake. */
export const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`

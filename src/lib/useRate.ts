import { useCallback } from 'react'
import { supabase } from './supabase'
import { useQuery } from './useQuery'
import type { Rate } from './types'

/**
 * Siste EUR/NOK-kurs. Skrives av GitHub Action-jobben en gang i døgnet.
 * Returnerer null til den første kursen er skrevet.
 */
export function useLatestRate() {
  const { rows } = useQuery<Rate>(
    useCallback(
      () =>
        supabase
          .from('rates')
          .select('*')
          .eq('base', 'EUR')
          .eq('quote', 'NOK')
          .order('date', { ascending: false })
          .limit(1),
      [],
    ),
  )

  return rows[0] ?? null
}

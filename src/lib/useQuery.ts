import { useEffect, useState, useCallback } from 'react'

interface Result<T> {
  data: T[] | null
  error: { message: string } | null
}

/**
 * Kjører en Supabase-spørring og holder rader, lastetilstand og feil.
 * refresh() henter på nytt, brukes etter at et skjema har lagret.
 */
export function useQuery<T>(run: () => PromiseLike<Result<T>>, deps: unknown[] = []) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)

    run().then(({ data, error }) => {
      if (!active) return
      if (error) console.error(error)
      setError(error?.message ?? '')
      setRows(data ?? [])
      setLoading(false)
    })

    return () => {
      active = false
    }
    // run er en ny funksjon hver render, så deps styres av kalleren.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  return { rows, loading, error, refresh }
}

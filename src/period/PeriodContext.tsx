import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { PERIODS, periodRange, type Period, type Range } from '../lib/period'

const STORAGE_KEY = 'kampe-hub.period'

function initial(): Period {
  const saved = localStorage.getItem(STORAGE_KEY)
  return PERIODS.includes(saved as Period) ? (saved as Period) : 'uke'
}

interface Value {
  period: Period
  range: Range
  setPeriod: (p: Period) => void
}

const PeriodContext = createContext<Value | null>(null)

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<Period>(initial)

  const value = useMemo<Value>(
    () => ({
      period,
      range: periodRange(period),
      setPeriod: (p) => {
        localStorage.setItem(STORAGE_KEY, p)
        setPeriodState(p)
      },
    }),
    [period],
  )

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePeriod() {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod må brukes inne i PeriodProvider')
  return ctx
}

import { PERIODS } from '../lib/period'
import { usePeriod } from './PeriodContext'

export function PeriodSwitcher() {
  const { period, range, setPeriod } = usePeriod()

  return (
    <div className="period">
      <div className="period__buttons" role="group" aria-label="Periode">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            className={p === period ? 'period__button period__button--on' : 'period__button'}
            aria-pressed={p === period}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <p className="period__label">{range.label}</p>
    </div>
  )
}

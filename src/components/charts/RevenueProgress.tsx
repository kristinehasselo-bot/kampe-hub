import { formatEur } from '../../lib/dates'
import { REVENUE_GOAL_CEILING_EUR, REVENUE_GOAL_FLOOR_EUR } from '../../lib/constants'

/**
 * Fakturert mot mål som fremdriftslinje, med begge tersklene markert.
 * Ikke et diagram, med vilje. Ett tall og én linje leser roligere.
 */
export function RevenueProgress({
  invoiced,
  paid,
  goal,
}: {
  invoiced: number
  paid: number
  goal: number
}) {
  // Skalaen går til taket i målintervallet, eller til fakturert
  // beløp hvis hun har passert det.
  const scale = Math.max(REVENUE_GOAL_CEILING_EUR, invoiced, goal)
  const pct = (value: number) => `${Math.min(value / scale, 1) * 100}%`

  return (
    <div className="progress">
      <div className="progress__figures">
        <div>
          <p className="figure__label">Fakturert</p>
          <p className="figure__value figure__value--finance">{formatEur(invoiced)}</p>
        </div>
        <div>
          <p className="figure__label">Betalt</p>
          <p className="figure__value figure__value--sub">{formatEur(paid)}</p>
        </div>
      </div>

      <div className="progress__track">
        <span className="progress__fill" style={{ width: pct(invoiced) }} />
        <span className="progress__paid" style={{ width: pct(paid) }} />
        <span className="progress__mark" style={{ left: pct(REVENUE_GOAL_FLOOR_EUR) }} />
        <span className="progress__mark" style={{ left: pct(REVENUE_GOAL_CEILING_EUR) }} />
      </div>

      <div className="progress__scale">
        <span>0</span>
        <span>
          mål {formatEur(REVENUE_GOAL_FLOOR_EUR)} til {formatEur(REVENUE_GOAL_CEILING_EUR)}
        </span>
        <span>{formatEur(scale)}</span>
      </div>
    </div>
  )
}

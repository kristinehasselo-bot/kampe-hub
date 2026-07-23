import { FORFETTARIO_CEILING_EUR } from '../../lib/constants'
import { formatEur } from '../../lib/dates'

/**
 * Avstand til forfettario-terskelen. Alltid årlig, uavhengig av
 * periodebryteren, siden taket gjelder per kalenderår. Roer seg helt til
 * hun nærmer seg, og markerer i oker først når det virkelig teller.
 */
export function ForfettarioMeter({ invoicedThisYear }: { invoicedThisYear: number }) {
  const ceiling = FORFETTARIO_CEILING_EUR
  const share = Math.min(invoicedThisYear / ceiling, 1)
  const left = Math.max(ceiling - invoicedThisYear, 0)
  const near = share >= 0.8
  const year = new Date().getFullYear()

  return (
    <div className="forfettario">
      <div className="forfettario__row">
        <div>
          <p className="figure__label">Fakturert i {year}</p>
          <p className="figure__value figure__value--finance">{formatEur(invoicedThisYear)}</p>
        </div>
        <div className="forfettario__right">
          <p className="figure__label">Rom igjen</p>
          <p className={near ? 'figure__value figure__value--sub flag' : 'figure__value figure__value--sub'}>
            {formatEur(left)}
          </p>
        </div>
      </div>

      <div className="progress__track">
        <span
          className={near ? 'progress__paid progress__paid--near' : 'progress__paid'}
          style={{ width: `${share * 100}%` }}
        />
      </div>

      <div className="progress__scale">
        <span>0</span>
        <span>tak {formatEur(ceiling)}</span>
      </div>

      {near && (
        <p className="muted bar__note">
          Du nærmer deg taket i regime forfettario. Over det faller den flate satsen bort.
          Verdt en prat med commercialista før årsslutt.
        </p>
      )}
    </div>
  )
}

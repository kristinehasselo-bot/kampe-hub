import { daysUntil, nextSeptember30 } from '../../lib/dates'

/**
 * Nedtelling mot 30. september. Tydelig, men rolig: ett stort tall og
 * en tynn linje som viser hvor mye av kvartalet som er brukt.
 * Ingen farge før det virkelig haster, og da oker, aldri rødt.
 */
export function Countdown() {
  const target = nextSeptember30()
  const left = daysUntil(target)

  // Kvartalet det telles mot er de 92 dagene juli til september.
  const total = 92
  const used = Math.max(0, Math.min(total - left, total))
  const pressing = left <= 14

  return (
    <section className="countdown">
      <p className="section-label">Til 30. september</p>
      <p className={pressing ? 'countdown__value flag' : 'countdown__value'}>{left}</p>
      <p className="figure__unit">{left === 1 ? 'dag igjen' : 'dager igjen'}</p>
      <div className="countdown__track">
        <span
          className={pressing ? 'countdown__fill countdown__fill--near' : 'countdown__fill'}
          style={{ width: `${(used / total) * 100}%` }}
        />
      </div>
    </section>
  )
}

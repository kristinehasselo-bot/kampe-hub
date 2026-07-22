import { MANDATE_STAGES } from '../lib/constants'
import type { MandateStage } from '../lib/types'

/** Mandat til rogito, med markering av hvor kunden står nå. */
export function StageTimeline({ stage }: { stage: MandateStage }) {
  const current = MANDATE_STAGES.indexOf(stage)

  return (
    <ol className="timeline" aria-label={`Fase: ${stage}`}>
      {MANDATE_STAGES.map((s, i) => {
        const state = i < current ? 'past' : i === current ? 'now' : 'future'
        return (
          <li key={s} className={`timeline__step timeline__step--${state}`}>
            <span className="timeline__dot" aria-hidden />
            <span className="timeline__label">{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

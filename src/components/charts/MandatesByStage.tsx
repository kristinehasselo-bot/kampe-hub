import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Mandate } from '../../lib/types'
import { MANDATE_STAGES } from '../../lib/constants'
import { axisProps, chart, gridProps, tooltipProps } from '../../lib/chartTheme'

/** Hvor mange mandater som står i hver fase, i reisens rekkefølge. */
export function MandatesByStage({ rows }: { rows: Mandate[] }) {
  const data = MANDATE_STAGES.map((stage) => ({
    stage,
    antall: rows.filter((m) => m.stage === stage).length,
  }))

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="stage" {...axisProps} interval={0} angle={-30} textAnchor="end" height={70} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip {...tooltipProps} />
          <Bar dataKey="antall" isAnimationActive={false} maxBarSize={48}>
            {data.map((d) => (
              // Ferdig er ikke lenger under arbeid, så den dempes.
              <Cell
                key={d.stage}
                fill={d.stage === 'ferdig' ? chart.travertine : chart.cypress}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

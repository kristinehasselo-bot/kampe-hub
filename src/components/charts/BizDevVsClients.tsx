import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Mandate, TimeLog } from '../../lib/types'
import { slotOf, slots, type Range } from '../../lib/period'
import { axisProps, chart, gridProps, tooltipProps } from '../../lib/chartTheme'

/**
 * Timer i forretningsutvikling holdt mot nye mandater over perioden.
 * Spørsmålet grafen skal svare på: gir timene faktisk kunder.
 */
export function BizDevVsClients({
  hours,
  mandates,
  range,
}: {
  hours: TimeLog[]
  mandates: Mandate[]
  range: Range
}) {
  const data = slots(range).map((slot) => ({
    label: slot.label,
    key: slot.key,
    timer: 0,
    mandater: 0,
  }))

  const index = new Map(data.map((d) => [d.key, d]))

  for (const log of hours) {
    if (log.bucket !== 'biz_dev') continue
    const target = index.get(slotOf(log.date, range))
    if (target) target.timer += Number(log.hours ?? 0)
  }

  for (const m of mandates) {
    // created_at er en tidsstempel, vi trenger bare datodelen.
    const target = index.get(slotOf(m.created_at.slice(0, 10), range))
    if (target) target.mandater += 1
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis yAxisId="timer" {...axisProps} />
          <YAxis
            yAxisId="mandater"
            orientation="right"
            allowDecimals={false}
            {...axisProps}
          />
          <Tooltip {...tooltipProps} />
          <Legend
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: chart.muted, paddingTop: 8 }}
          />
          <Bar
            yAxisId="timer"
            dataKey="timer"
            name="Timer forretningsutvikling"
            fill={chart.cypressAnchor}
            isAnimationActive={false}
            maxBarSize={36}
          />
          <Line
            yAxisId="mandater"
            type="linear"
            dataKey="mandater"
            name="Nye mandater"
            stroke={chart.ochre}
            strokeWidth={1.5}
            dot={{ r: 3, fill: chart.ochre, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

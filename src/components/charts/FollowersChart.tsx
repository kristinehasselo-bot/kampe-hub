import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ContentMetric } from '../../lib/types'
import { slotOf, slots, type Range } from '../../lib/period'
import { axisProps, chart, gridProps, tooltipProps } from '../../lib/chartTheme'

const ACCOUNTS = [
  { key: 'kampeestates', label: 'kampeestates', color: chart.cypress },
  { key: 'kristinehasselo', label: 'kristinehasselo', color: chart.majolica },
] as const

/**
 * Følgervekst og engasjementrate, én linje per konto.
 * Tynne linjer, ingen fyll, ingen gradient.
 */
export function FollowersChart({
  rows,
  range,
  metric,
}: {
  rows: ContentMetric[]
  range: Range
  metric: 'followers_net' | 'engagement_rate'
}) {
  const data = slots(range).map((slot) => ({
    label: slot.label,
    key: slot.key,
    kampeestates: null as number | null,
    kristinehasselo: null as number | null,
  }))

  const index = new Map(data.map((d) => [d.key, d]))

  for (const row of rows) {
    const target = index.get(slotOf(row.week_start, range))
    if (!target) continue
    const value = row[metric]
    if (value == null) continue
    target[row.account] = Number(value)
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipProps} />
          <Legend
            iconType="plainline"
            iconSize={12}
            wrapperStyle={{ fontSize: 11, color: chart.muted, paddingTop: 8 }}
          />
          {ACCOUNTS.map((a) => (
            <Line
              key={a.key}
              type="linear"
              dataKey={a.key}
              name={a.label}
              stroke={a.color}
              strokeWidth={1.5}
              dot={{ r: 2, fill: a.color, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

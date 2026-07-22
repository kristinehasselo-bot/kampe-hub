import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeLog } from '../../lib/types'
import { BUCKETS, CONTENT_CAP_HOURS_PER_WEEK } from '../../lib/constants'
import { slotOf, slots, type Range } from '../../lib/period'
import { axisProps, bucketFill, chart, gridProps, tooltipProps } from '../../lib/chartTheme'

/**
 * Timer per bucket, stablet over tid. Taklinjen på innhold vises kun
 * når x-aksen er uker, siden taket er definert per uke.
 */
export function HoursStacked({ rows, range }: { rows: TimeLog[]; range: Range }) {
  type Row = Record<string, string | number>

  const data: Row[] = slots(range).map((slot) => {
    const row: Row = { label: slot.label, key: slot.key }
    for (const b of BUCKETS) row[b.key] = 0
    return row
  })

  const index = new Map(data.map((d) => [d.key as string, d]))

  for (const log of rows) {
    const target = index.get(slotOf(log.date, range))
    if (!target) continue
    target[log.bucket] = Number(target[log.bucket] ?? 0) + Number(log.hours ?? 0)
  }

  const showCap = range.grain === 'uke'

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip {...tooltipProps} />
          <Legend
            iconType="square"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: chart.muted, paddingTop: 8 }}
          />

          {showCap && (
            <ReferenceLine
              y={CONTENT_CAP_HOURS_PER_WEEK}
              stroke={chart.ochre}
              strokeDasharray="4 4"
              label={{
                value: `tak innhold, ${CONTENT_CAP_HOURS_PER_WEEK} t`,
                position: 'right',
                fill: chart.ochre,
                fontSize: 10,
              }}
            />
          )}

          {BUCKETS.map((b) => (
            <Bar
              key={b.key}
              dataKey={b.key}
              name={b.label}
              stackId="timer"
              fill={bucketFill[b.key]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

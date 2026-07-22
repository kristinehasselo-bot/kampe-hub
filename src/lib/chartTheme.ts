/**
 * Recharts trenger faktiske fargeverdier, ikke klassenavn. Vi leser dem
 * ut av designtokenene ved oppstart, så paletten har fortsatt kun ett
 * sted den defineres: styles/tokens/colors.css.
 */
function token(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

export const chart = {
  cypress: token('--cypress', '#36463B'),
  cypressAnchor: token('--cypress-anchor', '#2E3A30'),
  majolica: token('--majolica', '#3A5566'),
  ochre: token('--ochre', '#C68A3C'),
  line: token('--line', '#CFC4AE'),
  lineSubtle: token('--line-subtle', '#E0DACB'),
  ink: token('--ink', '#23211C'),
  muted: token('--ink-muted', '#6B6457'),
  plaster: token('--plaster', '#ECE6DB'),
  travertine: token('--travertine', '#E2D8C6'),
  canvas: token('--canvas', '#FAF8F3'),
}

/**
 * De fem bucketene i en varm stige fra sypress til travertin. Ingen
 * gradienter, ingen ekstra farger, bare valører av den samme grønnen
 * med oker reservert til innhold, som er den som har et tak.
 */
export const bucketFill: Record<string, string> = {
  biz_dev: chart.cypressAnchor,
  client: chart.cypress,
  content: chart.ochre,
  growth: '#6E7F6F',
  travel: chart.travertine,
}

/** Felles akse- og gridoppsett. Tynne linjer, ingen 3D, ingen gradient. */
export const axisProps = {
  stroke: chart.line,
  tick: { fill: chart.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: chart.line },
} as const

export const gridProps = {
  stroke: chart.lineSubtle,
  strokeDasharray: '0',
  vertical: false,
} as const

export const tooltipProps = {
  contentStyle: {
    background: chart.canvas,
    border: `1px solid ${chart.line}`,
    borderRadius: 0,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
    color: chart.ink,
  },
  cursor: { fill: 'rgba(54, 70, 59, 0.06)' },
} as const

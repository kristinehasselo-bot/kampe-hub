import { useState } from 'react'
import { Priorities } from '../components/Priorities'
import { QuickLog } from '../components/QuickLog'
import { KeyFigures } from '../components/KeyFigures'
import { LinkGrid } from '../components/LinkGrid'

export function Home() {
  // Bumpes når hurtigloggen lagrer, så nøkkeltallene henter på nytt.
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="stack surface-warm">
      <KeyFigures refreshKey={refreshKey} />
      <div className="split">
        <Priorities />
        <QuickLog onSaved={() => setRefreshKey((n) => n + 1)} />
      </div>
      <LinkGrid />
    </div>
  )
}

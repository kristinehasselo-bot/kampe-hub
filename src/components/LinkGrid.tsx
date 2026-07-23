import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MANUAL_URL } from '../lib/constants'
import type { LinkRow } from '../lib/types'

// Brukermanualen er ikke en vanlig lenke i databasen, den festes til
// admin-gruppen i koden så den alltid ligger der, uansett hva som er
// seedet. sort_order -1 holder den øverst i gruppen.
const PINNED: LinkRow[] = [
  {
    id: 'pinned-manual',
    user_id: '',
    created_at: '',
    label: 'Brukermanual',
    url: MANUAL_URL,
    category: 'admin',
    sort_order: -1,
  },
]

export function LinkGrid() {
  const [links, setLinks] = useState<LinkRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('links')
      .select('*')
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('Kunne ikke hente lenker', error)
        setLinks(data ?? [])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (loading) return null

  // Fest manualen inn, men bare hvis den ikke allerede finnes i basen.
  const hasManual = links.some((l) => l.url === MANUAL_URL)
  const all = hasManual ? links : [...PINNED, ...links]

  const groups = all.reduce<Record<string, LinkRow[]>>((acc, link) => {
    ;(acc[link.category] ??= []).push(link)
    return acc
  }, {})

  // Innenfor hver gruppe: sorter på sort_order, så den festede havner øverst.
  for (const items of Object.values(groups)) {
    items.sort((a, b) => a.sort_order - b.sort_order)
  }

  return (
    <section className="links">
      {Object.entries(groups).map(([category, items]) => (
        <div key={category} className="links__group">
          <p className="section-label">{category}</p>
          <ul className="links__list">
            {items.map((link) => (
              <li key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer" className="links__item">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

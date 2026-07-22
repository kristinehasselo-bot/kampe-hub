import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { LinkRow } from '../lib/types'

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

  const groups = links.reduce<Record<string, LinkRow[]>>((acc, link) => {
    ;(acc[link.category] ??= []).push(link)
    return acc
  }, {})

  if (loading) return null

  if (links.length === 0) {
    return (
      <section className="panel">
        <header className="panel__head">
          <p className="section-label">Lenker</p>
        </header>
        <p className="muted">
          Ingen lenker enda. Legg dem inn i links-tabellen i Supabase, så dukker de opp
          gruppert etter kategori.
        </p>
      </section>
    )
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

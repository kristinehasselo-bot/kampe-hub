import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useQuery } from '../lib/useQuery'
import type { Area, Task } from '../lib/types'
import { DUE_SOON_DAYS } from '../lib/constants'
import { daysUntil, formatDate } from '../lib/dates'
import { TaskForm } from '../components/TaskForm'

export function Oppgaver({ area }: { area: Area }) {
  const [editing, setEditing] = useState<Task | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [showDone, setShowDone] = useState(false)

  const { rows, loading, refresh } = useQuery<Task>(
    useCallback(
      () =>
        supabase
          .from('tasks')
          .select('*')
          .eq('area', area)
          .order('priority', { ascending: true })
          .order('due_date', { ascending: true, nullsFirst: false }),
      [area],
    ),
    [area],
  )

  const open = rows.filter((t) => t.status !== 'ferdig')
  const done = rows.filter((t) => t.status === 'ferdig')
  const visible = showDone ? done : open

  async function toggle(task: Task) {
    const next = task.status === 'ferdig' ? 'åpen' : 'ferdig'
    const { error } = await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    if (error) {
      console.error('Kunne ikke endre status', error)
      return
    }
    refresh()
  }

  return (
    <div className="stack surface-warm">
      <header className="page-head">
        <div>
          <p className="section-label">{area === 'jobb' ? 'Jobb' : 'Privat'}</p>
          <h1 className="page-title">Oppgaver</h1>
        </div>
        <button
          type="button"
          className="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          Ny oppgave
        </button>
      </header>

      <div className="toggle-row">
        <button
          type="button"
          className={showDone ? 'toggle' : 'toggle toggle--on'}
          onClick={() => setShowDone(false)}
        >
          Åpne, {open.length}
        </button>
        <button
          type="button"
          className={showDone ? 'toggle toggle--on' : 'toggle'}
          onClick={() => setShowDone(true)}
        >
          Ferdige, {done.length}
        </button>
      </div>

      {loading && <p className="muted">Henter</p>}

      {!loading && visible.length === 0 && (
        <p className="muted">
          {showDone ? 'Ingenting ferdig enda.' : 'Ingen åpne oppgaver her.'}
        </p>
      )}

      <ul className="tasks">
        {visible.map((task) => {
          const days = task.due_date ? daysUntil(task.due_date) : null
          const pressing = days !== null && days <= DUE_SOON_DAYS && task.status !== 'ferdig'

          return (
            <li key={task.id} className="task">
              <button
                type="button"
                className={
                  task.status === 'ferdig'
                    ? 'priority__check priority__check--on'
                    : 'priority__check'
                }
                onClick={() => toggle(task)}
                aria-label={
                  task.status === 'ferdig' ? 'Marker som åpen' : 'Marker som ferdig'
                }
              />

              <button
                type="button"
                className="task__main"
                onClick={() => {
                  setEditing(task)
                  setFormOpen(true)
                }}
              >
                <span
                  className={
                    task.status === 'ferdig' ? 'task__title task__title--done' : 'task__title'
                  }
                >
                  {task.title}
                </span>
                <span className="priority__meta">
                  <span className={`pri pri--${task.priority}`}>P{task.priority}</span>
                  {task.category && <span>{task.category}</span>}
                  {task.status === 'i gang' && <span className="badge badge--igang">i gang</span>}
                  {task.source !== 'manuell' && <span>{task.source}</span>}
                  {task.due_date && (
                    <span className={pressing ? 'flag' : undefined}>
                      {days! < 0
                        ? `${Math.abs(days!)} dager over frist`
                        : formatDate(task.due_date)}
                    </span>
                  )}
                </span>
              </button>

              {task.url && (
                <a href={task.url} target="_blank" rel="noreferrer" className="milestone__link">
                  Åpne
                </a>
              )}
            </li>
          )
        })}
      </ul>

      {formOpen && (
        <TaskForm task={editing} area={area} onClose={() => setFormOpen(false)} onSaved={refresh} />
      )}
    </div>
  )
}

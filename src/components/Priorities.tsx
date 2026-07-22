import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task } from '../lib/types'
import { daysUntil, formatDate } from '../lib/dates'

/**
 * Dagens 2 til 4 prioriteringer. Høyest prioritet først, deretter
 * nærmeste frist. Skrives normalt av hverdagsbriefen, men kan
 * hukes av her.
 */
export function Priorities() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase
      .from('tasks')
      .select('*')
      .neq('status', 'ferdig')
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(4)
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error('Kunne ikke hente oppgaver', error)
        setTasks(data ?? [])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  async function complete(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    const { error } = await supabase
      .from('tasks')
      .update({ status: 'ferdig' })
      .eq('id', task.id)
    if (error) {
      console.error('Kunne ikke lukke oppgaven', error)
      setTasks((prev) => [...prev, task])
    }
  }

  return (
    <section className="panel panel--lead">
      <header className="panel__head">
        <p className="section-label">I dag</p>
      </header>

      {loading && <p className="muted">Henter</p>}

      {!loading && tasks.length === 0 && (
        <p className="muted">
          Ingen åpne prioriteringer. Hverdagsbriefen legger inn nye klokken 09.
        </p>
      )}

      <ul className="priority-list">
        {tasks.map((task) => {
          const days = task.due_date ? daysUntil(task.due_date) : null
          const late = days !== null && days < 0
          const soon = days !== null && days >= 0 && days <= 1

          return (
            <li key={task.id} className="priority">
              <button
                type="button"
                className="priority__check"
                onClick={() => complete(task)}
                aria-label={`Marker ferdig: ${task.title}`}
              />
              <div className="priority__body">
                <p className="priority__title">
                  {task.url ? (
                    <a href={task.url} target="_blank" rel="noreferrer">
                      {task.title}
                    </a>
                  ) : (
                    task.title
                  )}
                </p>
                <p className="priority__meta">
                  <span className={`pri pri--${task.priority}`}>P{task.priority}</span>
                  {task.category && <span>{task.category}</span>}
                  {task.due_date && (
                    <span className={late || soon ? 'flag' : undefined}>
                      {late
                        ? `${Math.abs(days!)} dager over frist`
                        : days === 0
                          ? 'frist i dag'
                          : days === 1
                            ? 'frist i morgen'
                            : formatDate(task.due_date)}
                    </span>
                  )}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

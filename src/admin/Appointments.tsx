import { useEffect, useMemo, useState } from 'react'
import { data } from '../data/source'
import { STATUS_LABEL, npr, type Appointment, type AppointmentStatus } from '../data/types'
import { ConfirmButton, Drawer } from './ui'

const STATUSES: AppointmentStatus[] = ['new', 'confirmed', 'completed', 'cancelled']
const fmtDate = (s: string) => (s ? new Date(s + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '–')
const fmtWhen = (s: string) => new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function Appointments({ notify }: { notify: (t: string) => void }) {
  const [list, setList] = useState<Appointment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all')
  const [open, setOpen] = useState<Appointment | null>(null)

  const load = () =>
    data.admin
      .listAppointments()
      .then((l) => {
        setList(l)
        setError(null)
      })
      .catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list?.length ?? 0 }
    STATUSES.forEach((s) => (c[s] = list?.filter((a) => a.status === s).length ?? 0))
    return c
  }, [list])
  const shown = (list ?? []).filter((a) => filter === 'all' || a.status === filter)

  const setStatus = async (a: Appointment, s: AppointmentStatus) => {
    try {
      await data.admin.setStatus(a, s)
      setList((l) => l!.map((x) => (x.id === a.id ? { ...x, status: s } : x)))
      setOpen((o) => (o && o.id === a.id ? { ...o, status: s } : o))
      notify(`Marked ${a.ref} as ${STATUS_LABEL[s].toLowerCase()}`)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  const remove = async (a: Appointment) => {
    try {
      await data.admin.deleteAppointment(a)
      setList((l) => l!.filter((x) => x.id !== a.id))
      setOpen(null)
      notify(`Deleted ${a.ref}`)
    } catch (e) {
      notify((e as Error).message)
    }
  }

  return (
    <div className="apanel">
      <div className="apanel__head">
        <div>
          <h1>Appointments</h1>
          <p>Requests from the website, newest first.</p>
        </div>
        <button className="abtn" onClick={load}>
          Refresh
        </button>
      </div>

      <div className="stat-row">
        {(['all', ...STATUSES] as const).map((s) => (
          <button key={s} className={`stat stat--${s}`} aria-pressed={filter === s} onClick={() => setFilter(s)}>
            <span>{s === 'all' ? 'All' : STATUS_LABEL[s]}</span>
            <b>{counts[s]}</b>
          </button>
        ))}
      </div>

      {error && <p className="aerr">{error}</p>}
      {!list ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <div className="aempty">
          <h3>{list.length === 0 ? 'No appointments yet' : 'Nothing here'}</h3>
          <p>{list.length === 0 ? 'When a customer books from the website, the request appears here with their selected products.' : 'No appointments have this status.'}</p>
        </div>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Visit</th>
                <th className="num">Items</th>
                <th className="num">Estimate</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id} onClick={() => setOpen(a)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpen(a)}>
                  <td className="mono">{a.ref}</td>
                  <td>
                    <b>{a.name}</b>
                    <small>{a.phone}</small>
                  </td>
                  <td>
                    {fmtDate(a.date)}
                    <small>{a.slot}</small>
                  </td>
                  <td className="num">{a.items.reduce((s, i) => s + i.qty, 0) || '–'}</td>
                  <td className="num">{a.total ? npr(a.total) : '–'}</td>
                  <td>
                    <span className={`pill pill--${a.status}`}>{STATUS_LABEL[a.status]}</span>
                  </td>
                  <td className="muted">{fmtWhen(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Drawer title={`Appointment ${open.ref}`} onClose={() => setOpen(null)} footer={<ConfirmButton label="Delete appointment" onConfirm={() => remove(open)} />}>
          <div className="adetail">
            <section>
              <h3>Status</h3>
              <div className="seg">
                {STATUSES.map((s) => (
                  <button key={s} aria-pressed={open.status === s} className={`seg__btn seg__btn--${s}`} onClick={() => setStatus(open, s)}>
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>Customer</h3>
              <dl className="akv">
                <div><dt>Name</dt><dd>{open.name}</dd></div>
                <div><dt>Phone</dt><dd className="sel">{open.phone}</dd></div>
                {open.email && <div><dt>Email</dt><dd className="sel">{open.email}</dd></div>}
                <div><dt>Address</dt><dd>{open.address}</dd></div>
                <div><dt>Visit</dt><dd>{fmtDate(open.date)}, {open.slot}</dd></div>
                <div><dt>Received</dt><dd>{fmtWhen(open.createdAt)}</dd></div>
              </dl>
              {open.notes && <p className="anote">{open.notes}</p>}
            </section>
            <section>
              <h3>Selected products</h3>
              {open.items.length === 0 ? (
                <p className="muted">Survey only, no products selected.</p>
              ) : (
                <table className="atable atable--compact">
                  <tbody>
                    {open.items.map((i) => (
                      <tr key={i.productId}>
                        <td>{i.name}</td>
                        <td className="num muted">{i.qty} × {npr(i.price)}</td>
                        <td className="num">{npr(i.qty * i.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2}>Estimated total</td>
                      <td className="num">{npr(open.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </section>
          </div>
        </Drawer>
      )}
    </div>
  )
}

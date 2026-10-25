import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { company } from '../content'
import { data, imageUrl } from '../data/source'
import { TIME_SLOTS, npr, validateAppointment } from '../data/types'
import { useCart } from '../store/cart'
import { useCatalog } from '../store/catalog'
import { IconArrow, IconCalendar, IconCheck, IconPhone, IconWhatsApp } from './Icons'

type Form = { name: string; phone: string; email: string; address: string; date: string; slot: string; notes: string }
const empty: Form = { name: '', phone: '', email: '', address: '', date: '', slot: '', notes: '' }

const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const prettyDate = (s: string) => (s ? new Date(s + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '')

/** Next 14 days except Saturdays (the office's weekly holiday). */
function upcomingDays() {
  const out: string[] = []
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (out.length < 14) {
    if (d.getDay() !== 6) out.push(iso(d))
    d.setDate(d.getDate() + 1)
  }
  return out
}

function Copy({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1500)
        } catch {
          /* clipboard blocked: the text itself is selectable */
        }
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}

export default function Booking() {
  const cart = useCart()
  const { products } = useCatalog()
  const { items, count, total } = cart.priced(products)
  const [f, setF] = useState<Form>(empty)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ ref: string; total: number; date: string; slot: string; count: number } | null>(null)
  const [bookable, setBookable] = useState(true)
  const days = useMemo(upcomingDays, [])

  useEffect(() => {
    data.canBook().then(setBookable).catch(() => setBookable(false))
  }, [])

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const payload = { ...f, items: items.map((l) => ({ productId: l.productId, qty: l.qty })) }
    const problem = validateAppointment(payload)
    if (problem) return setError(problem)
    setError(null)
    setSending(true)
    try {
      const r = await data.createAppointment(payload)
      setDone({ ref: r.ref, total: r.total, date: f.date, slot: f.slot, count })
      cart.clear()
      setF(empty)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="section section--alt booking" id="book">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow">Appointment</span>
          <h2>Book a free site survey.</h2>
          <p>Choose a day and time. A technician visits, checks the site with you and confirms the final price before any work starts.</p>
        </div>

        <div className="booking__layout">
          <div className="card booking__form">
            {done ? (
              <div className="booked" role="status">
                <span className="booked__icon">
                  <IconCheck />
                </span>
                <h3>Appointment requested</h3>
                <p>
                  Your reference is <b className="ref">{done.ref}</b>. We will call you to confirm the visit.
                </p>
                <dl className="booked__facts">
                  <div>
                    <dt>Preferred visit</dt>
                    <dd>
                      {prettyDate(done.date)}, {done.slot}
                    </dd>
                  </div>
                  <div>
                    <dt>Selection</dt>
                    <dd>{done.count ? `${done.count} item${done.count > 1 ? 's' : ''} · ${npr(done.total)}` : 'Survey only'}</dd>
                  </div>
                </dl>
                <ol className="next">
                  <li>We call you, usually within one working day, to confirm the time.</li>
                  <li>A technician visits, walks the site with you and plans camera positions.</li>
                  <li>You get a final quote including installation before any work starts.</li>
                </ol>
                <div className="sent__actions">
                  <a className="btn btn--wa" href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(`Hello, I just booked a site survey. My reference is ${done.ref}.`)}`} target="_blank" rel="noreferrer">
                    <IconWhatsApp /> Message us on WhatsApp
                  </a>
                  <button className="btn btn--ghost" onClick={() => setDone(null)}>
                    Book another appointment
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <fieldset>
                  <legend>Your details</legend>
                  <div className="grid2">
                    <label>
                      Full name
                      <input id="b-name" value={f.name} onChange={set('name')} autoComplete="name" required />
                    </label>
                    <label>
                      Phone
                      <input id="b-phone" value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" required />
                    </label>
                    <label>
                      <span className="lab">
                        Email <span className="opt">optional</span>
                      </span>
                      <input id="b-email" type="email" value={f.email} onChange={set('email')} autoComplete="email" />
                    </label>
                    <label>
                      Site address
                      <input id="b-address" value={f.address} onChange={set('address')} placeholder="e.g. Jhamsikhel, Lalitpur" required />
                    </label>
                  </div>
                </fieldset>

                <fieldset>
                  <legend>
                    <IconCalendar /> Preferred visit
                  </legend>
                  <div className="days" role="radiogroup" aria-label="Day">
                    {days.map((d) => {
                      const dt = new Date(d + 'T00:00')
                      return (
                        <button type="button" role="radio" aria-checked={f.date === d} key={d} className="day" onClick={() => setF({ ...f, date: d })}>
                          <small>{dt.toLocaleDateString('en-GB', { weekday: 'short' })}</small>
                          <b>{dt.getDate()}</b>
                          <small>{dt.toLocaleDateString('en-GB', { month: 'short' })}</small>
                        </button>
                      )
                    })}
                  </div>
                  <div className="slots" role="radiogroup" aria-label="Time">
                    {TIME_SLOTS.map((s) => (
                      <button type="button" role="radio" aria-checked={f.slot === s} key={s} className="slot" onClick={() => setF({ ...f, slot: s })}>
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label>
                  <span className="lab">
                    Anything we should know? <span className="opt">optional</span>
                  </span>
                  <textarea id="b-notes" value={f.notes} onChange={set('notes')} placeholder="e.g. Two-storey house, gate and parking, Wi-Fi already installed" />
                </label>

                {error && (
                  <p className="err" role="alert">
                    {error}
                  </p>
                )}
                {!bookable && <p className="note">Booking from this preview needs Claude sign-in with Contributor access. On your live website anyone can book.</p>}
                <div className="booking__submit">
                  <button className="btn btn--primary" type="submit" disabled={sending}>
                    {sending ? 'Sending…' : 'Request appointment'} {!sending && <IconArrow />}
                  </button>
                  <span className="fine">We use your details only to arrange this visit.</span>
                </div>
              </form>
            )}
          </div>

          <aside className="booking__side">
            <div className="card summary">
              <div className="summary__head">
                <h3>Your selection</h3>
                {count > 0 && (
                  <button className="btn-text" onClick={() => cart.setOpen(true)}>
                    Edit
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <p className="summary__empty">
                  No products added. You can book a survey on its own, or <a href="#products">add products</a> to see an estimate.
                </p>
              ) : (
                <ul className="summary__lines">
                  {items.map((l) => (
                    <li key={l.productId}>
                      <span className="lines__img">{l.product.image && <img src={imageUrl(l.product.image)} alt="" />}</span>
                      <span className="summary__name">
                        {l.product.name}
                        <small>
                          {l.qty} × {npr(l.product.price)}
                        </small>
                      </span>
                      <b>{npr(l.qty * l.product.price)}</b>
                    </li>
                  ))}
                </ul>
              )}
              <div className="total">
                <span>Estimated total</span>
                <b>{npr(total)}</b>
              </div>
              <p className="fine">Equipment only. Installation and cabling are added in the final quote after the survey.</p>
            </div>

            <div className="card reach">
              <h3>Prefer to call or chat?</h3>
              <div className="reach__actions">
                <a className="btn btn--wa btn--sm" href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent('Hello Drishti Surveillance, I would like to ask about CCTV installation.')}`} target="_blank" rel="noreferrer">
                  <IconWhatsApp /> WhatsApp us
                </a>
                <a className="btn btn--ghost btn--sm" href={`tel:${company.phoneIntl}`}>
                  <IconPhone /> Call
                </a>
              </div>
              <dl>
                <div>
                  <dt>Phone</dt>
                  <dd>{company.phone}</dd>
                  <Copy text={company.phone} />
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{company.email}</dd>
                  <Copy text={company.email} />
                </div>
                <div>
                  <dt>Office</dt>
                  <dd>{company.address}</dd>
                  <span />
                </div>
                <div>
                  <dt>Hours</dt>
                  <dd>{company.hours}</dd>
                  <span />
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

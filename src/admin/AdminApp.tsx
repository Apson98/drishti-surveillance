import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { data, type AdminSession } from '../data/source'
import logo from '../assets/drishti-logo.png'
import Appointments from './Appointments'
import Products from './Products'
import ClientsAdmin from './ClientsAdmin'
import Categories from './Categories'
import { Toast } from './ui'
import './admin.scss'

type Tab = 'appointments' | 'products' | 'categories' | 'clients'
const TABS: { id: Tab; label: string }[] = [
  { id: 'appointments', label: 'Appointments' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'clients', label: 'Clients' },
]

function Login({ session, onIn }: { session: AdminSession; onIn: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await data.admin.login(pw)
      onIn()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="alogin">
      <form className="alogin__card" onSubmit={submit}>
        <img src={logo} alt="Drishti Surveillance" />
        <h1>Admin Panel</h1>
        <p className="muted alogin__sub">Sign in to manage products, clients and appointments.</p>
        {session.usesPassword ? (
          <>
            <label className="afield">
              <span className="field-label">Password</span>
              <input id="al-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            </label>
            {error && <p className="aerr">{error}</p>}
            <button className="abtn abtn--primary abtn--block" disabled={busy || !pw}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </>
        ) : (
          <p className="muted">{session.note}</p>
        )}
        <a href="#top" className="alogin__back">
          ← Back to website
        </a>
      </form>
    </div>
  )
}

export default function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [tab, setTab] = useState<Tab>('appointments')
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const check = useCallback(() => {
    data.admin
      .session()
      .then(setSession)
      .catch(() => setSession({ admin: false, usesPassword: true }))
  }, [])
  useEffect(check, [check])
  useEffect(() => {
    document.title = 'Admin Panel · Drishti Surveillance'
    window.scrollTo(0, 0)
    return () => {
      document.title = 'Drishti Surveillance'
    }
  }, [])

  const notify = useCallback((t: string) => {
    setToast(t)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  if (!session) return <div className="admin" />
  if (!session.admin)
    return (
      <div className="admin">
        <Login session={session} onIn={check} />
      </div>
    )

  return (
    <div className="admin">
      <header className="abar">
        <div className="abar__brand">
          <img src={logo} alt="Drishti Surveillance" />
          <span>Admin Panel</span>
        </div>
        <nav className="abar__tabs" aria-label="Admin sections">
          {TABS.map((t) => (
            <button key={t.id} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="abar__end">
          <a className="abtn abtn--quiet" href="#top">
            View website
          </a>
          {session.usesPassword && (
            <button className="abtn" onClick={() => data.admin.logout().then(check)}>
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="amain">
        {!session.usesPassword && <p className="abanner">Preview mode: changes here are saved to this Claude preview. On your live website the dashboard is protected by your admin password.</p>}
        {tab === 'appointments' && <Appointments notify={notify} />}
        {tab === 'products' && <Products notify={notify} />}
        {tab === 'categories' && <Categories notify={notify} />}
        {tab === 'clients' && <ClientsAdmin notify={notify} />}
      </main>
      <Toast text={toast} />
    </div>
  )
}

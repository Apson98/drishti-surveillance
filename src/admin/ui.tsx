import { useEffect, useState, type ReactNode } from 'react'
import { IconClose } from '../components/Icons'

export function Drawer({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="adrawer-wrap" onClick={onClose}>
      <aside className="adrawer" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </header>
        <div className="adrawer__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </aside>
    </div>
  )
}

/** Two-step delete: the first click arms it, the second confirms. */
export function ConfirmButton({ onConfirm, label = 'Delete', confirm = 'Confirm delete' }: { onConfirm: () => void; label?: string; confirm?: string }) {
  return (
    <ArmedButton label={label} confirm={confirm} onConfirm={onConfirm} />
  )
}

function ArmedButton({ label, confirm, onConfirm }: { label: string; confirm: string; onConfirm: () => void }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3500)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" className={`abtn ${armed ? 'abtn--danger' : 'abtn--quiet'}`} onClick={() => (armed ? onConfirm() : setArmed(true))}>
      {armed ? confirm : label}
    </button>
  )
}

export function Toast({ text }: { text: string | null }) {
  return text ? (
    <div className="atoast" role="status">
      {text}
    </div>
  ) : null
}

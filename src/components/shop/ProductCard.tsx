import { useEffect } from 'react'
import { useCart } from '../../store/cart'
import { imageUrl } from '../../data/source'
import { npr, type Product } from '../../data/types'
import { IconCheck, IconClose, IconPlus } from '../Icons'
import Qty from '../Qty'

function AddControl({ p }: { p: Product }) {
  const cart = useCart()
  const q = cart.qty(p.id)
  if (q > 0) return <Qty value={q} onChange={(v) => cart.set(p.id, v)} label={p.name} />
  return (
    <button type="button" className="btn btn--primary btn--sm" onClick={() => cart.add(p.id)}>
      <IconPlus /> Add
    </button>
  )
}

export function ProductCard({ p, onOpen }: { p: Product; onOpen: (p: Product) => void }) {
  return (
    <article className="pcard">
      <button className="pcard__media" onClick={() => onOpen(p)} aria-label={`View details of ${p.name}`}>
        {p.image ? <img src={imageUrl(p.image)} alt="" loading="lazy" /> : <span className="noimg">No photo</span>}
      </button>
      <div className="pcard__body">
        <span className="pcard__meta">
          {p.brand && <b>{p.brand}</b>} {p.category}
        </span>
        <h3>
          <button className="linkish" onClick={() => onOpen(p)}>
            {p.name}
          </button>
        </h3>
        <p>{p.summary}</p>
      </div>
      <div className="pcard__foot">
        <span className="price">{npr(p.price)}</span>
        <AddControl p={p} />
      </div>
    </article>
  )
}

export function ProductDialog({ p, onClose }: { p: Product; onClose: () => void }) {
  const cart = useCart()
  const q = cart.qty(p.id)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [onClose])
  return (
    <div className="dialog-wrap" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="pd-title" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn dialog__close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
        <div className="dialog__media">{p.image ? <img src={imageUrl(p.image)} alt={p.name} /> : <span className="noimg">No photo</span>}</div>
        <div className="dialog__body">
          <span className="pcard__meta">
            {p.brand && <b>{p.brand}</b>} {p.category}
          </span>
          <h3 id="pd-title">{p.name}</h3>
          <div className="dialog__price">{npr(p.price)}</div>
          {p.description && <p className="dialog__desc">{p.description}</p>}
          {p.specs.length > 0 && (
            <dl className="specs">
              {p.specs.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="dialog__actions">
            {q > 0 ? (
              <>
                <Qty value={q} onChange={(v) => cart.set(p.id, v)} label={p.name} />
                <span className="dialog__line">
                  <IconCheck /> In your selection · {npr(q * p.price)}
                </span>
              </>
            ) : (
              <button className="btn btn--primary" onClick={() => cart.add(p.id)}>
                <IconPlus /> Add to selection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ n = 4 }: { n?: number }) {
  return (
    <div className="pgrid">
      {Array.from({ length: n }).map((_, i) => (
        <div className="pcard pcard--skeleton" key={i} />
      ))}
    </div>
  )
}

/** Remember which category to open when the shop page loads. */
export function openShop(category?: string) {
  try {
    if (category) sessionStorage.setItem('ds_shop_cat', category)
    else sessionStorage.removeItem('ds_shop_cat')
  } catch {
    /* storage unavailable: the shop opens on All */
  }
  location.hash = 'shop'
}

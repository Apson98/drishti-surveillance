import { useEffect } from 'react'
import { useCart } from '../store/cart'
import { useCatalog } from '../store/catalog'
import { imageUrl } from '../data/source'
import { npr } from '../data/types'
import { IconBag, IconClose, IconTrash, IconArrow } from './Icons'
import Qty from './Qty'

export default function CartDrawer() {
  const cart = useCart()
  const { products } = useCatalog()
  const { items, count, total } = cart.priced(products)

  useEffect(() => {
    if (!cart.open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && cart.setOpen(false)
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = ''
    }
  }, [cart.open, cart])

  const goBook = () => {
    cart.setOpen(false)
    const el = document.getElementById('book')
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50)
    else location.hash = 'book' // on the shop page: go home, then to the booking form
  }

  return (
    <>
      {count > 0 && !cart.open && (
        <button className="cartbar" onClick={() => cart.setOpen(true)}>
          <span className="cartbar__icon">
            <IconBag />
            <i>{count}</i>
          </span>
          <span className="cartbar__text">
            <small>Your selection</small>
            <b>{npr(total)}</b>
          </span>
          <span className="cartbar__cta">View</span>
        </button>
      )}

      {cart.open && (
        <div className="sheet-wrap" onClick={() => cart.setOpen(false)}>
          <aside className="sheet" role="dialog" aria-modal="true" aria-label="Your selection" onClick={(e) => e.stopPropagation()}>
            <header className="sheet__head">
              <div>
                <h3>Your selection</h3>
                <span>{count === 0 ? 'Nothing added yet' : `${count} item${count > 1 ? 's' : ''}`}</span>
              </div>
              <button className="icon-btn" onClick={() => cart.setOpen(false)} aria-label="Close">
                <IconClose />
              </button>
            </header>

            <div className="sheet__body">
              {items.length === 0 ? (
                <div className="empty">
                  <p>Add products from the catalogue to see your estimated total here.</p>
                </div>
              ) : (
                <ul className="lines">
                  {items.map((l) => (
                    <li key={l.productId}>
                      <span className="lines__img">{l.product.image && <img src={imageUrl(l.product.image)} alt="" />}</span>
                      <div className="lines__info">
                        <b>{l.product.name}</b>
                        <small>{npr(l.product.price)} each</small>
                        <Qty size="sm" value={l.qty} onChange={(v) => cart.set(l.productId, v)} label={l.product.name} />
                      </div>
                      <div className="lines__end">
                        <b>{npr(l.qty * l.product.price)}</b>
                        <button className="icon-btn icon-btn--sm" onClick={() => cart.set(l.productId, 0)} aria-label={`Remove ${l.product.name}`}>
                          <IconTrash />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <footer className="sheet__foot">
              <div className="total">
                <span>Estimated total</span>
                <b>{npr(total)}</b>
              </div>
              <p className="fine">Installation and cabling are quoted after the free site survey.</p>
              <button className="btn btn--primary btn--block" onClick={goBook}>
                Book an appointment <IconArrow />
              </button>
              {items.length > 0 && (
                <button className="btn-text" onClick={cart.clear}>
                  Clear selection
                </button>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  )
}

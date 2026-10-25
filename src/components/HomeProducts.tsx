import { useMemo, useState } from 'react'
import { useCatalog } from '../store/catalog'
import type { Product } from '../data/types'
import { IconArrow } from './Icons'
import { ProductCard, ProductDialog, SkeletonGrid, openShop } from './shop/ProductCard'

const HOME_LIMIT = 8

/** A short showcase on the home page; the full catalogue lives on the shop page. */
export default function HomeProducts() {
  const { products, categories, loading, error } = useCatalog()
  const [open, setOpen] = useState<Product | null>(null)
  const shown = products.slice(0, HOME_LIMIT)
  const cats = useMemo(() => categories.filter((c) => products.some((p) => p.category === c.name)), [categories, products])

  return (
    <section className="section" id="products">
      <div className="wrap">
        <div className="section-head section-head--row reveal">
          <div>
            <span className="eyebrow">Products</span>
            <h2>Build your system and see the price as you go.</h2>
          </div>
          <p>Add the cameras and equipment you need. Your estimated total updates as you go, and you can book a visit with the selection attached.</p>
        </div>

        {cats.length > 0 && (
          <div className="quickcats">
            <span>Browse by category</span>
            {cats.map((c) => (
              <button key={c.id} className="cat" onClick={() => openShop(c.name)}>
                {c.name} <span>{products.filter((p) => p.category === c.name).length}</span>
              </button>
            ))}
          </div>
        )}

        {error ? (
          <div className="empty">
            <p>{error}</p>
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : (
          <div className="pgrid">
            {shown.map((p) => (
              <ProductCard key={p.id} p={p} onOpen={setOpen} />
            ))}
          </div>
        )}

        <div className="viewall">
          <a href="#shop" className="btn btn--primary" onClick={() => openShop()}>
            View all products{products.length ? ` (${products.length})` : ''} <IconArrow />
          </a>
          <p className="fine">Prices are per unit. Installation, cabling and hard disks are quoted after the free site survey.</p>
        </div>
      </div>
      {open && <ProductDialog p={open} onClose={() => setOpen(null)} />}
    </section>
  )
}

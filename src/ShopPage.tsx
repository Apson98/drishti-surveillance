import { useEffect, useMemo, useState } from 'react'
import Nav from './components/Nav'
import Footer from './components/Footer'
import { useCatalog } from './store/catalog'
import { useCart } from './store/cart'
import { npr, type Product } from './data/types'
import { IconArrow, IconSearch } from './components/Icons'
import { ProductCard, ProductDialog, SkeletonGrid } from './components/shop/ProductCard'

type Sort = 'featured' | 'low' | 'high' | 'name'
const PAGE = 24

function initialCategory() {
  try {
    const c = sessionStorage.getItem('ds_shop_cat')
    sessionStorage.removeItem('ds_shop_cat')
    return c || 'All'
  } catch {
    return 'All'
  }
}

export default function ShopPage() {
  const { products, categories, loading, error, reload } = useCatalog()
  const cart = useCart()
  const { count, total } = cart.priced(products)
  const [cat, setCat] = useState(initialCategory)
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('All')
  const [sort, setSort] = useState<Sort>('featured')
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<Product | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Shop · Drishti Surveillance'
    return () => {
      document.title = 'Drishti Surveillance'
    }
  }, [])
  useEffect(() => setLimit(PAGE), [cat, q, brand, sort])

  // categories in the admin's order, only those with products; plus any category a product uses that isn't in the list
  const cats = useMemo(() => {
    const names = categories.map((c) => c.name)
    products.forEach((p) => p.category && !names.includes(p.category) && names.push(p.category))
    return names.map((n) => [n, products.filter((p) => p.category === n).length] as const).filter(([, n]) => n > 0)
  }, [categories, products])
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand).filter(Boolean))].sort(), [products])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = products.filter(
      (p) =>
        (cat === 'All' || p.category === cat) &&
        (brand === 'All' || p.brand === brand) &&
        (!needle || [p.name, p.brand, p.category, p.summary].join(' ').toLowerCase().includes(needle)),
    )
    if (sort === 'low') list.sort((a, b) => a.price - b.price)
    if (sort === 'high') list.sort((a, b) => b.price - a.price)
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [products, cat, brand, q, sort])

  const clear = () => {
    setCat('All')
    setBrand('All')
    setQ('')
  }

  return (
    <>
      <Nav />
      <main className="shop">
        <header className="shop__hero">
          <div className="wrap">
            <nav className="crumbs" aria-label="Breadcrumb">
              <a href="#top">Home</a> <span aria-hidden="true">/</span> <span>Shop</span>
            </nav>
            <h1>Shop</h1>
            <p>Hikvision and EZVIZ cameras, recorders and network equipment. Add what you need and book a free site survey with your selection.</p>
          </div>
        </header>

        <div className="wrap shop__layout">
          <aside className="shop__side" aria-label="Filters">
            <div className="fgroup">
              <h2>Category</h2>
              <ul>
                <li>
                  <button aria-pressed={cat === 'All'} onClick={() => setCat('All')}>
                    All products <span>{products.length}</span>
                  </button>
                </li>
                {cats.map(([c, n]) => (
                  <li key={c}>
                    <button aria-pressed={cat === c} onClick={() => setCat(c)}>
                      {c} <span>{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {brands.length > 1 && (
              <div className="fgroup">
                <h2>Brand</h2>
                <ul>
                  {['All', ...brands].map((b) => (
                    <li key={b}>
                      <button aria-pressed={brand === b} onClick={() => setBrand(b)}>
                        {b === 'All' ? 'All brands' : b}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {count > 0 && (
              <div className="fgroup side-sel">
                <h2>Your selection</h2>
                <p>
                  {count} item{count > 1 ? 's' : ''} · <b>{npr(total)}</b>
                </p>
                <button className="btn btn--primary btn--sm btn--block" onClick={() => cart.setOpen(true)}>
                  Review and book <IconArrow />
                </button>
              </div>
            )}
          </aside>

          <section className="shop__main" aria-label="Products">
            <div className="shop__tools">
              <label className="search">
                <IconSearch />
                <input id="shop-q" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
              </label>
              <div className="shop__tools-end">
                <span className="muted">
                  {filtered.length} product{filtered.length === 1 ? '' : 's'}
                </span>
                <select id="shop-sort-full" aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="name">Name A–Z</option>
                </select>
              </div>
            </div>
            {/* category chips for small screens, where the sidebar is hidden */}
            <div className="cats shop__chips" role="tablist" aria-label="Category">
              {[['All', products.length] as const, ...cats].map(([c, n]) => (
                <button key={c} role="tab" aria-selected={cat === c} className="cat" onClick={() => setCat(c)}>
                  {c} <span>{n}</span>
                </button>
              ))}
            </div>

            {error ? (
              <div className="empty">
                <p>{error}</p>
                <button className="btn btn--ghost" onClick={reload}>
                  Try again
                </button>
              </div>
            ) : loading ? (
              <SkeletonGrid n={6} />
            ) : filtered.length === 0 ? (
              <div className="empty">
                <p>No products match these filters.</p>
                <button className="btn btn--ghost" onClick={clear}>
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="pgrid pgrid--shop">
                  {filtered.slice(0, limit).map((p) => (
                    <ProductCard key={p.id} p={p} onOpen={setOpen} />
                  ))}
                </div>
                {filtered.length > limit && (
                  <div className="loadmore">
                    <span className="muted">
                      Showing {limit} of {filtered.length}
                    </span>
                    <button className="btn btn--ghost" onClick={() => setLimit((l) => l + PAGE)}>
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
            <p className="fine">Prices are per unit. Installation, cabling and hard disks are quoted after the free site survey.</p>
          </section>
        </div>
      </main>
      <Footer />
      {open && <ProductDialog p={open} onClose={() => setOpen(null)} />}
    </>
  )
}

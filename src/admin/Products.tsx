import { useEffect, useState } from 'react'
import { data, imageUrl } from '../data/source'
import { npr, type Category, type Product, type Spec } from '../data/types'
import { ConfirmButton, Drawer } from './ui'
import ImageInput from './ImageInput'

type Draft = Omit<Product, 'id'> & { id?: string }
const blank = (sort: number): Draft => ({ name: '', brand: '', category: '', price: 0, summary: '', description: '', specs: [], image: '', active: true, sort })

function ProductForm({ initial, categories, onSaved, onClose, onCategoryAdded }: { initial: Draft; categories: Category[]; onSaved: (p: Product) => void; onClose: () => void; onCategoryAdded: (c: Category) => void }) {
  const [d, setD] = useState<Draft>(initial)
  const [price, setPrice] = useState(initial.price ? String(initial.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newCat, setNewCat] = useState<string | null>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const setSpec = (i: number, k: keyof Spec, v: string) => set('specs', d.specs.map((s, j) => (j === i ? { ...s, [k]: v } : s)))

  const save = async () => {
    const p = Number(price.replace(/[^\d.]/g, ''))
    if (!d.name.trim()) return setError('Give the product a name.')
    if (!price.trim() || !Number.isFinite(p)) return setError('Enter the price in rupees.')
    if (!d.category) return setError('Choose a category.')
    setSaving(true)
    setError(null)
    try {
      const saved = await data.admin.saveProduct({
        ...d,
        name: d.name.trim(),
        category: d.category,
        price: p,
        specs: d.specs.filter((s) => s.label.trim() && s.value.trim()),
      })
      onSaved(saved)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  return (
    <Drawer
      title={d.id ? 'Edit product' : 'Add product'}
      onClose={onClose}
      footer={
        <>
          {error && <p className="aerr">{error}</p>}
          <div className="afoot-actions">
            <button className="abtn abtn--quiet" onClick={onClose}>
              Cancel
            </button>
            <button className="abtn abtn--primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : d.id ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </>
      }
    >
      <div className="aform">
        <ImageInput label="Photo" value={d.image} onChange={(v) => set('image', v)} />
        <label className="afield">
          <span className="field-label">Product name</span>
          <input id="pf-name" value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Bullet camera 4 MP" />
        </label>
        <div className="arow">
          <label className="afield">
            <span className="field-label">Brand</span>
            <input id="pf-brand" list="brands" value={d.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Hikvision" />
            <datalist id="brands">
              <option value="Hikvision" />
              <option value="EZVIZ" />
            </datalist>
          </label>
          <div className="afield">
            <span className="field-label">Category</span>
            {newCat === null ? (
              <div className="acat-pick">
                <select id="pf-cat" value={d.category} onChange={(e) => (e.target.value === '__new' ? setNewCat('') : set('category', e.target.value))}>
                  <option value="">Choose…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {d.category && !categories.some((c) => c.name === d.category) && <option value={d.category}>{d.category}</option>}
                  <option value="__new">+ New category…</option>
                </select>
              </div>
            ) : (
              <div className="acat-pick">
                <input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" aria-label="New category name" />
                <button
                  type="button"
                  className="abtn abtn--primary"
                  onClick={async () => {
                    if (!newCat.trim()) return setNewCat(null)
                    try {
                      const c = await data.admin.saveCategory({ name: newCat.trim(), sort: categories.length + 1 })
                      onCategoryAdded(c)
                      set('category', c.name)
                      setNewCat(null)
                    } catch (e) {
                      setError((e as Error).message)
                    }
                  }}
                >
                  Add
                </button>
                <button type="button" className="abtn abtn--quiet" onClick={() => setNewCat(null)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="arow">
          <label className="afield">
            <span className="field-label">Price (Rs)</span>
            <input id="pf-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="4800" />
          </label>
          <label className="afield">
            <span className="field-label">Display order</span>
            <input id="pf-sort" type="number" value={d.sort} onChange={(e) => set('sort', Number(e.target.value))} />
          </label>
        </div>
        <label className="afield">
          <span className="field-label">Short summary</span>
          <input id="pf-summary" value={d.summary} onChange={(e) => set('summary', e.target.value)} maxLength={200} placeholder="One line shown on the product card" />
        </label>
        <label className="afield">
          <span className="field-label">Description</span>
          <textarea id="pf-desc" value={d.description} onChange={(e) => set('description', e.target.value)} rows={5} placeholder="Shown when a customer opens the product" />
        </label>

        <div className="afield">
          <span className="field-label">Specifications</span>
          <div className="specs-edit">
            {d.specs.map((s, i) => (
              <div className="specs-edit__row" key={i}>
                <input aria-label="Specification" value={s.label} onChange={(e) => setSpec(i, 'label', e.target.value)} placeholder="Resolution" />
                <input aria-label="Value" value={s.value} onChange={(e) => setSpec(i, 'value', e.target.value)} placeholder="4 MP" />
                <button type="button" className="abtn abtn--quiet" onClick={() => set('specs', d.specs.filter((_, j) => j !== i))} aria-label="Remove specification">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="abtn" onClick={() => set('specs', [...d.specs, { label: '', value: '' }])}>
              Add specification
            </button>
          </div>
        </div>

        <label className="acheck">
          <input id="pf-active" type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} />
          <span>
            Show on website
            <small>Turn off to hide a product without deleting it.</small>
          </span>
        </label>
      </div>
    </Drawer>
  )
}

export default function Products({ notify }: { notify: (t: string) => void }) {
  const [list, setList] = useState<Product[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [q, setQ] = useState('')
  const [cats, setCats] = useState<Category[]>([])
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    data.admin.listProducts().then(setList).catch((e) => setError(e.message))
    data.listCategories().then(setCats).catch(() => {})
  }, [])
  const shown = (list ?? []).filter((p) => (!catFilter || p.category === catFilter) && (!q || [p.name, p.brand, p.category].join(' ').toLowerCase().includes(q.toLowerCase())))

  const saved = (p: Product) => {
    setList((l) => {
      const rest = (l ?? []).filter((x) => x.id !== p.id && x.id !== editing?.id)
      return [...rest, p].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
    })
    notify(editing?.id ? 'Product updated' : 'Product added')
    setEditing(null)
  }
  const toggle = async (p: Product) => {
    try {
      const s = await data.admin.saveProduct({ ...p, active: !p.active })
      setList((l) => l!.map((x) => (x.id === p.id ? s : x)))
      notify(s.active ? `${p.name} is now on the website` : `${p.name} is hidden`)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  const remove = async (p: Product) => {
    try {
      await data.admin.deleteProduct(p.id)
      setList((l) => l!.filter((x) => x.id !== p.id))
      notify('Product deleted')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  return (
    <div className="apanel">
      <div className="apanel__head">
        <div>
          <h1>Products</h1>
          <p>{list ? `${list.length} products · ${list.filter((p) => p.active).length} on the website` : 'Loading…'}</p>
        </div>
        <div className="apanel__tools">
          <select id="ap-cat" className="asearch asearch--select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <input id="ap-search" className="asearch" type="search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="abtn abtn--primary" onClick={() => setEditing(blank((list?.length ?? 0) + 1))}>
            Add product
          </button>
        </div>
      </div>
      {error && <p className="aerr">{error}</p>}
      {list && list.length === 0 && (
        <div className="aempty">
          <h3>No products yet</h3>
          <p>Add your first product with a photo and price. It appears on the website straight away.</p>
        </div>
      )}
      {shown.length > 0 && (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th className="num">Price</th>
                <th>On website</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className={p.active ? '' : 'is-off'}>
                  <td>
                    <div className="aprod">
                      <span className="athumb">{p.image ? <img src={imageUrl(p.image)} alt="" /> : null}</span>
                      <span>
                        <b>{p.name}</b>
                        <small>{p.brand || '—'}</small>
                      </span>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td className="num">{npr(p.price)}</td>
                  <td>
                    <button className={`switch ${p.active ? 'is-on' : ''}`} role="switch" aria-checked={p.active} onClick={() => toggle(p)} aria-label={`Show ${p.name} on website`}>
                      <span />
                    </button>
                  </td>
                  <td className="actions">
                    <button className="abtn" onClick={() => setEditing({ ...p })}>
                      Edit
                    </button>
                    <ConfirmButton onConfirm={() => remove(p)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ProductForm initial={editing} categories={cats} onSaved={saved} onClose={() => setEditing(null)} onCategoryAdded={(c) => setCats((l) => [...l, c])} />}
    </div>
  )
}

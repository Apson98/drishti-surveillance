import { useEffect, useState } from 'react'
import { data } from '../data/source'
import type { Category, Product } from '../data/types'
import { ConfirmButton } from './ui'

export default function Categories({ notify }: { notify: (t: string) => void }) {
  const [list, setList] = useState<Category[] | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    Promise.all([data.listCategories(), data.admin.listProducts()])
      .then(([c, p]) => {
        setList(c)
        setProducts(p)
      })
      .catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  const count = (c: Category) => products.filter((p) => p.category.toLowerCase() === c.name.toLowerCase()).length

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const c = await data.admin.saveCategory({ name: name.trim(), sort: (list?.length ?? 0) + 1 })
      setList((l) => [...(l ?? []), c])
      setName('')
      notify(`Added “${c.name}”`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const rename = async (c: Category) => {
    if (!editing || !editing.name.trim() || editing.name.trim() === c.name) return setEditing(null)
    try {
      const saved = await data.admin.saveCategory({ ...c, name: editing.name.trim() })
      setEditing(null)
      notify(`Renamed to “${saved.name}”${count(c) ? ', products moved with it' : ''}`)
      load()
    } catch (err) {
      notify((err as Error).message)
    }
  }
  const move = async (i: number, dir: -1 | 1) => {
    const l = [...(list ?? [])]
    const j = i + dir
    if (j < 0 || j >= l.length) return
    ;[l[i], l[j]] = [l[j], l[i]]
    const withSort = l.map((c, k) => ({ ...c, sort: k + 1 }))
    setList(withSort)
    try {
      for (const c of [withSort[i], withSort[j]]) await data.admin.saveCategory(c)
    } catch (err) {
      notify((err as Error).message)
    }
  }
  const remove = async (c: Category) => {
    try {
      await data.admin.deleteCategory(c)
      setList((l) => l!.filter((x) => x.id !== c.id))
      notify(`Deleted “${c.name}”`)
    } catch (err) {
      notify((err as Error).message)
    }
  }

  return (
    <div className="apanel">
      <div className="apanel__head">
        <div>
          <h1>Categories</h1>
          <p>Shown as filters in the shop, in this order. Categories without visible products are hidden from customers.</p>
        </div>
      </div>
      <form className="acat-add" onSubmit={add}>
        <input id="cat-new" className="asearch" placeholder="New category, e.g. Hard disks" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <button className="abtn abtn--primary" disabled={busy || !name.trim()}>
          Add category
        </button>
      </form>
      {error && <p className="aerr">{error}</p>}
      {list && (
        <div className="atable-wrap">
          <table className="atable">
            <thead>
              <tr>
                <th>Category</th>
                <th className="num">Products</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    {editing?.id === c.id ? (
                      <form
                        className="acat-edit"
                        onSubmit={(e) => {
                          e.preventDefault()
                          rename(c)
                        }}
                      >
                        <input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Category name" maxLength={60} />
                        <button className="abtn abtn--primary">Save</button>
                        <button type="button" className="abtn abtn--quiet" onClick={() => setEditing(null)}>
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <b>{c.name}</b>
                    )}
                  </td>
                  <td className="num">{count(c)}</td>
                  <td className="actions">
                    <button className="abtn abtn--icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${c.name} up`}>
                      ↑
                    </button>
                    <button className="abtn abtn--icon" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${c.name} down`}>
                      ↓
                    </button>
                    <button className="abtn" onClick={() => setEditing({ id: c.id, name: c.name })}>
                      Rename
                    </button>
                    <ConfirmButton onConfirm={() => remove(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

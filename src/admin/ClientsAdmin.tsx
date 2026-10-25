import { useEffect, useState } from 'react'
import { data, imageUrl } from '../data/source'
import type { Client } from '../data/types'
import { ConfirmButton, Drawer } from './ui'
import ImageInput from './ImageInput'

type Draft = Omit<Client, 'id'> & { id?: string }

export default function ClientsAdmin({ notify }: { notify: (t: string) => void }) {
  const [list, setList] = useState<Client[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    data.listClients().then(setList).catch((e) => setError(e.message))
  }, [])

  const sorted = (l: Client[]) => [...l].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))

  const save = async () => {
    if (!editing) return
    if (!editing.name.trim()) return setFormError('Enter the client name.')
    setSaving(true)
    setFormError(null)
    try {
      const c = await data.admin.saveClient({ ...editing, name: editing.name.trim() })
      setList((l) => sorted([...(l ?? []).filter((x) => x.id !== c.id && x.id !== editing.id), c]))
      notify(editing.id ? 'Client updated' : 'Client added')
      setEditing(null)
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }
  const move = async (c: Client, dir: -1 | 1) => {
    const l = sorted(list ?? [])
    const i = l.findIndex((x) => x.id === c.id)
    const j = i + dir
    if (j < 0 || j >= l.length) return
    const reordered = [...l]
    ;[reordered[i], reordered[j]] = [reordered[j], reordered[i]]
    const withSort = reordered.map((x, k) => ({ ...x, sort: k + 1 }))
    setList(withSort)
    try {
      for (const x of [withSort[i], withSort[j]]) await data.admin.saveClient(x)
    } catch (e) {
      notify((e as Error).message)
    }
  }
  const remove = async (c: Client) => {
    try {
      await data.admin.deleteClient(c.id)
      setList((l) => l!.filter((x) => x.id !== c.id))
      notify('Client removed')
    } catch (e) {
      notify((e as Error).message)
    }
  }

  return (
    <div className="apanel">
      <div className="apanel__head">
        <div>
          <h1>Clients</h1>
          <p>Logos and reviews shown in the sliding “Our clients” section of the website, in this order.</p>
        </div>
        <button className="abtn abtn--primary" onClick={() => setEditing({ name: '', logo: '', review: '', reviewer: '', role: '', sort: (list?.length ?? 0) + 1 })}>
          Add client
        </button>
      </div>
      {error && <p className="aerr">{error}</p>}
      {list && list.length === 0 && (
        <div className="aempty">
          <h3>No clients yet</h3>
          <p>Add a client with their logo and it appears on the website.</p>
        </div>
      )}
      <ul className="aclients">
        {sorted(list ?? []).map((c, i, arr) => (
          <li key={c.id}>
            <span className="aclients__logo">{c.logo ? <img src={imageUrl(c.logo)} alt="" /> : <b>{c.name.slice(0, 2)}</b>}</span>
            <b className="aclients__name">{c.name}</b>
            <p className="aclients__review">{c.review ? `“${c.review}”` : <span className="muted">No review yet</span>}</p>
            {c.review && <small className="muted">{[c.reviewer, c.role].filter(Boolean).join(', ')}</small>}
            <div className="aclients__actions">
              <button className="abtn abtn--icon" onClick={() => move(c, -1)} disabled={i === 0} aria-label={`Move ${c.name} earlier`}>
                ←
              </button>
              <button className="abtn abtn--icon" onClick={() => move(c, 1)} disabled={i === arr.length - 1} aria-label={`Move ${c.name} later`}>
                →
              </button>
              <button className="abtn" onClick={() => setEditing({ ...c })}>
                Edit
              </button>
              <ConfirmButton label="Remove" confirm="Confirm" onConfirm={() => remove(c)} />
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <Drawer
          title={editing.id ? 'Edit client' : 'Add client'}
          onClose={() => setEditing(null)}
          footer={
            <>
              {formError && <p className="aerr">{formError}</p>}
              <div className="afoot-actions">
                <button className="abtn abtn--quiet" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button className="abtn abtn--primary" onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : editing.id ? 'Save changes' : 'Add client'}
                </button>
              </div>
            </>
          }
        >
          <div className="aform">
            <ImageInput label="Logo" value={editing.logo} onChange={(v) => setEditing({ ...editing, logo: v })} />
            <label className="afield">
              <span className="field-label">Client name</span>
              <input id="cf-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Robam Appliances" />
            </label>
            <label className="afield">
              <span className="field-label">Client review</span>
              <textarea id="cf-review" rows={5} maxLength={800} value={editing.review} onChange={(e) => setEditing({ ...editing, review: e.target.value })} placeholder="What the client said about working with Drishti" />
              <span className="hint">{editing.review.length}/800 · leave empty to show the logo without a review</span>
            </label>
            <div className="arow">
              <label className="afield">
                <span className="field-label">Reviewed by</span>
                <input id="cf-reviewer" value={editing.reviewer} onChange={(e) => setEditing({ ...editing, reviewer: e.target.value })} placeholder="e.g. Ramesh Shrestha" />
              </label>
              <label className="afield">
                <span className="field-label">Role or company</span>
                <input id="cf-role" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} placeholder="e.g. Operations Manager" />
              </label>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}

import { useRef, useState } from 'react'
import { data, imageUrl } from '../data/source'

/** Pick an image, upload it straight away, and hand back the stored reference. */
export default function ImageInput({ value, onChange, label, fit = 'contain' }: { value: string; onChange: (v: string) => void; label: string; fit?: 'contain' | 'cover' }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)

  const handle = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > 5 * 1024 * 1024) return setError('Please choose an image under 5 MB.')
    setError(null)
    setBusy(true)
    try {
      onChange(await data.admin.uploadImage(file))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="img-input">
      <span className="field-label">{label}</span>
      <div
        className={`img-drop ${drag ? 'is-drag' : ''} ${value ? 'has-img' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handle(e.dataTransfer.files?.[0])
        }}
      >
        {value ? <img src={imageUrl(value)} alt="" style={{ objectFit: fit }} /> : <span className="img-drop__hint">Drop an image here</span>}
        {busy && <span className="img-drop__busy">Uploading…</span>}
      </div>
      <div className="img-input__actions">
        <button type="button" className="abtn" onClick={() => input.current?.click()} disabled={busy}>
          {value ? 'Replace image' : 'Choose image'}
        </button>
        {value && (
          <button type="button" className="abtn abtn--quiet" onClick={() => onChange('')} disabled={busy}>
            Remove
          </button>
        )}
        <span className="hint">JPG, PNG, WebP or SVG, up to 5 MB</span>
      </div>
      {error && <p className="aerr">{error}</p>}
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  )
}

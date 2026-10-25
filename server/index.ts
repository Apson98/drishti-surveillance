// Drishti Surveillance web server: JSON API, admin, image uploads and the built website.
import express from 'express'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import path from 'node:path'
import { mkdirSync, existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { appointments, categories, clients, products } from './db'
import { checkPassword, clearSession, isAdmin, issueSession, loginLimiter, recordFailure, requireAdmin } from './auth'
import { makeRef, priceItems, validateAppointment, type AppointmentStatus, type NewAppointment, type Product } from '../src/data/types'

const PORT = Number(process.env.PORT || 4000)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve('uploads')
mkdirSync(UPLOAD_DIR, { recursive: true })

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '200kb' }))
app.use(cookieParser())

// ---------------------------------------------------------------- uploads (admin only)
const IMAGE_TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/gif': '.gif' }
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, randomUUID() + (IMAGE_TYPES[file.mimetype] || '')),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype in IMAGE_TYPES),
})
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }))

app.post('/api/admin/upload', requireAdmin, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'The image is larger than 5 MB.' : 'Upload failed.' })
    if (!req.file) return res.status(400).json({ error: 'Please choose a JPG, PNG, WebP or SVG image.' })
    res.json({ url: '/uploads/' + req.file.filename })
  })
})

// ---------------------------------------------------------------- public API
app.get('/api/products', (_req, res) => res.json(products.list()))
app.get('/api/clients', (_req, res) => res.json(clients.list()))
app.get('/api/categories', (_req, res) => res.json(categories.list()))

app.post('/api/appointments', (req, res) => {
  const body = req.body as Partial<NewAppointment>
  const problem = validateAppointment(body)
  if (problem) return res.status(400).json({ error: problem })
  const priced = priceItems(Array.isArray(body.items) ? body.items : [], products.list())
  const clip = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n)
  const saved = appointments.create({
    ref: makeRef(),
    name: clip(body.name, 120),
    phone: clip(body.phone, 40),
    email: clip(body.email, 160),
    address: clip(body.address, 300),
    date: clip(body.date, 10),
    slot: clip(body.slot, 40),
    notes: clip(body.notes, 2000),
    items: priced.items,
    total: priced.total,
    status: 'new',
    createdAt: new Date().toISOString(),
  })
  res.status(201).json({ ref: saved.ref, total: saved.total })
})

// ---------------------------------------------------------------- admin API
app.get('/api/admin/me', (req, res) => res.json({ admin: isAdmin(req) }))
app.post('/api/admin/login', loginLimiter, (req, res) => {
  if (!checkPassword(String(req.body?.password ?? ''))) {
    recordFailure(req)
    return res.status(401).json({ error: 'That password is not correct.' })
  }
  issueSession(req, res)
  res.json({ admin: true })
})
app.post('/api/admin/logout', (_req, res) => {
  clearSession(res)
  res.json({ admin: false })
})

function cleanProduct(b: Partial<Product>): Omit<Product, 'id'> | string {
  const name = String(b.name ?? '').trim()
  const price = Number(b.price)
  if (!name) return 'Product name is required.'
  if (!Number.isFinite(price) || price < 0) return 'Enter a valid price.'
  return {
    name: name.slice(0, 160),
    brand: String(b.brand ?? '').trim().slice(0, 60),
    category: String(b.category ?? '').trim().slice(0, 60) || 'Other',
    price,
    summary: String(b.summary ?? '').trim().slice(0, 200),
    description: String(b.description ?? '').trim().slice(0, 4000),
    specs: (Array.isArray(b.specs) ? b.specs : [])
      .map((s) => ({ label: String(s?.label ?? '').trim().slice(0, 60), value: String(s?.value ?? '').trim().slice(0, 120) }))
      .filter((s) => s.label && s.value)
      .slice(0, 20),
    image: String(b.image ?? '').slice(0, 500),
    active: b.active !== false,
    sort: Number.isFinite(Number(b.sort)) ? Number(b.sort) : 0,
  }
}

app.get('/api/admin/products', requireAdmin, (_req, res) => res.json(products.list(true)))
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const p = cleanProduct(req.body)
  if (typeof p === 'string') return res.status(400).json({ error: p })
  res.status(201).json(products.save(p))
})
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  if (!products.get(req.params.id)) return res.status(404).json({ error: 'Product not found.' })
  const p = cleanProduct(req.body)
  if (typeof p === 'string') return res.status(400).json({ error: p })
  res.json(products.save({ ...p, id: req.params.id }))
})
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  products.remove(req.params.id)
  res.json({ ok: true })
})

function cleanClient(b: Record<string, unknown>) {
  const name = String(b?.name ?? '').trim().slice(0, 120)
  if (!name) return 'Client name is required.'
  return {
    name,
    logo: String(b?.logo ?? '').slice(0, 500),
    review: String(b?.review ?? '').trim().slice(0, 800),
    reviewer: String(b?.reviewer ?? '').trim().slice(0, 120),
    role: String(b?.role ?? '').trim().slice(0, 120),
    sort: Number(b?.sort) || 0,
  }
}
app.post('/api/admin/clients', requireAdmin, (req, res) => {
  const c = cleanClient(req.body)
  if (typeof c === 'string') return res.status(400).json({ error: c })
  res.status(201).json(clients.save(c))
})
app.put('/api/admin/clients/:id', requireAdmin, (req, res) => {
  const c = cleanClient(req.body)
  if (typeof c === 'string') return res.status(400).json({ error: c })
  res.json(clients.save({ ...c, id: req.params.id }))
})
app.delete('/api/admin/clients/:id', requireAdmin, (req, res) => {
  clients.remove(req.params.id)
  res.json({ ok: true })
})

function cleanCategory(b: Record<string, unknown>, id?: string) {
  const name = String(b?.name ?? '').trim().slice(0, 60)
  if (!name) return 'Category name is required.'
  const clash = categories.byName(name)
  if (clash && clash.id !== id) return `There is already a category called “${clash.name}”.`
  return { name, sort: Number(b?.sort) || 0 }
}
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const c = cleanCategory(req.body)
  if (typeof c === 'string') return res.status(400).json({ error: c })
  res.status(201).json(categories.save(c))
})
app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  if (!categories.get(req.params.id)) return res.status(404).json({ error: 'Category not found.' })
  const c = cleanCategory(req.body, req.params.id)
  if (typeof c === 'string') return res.status(400).json({ error: c })
  res.json(categories.save({ ...c, id: req.params.id }))
})
app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const c = categories.get(req.params.id)
  if (!c) return res.json({ ok: true })
  const n = categories.productCount(c.name)
  if (n > 0) return res.status(409).json({ error: `Move or delete the ${n} product${n > 1 ? 's' : ''} in “${c.name}” first.` })
  categories.remove(c.id)
  res.json({ ok: true })
})

app.get('/api/admin/appointments', requireAdmin, (_req, res) => res.json(appointments.list()))
app.patch('/api/admin/appointments/:id', requireAdmin, (req, res) => {
  const status = String(req.body?.status) as AppointmentStatus
  if (!['new', 'confirmed', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Unknown status.' })
  appointments.setStatus(req.params.id, status)
  res.json({ ok: true })
})
app.delete('/api/admin/appointments/:id', requireAdmin, (req, res) => {
  appointments.remove(req.params.id)
  res.json({ ok: true })
})

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }))

// ---------------------------------------------------------------- website (after `npm run build`)
const DIST = path.resolve('dist')
if (existsSync(DIST)) {
  app.use(express.static(DIST, { index: 'index.html', maxAge: '1h' }))
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
}

app.listen(PORT, () => console.log(`Drishti server running on http://localhost:${PORT}`))

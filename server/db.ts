// SQLite storage using Node's built-in driver (no native packages to compile).
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type { Appointment, AppointmentStatus, Category, Client, Product } from '../src/data/types'
import { seedCategories, seedClients, seedProducts } from '../src/data/seed'

const DATA_DIR = process.env.DATA_DIR || path.resolve('data')
mkdirSync(DATA_DIR, { recursive: true })
export const db = new DatabaseSync(path.join(DATA_DIR, 'drishti.db'))

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT, category TEXT, price REAL NOT NULL DEFAULT 0,
    summary TEXT, description TEXT, specs TEXT NOT NULL DEFAULT '[]', image TEXT, active INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, logo TEXT, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE COLLATE NOCASE, sort INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY, ref TEXT NOT NULL, name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, address TEXT,
    date TEXT, slot TEXT, notes TEXT, items TEXT NOT NULL DEFAULT '[]', total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL
  );
`)

type Row = Record<string, unknown>

// ---------------------------------------------------------------- upgrades for databases made by older versions
const hasColumn = (table: string, col: string) => (db.prepare(`PRAGMA table_info(${table})`).all() as Row[]).some((r) => r.name === col)
let reviewsAdded = false
for (const col of ['review', 'reviewer', 'role']) {
  if (!hasColumn('clients', col)) {
    db.exec(`ALTER TABLE clients ADD COLUMN ${col} TEXT NOT NULL DEFAULT ''`)
    reviewsAdded = true
  }
}

const toProduct = (r: Row): Product => ({
  id: String(r.id),
  name: String(r.name),
  brand: String(r.brand ?? ''),
  category: String(r.category ?? ''),
  price: Number(r.price),
  summary: String(r.summary ?? ''),
  description: String(r.description ?? ''),
  specs: JSON.parse(String(r.specs || '[]')),
  image: String(r.image ?? ''),
  active: Boolean(r.active),
  sort: Number(r.sort),
})
const toClient = (r: Row): Client => ({
  id: String(r.id),
  name: String(r.name),
  logo: String(r.logo ?? ''),
  review: String(r.review ?? ''),
  reviewer: String(r.reviewer ?? ''),
  role: String(r.role ?? ''),
  sort: Number(r.sort),
})
const toCategory = (r: Row): Category => ({ id: String(r.id), name: String(r.name), sort: Number(r.sort) })
const toAppointment = (r: Row): Appointment => ({
  id: String(r.id),
  ref: String(r.ref),
  name: String(r.name),
  phone: String(r.phone),
  email: String(r.email ?? ''),
  address: String(r.address ?? ''),
  date: String(r.date ?? ''),
  slot: String(r.slot ?? ''),
  notes: String(r.notes ?? ''),
  items: JSON.parse(String(r.items || '[]')),
  total: Number(r.total),
  status: String(r.status) as AppointmentStatus,
  createdAt: String(r.created_at),
})

// ---------------------------------------------------------------- products
export const products = {
  list: (includeHidden = false) =>
    (db.prepare(`SELECT * FROM products ${includeHidden ? '' : 'WHERE active = 1'} ORDER BY sort, created_at`).all() as Row[]).map(toProduct),
  get: (id: string) => {
    const r = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Row | undefined
    return r ? toProduct(r) : null
  },
  save: (p: Omit<Product, 'id'> & { id?: string }) => {
    const id = p.id || randomUUID()
    db.prepare(
      `INSERT INTO products (id, name, brand, category, price, summary, description, specs, image, active, sort, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, brand=excluded.brand, category=excluded.category, price=excluded.price,
         summary=excluded.summary, description=excluded.description, specs=excluded.specs, image=excluded.image,
         active=excluded.active, sort=excluded.sort`,
    ).run(id, p.name, p.brand, p.category, p.price, p.summary, p.description, JSON.stringify(p.specs ?? []), p.image, p.active ? 1 : 0, p.sort, new Date().toISOString())
    return products.get(id)!
  },
  remove: (id: string) => db.prepare('DELETE FROM products WHERE id = ?').run(id),
}

// ---------------------------------------------------------------- clients
export const clients = {
  list: () => (db.prepare('SELECT * FROM clients ORDER BY sort, name').all() as Row[]).map(toClient),
  save: (c: Omit<Client, 'id'> & { id?: string }) => {
    const id = c.id || randomUUID()
    db.prepare(
      `INSERT INTO clients (id, name, logo, review, reviewer, role, sort) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, logo=excluded.logo, review=excluded.review,
         reviewer=excluded.reviewer, role=excluded.role, sort=excluded.sort`,
    ).run(id, c.name, c.logo, c.review ?? '', c.reviewer ?? '', c.role ?? '', c.sort)
    return toClient(db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Row)
  },
  remove: (id: string) => db.prepare('DELETE FROM clients WHERE id = ?').run(id),
}

// ---------------------------------------------------------------- categories
export const categories = {
  list: () => (db.prepare('SELECT * FROM categories ORDER BY sort, name').all() as Row[]).map(toCategory),
  get: (id: string) => {
    const r = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Row | undefined
    return r ? toCategory(r) : null
  },
  byName: (name: string) => {
    const r = db.prepare('SELECT * FROM categories WHERE name = ? COLLATE NOCASE').get(name) as Row | undefined
    return r ? toCategory(r) : null
  },
  productCount: (name: string) => Number((db.prepare('SELECT COUNT(*) AS n FROM products WHERE category = ? COLLATE NOCASE').get(name) as Row).n),
  save: (c: Omit<Category, 'id'> & { id?: string }) => {
    const id = c.id || randomUUID()
    const before = c.id ? categories.get(c.id) : null
    db.prepare(
      `INSERT INTO categories (id, name, sort) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, sort=excluded.sort`,
    ).run(id, c.name, c.sort)
    // renaming a category moves its products along with it
    if (before && before.name !== c.name) db.prepare('UPDATE products SET category = ? WHERE category = ? COLLATE NOCASE').run(c.name, before.name)
    return categories.get(id)!
  },
  remove: (id: string) => db.prepare('DELETE FROM categories WHERE id = ?').run(id),
}

// ---------------------------------------------------------------- appointments
export const appointments = {
  list: () => (db.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all() as Row[]).map(toAppointment),
  create: (a: Omit<Appointment, 'id'>) => {
    const id = randomUUID()
    db.prepare(
      `INSERT INTO appointments (id, ref, name, phone, email, address, date, slot, notes, items, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, a.ref, a.name, a.phone, a.email, a.address, a.date, a.slot, a.notes, JSON.stringify(a.items), a.total, a.status, a.createdAt)
    return { ...a, id }
  },
  setStatus: (id: string, status: AppointmentStatus) => db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, id),
  remove: (id: string) => db.prepare('DELETE FROM appointments WHERE id = ?').run(id),
}

// first run: fill the catalogue with the starting products and clients
const count = (t: string) => Number((db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as Row).n)
if (count('products') === 0) seedProducts.forEach((p) => products.save(p))
if (count('clients') === 0) seedClients.forEach((c) => clients.save(c))
// categories: start from the seed list plus any category already used by a product
if (count('categories') === 0) {
  const names = [...seedCategories.map((c) => c.name)]
  products.list(true).forEach((p) => p.category && !names.some((n) => n.toLowerCase() === p.category.toLowerCase()) && names.push(p.category))
  names.forEach((name, i) => categories.save({ name, sort: i + 1 }))
}
// an older database just gained review columns: fill in the sample reviews for the starting clients
if (reviewsAdded) {
  for (const c of clients.list()) {
    const seed = seedClients.find((s) => s.name === c.name)
    if (seed && !c.review) clients.save({ ...c, review: seed.review, reviewer: seed.reviewer, role: seed.role })
  }
}

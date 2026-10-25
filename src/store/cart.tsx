import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Product } from '../data/types'

export type CartLine = { productId: string; qty: number }

type Cart = {
  lines: CartLine[]
  qty(id: string): number
  set(id: string, qty: number): void
  add(id: string, by?: number): void
  clear(): void
  open: boolean
  setOpen(v: boolean): void
  /** lines joined with live product data; lines for products no longer listed are dropped */
  priced(products: Product[]): { items: (CartLine & { product: Product })[]; count: number; total: number }
}

const Ctx = createContext<Cart | null>(null)
const KEY = 'ds_cart_v1'

function load(): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((l) => l && typeof l.productId === 'string' && l.qty > 0) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* storage unavailable: the selection still works for this visit */
    }
  }, [lines])

  const set = useCallback((id: string, qty: number) => {
    setLines((ls) => {
      const q = Math.max(0, Math.min(99, Math.floor(qty)))
      const rest = ls.filter((l) => l.productId !== id)
      if (q === 0) return rest
      const at = ls.findIndex((l) => l.productId === id)
      const next = [...rest]
      next.splice(at === -1 ? next.length : at, 0, { productId: id, qty: q })
      return next
    })
  }, [])

  const value = useMemo<Cart>(
    () => ({
      lines,
      qty: (id) => lines.find((l) => l.productId === id)?.qty ?? 0,
      set,
      add: (id, by = 1) => set(id, (lines.find((l) => l.productId === id)?.qty ?? 0) + by),
      clear: () => setLines([]),
      open,
      setOpen,
      priced: (products) => {
        const items = lines
          .map((l) => ({ ...l, product: products.find((p) => p.id === l.productId)! }))
          .filter((l) => l.product)
        return {
          items,
          count: items.reduce((s, l) => s + l.qty, 0),
          total: items.reduce((s, l) => s + l.qty * l.product.price, 0),
        }
      },
    }),
    [lines, open, set],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside <CartProvider>')
  return c
}

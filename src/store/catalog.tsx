import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { data } from '../data/source'
import type { Category, Client, Product } from '../data/types'

type Catalog = { products: Product[]; clients: Client[]; categories: Category[]; loading: boolean; error: string | null; reload(): void }
const Ctx = createContext<Catalog | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    let live = true
    setLoading(true)
    Promise.all([data.listProducts(), data.listClients(), data.listCategories().catch(() => [] as Category[])])
      .then(([p, c, k]) => {
        if (!live) return
        setProducts(p)
        setClients(c)
        setCategories(k)
        setError(null)
      })
      .catch((e) => live && setError(e.message || 'Could not load products.'))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [n])

  return <Ctx.Provider value={{ products, clients, categories, loading, error, reload: () => setN((x) => x + 1) }}>{children}</Ctx.Provider>
}

export function useCatalog() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return c
}

import { lazy, Suspense, useEffect, useState } from 'react'
import Site from './Site'
import ShopPage from './ShopPage'
import CartDrawer from './components/CartDrawer'
import { CartProvider } from './store/cart'
import { CatalogProvider } from './store/catalog'

const AdminApp = lazy(() => import('./admin/AdminApp'))

type Route = 'home' | 'shop' | 'admin'
const routeFor = (hash: string): Route => (hash === '#admin' ? 'admin' : hash === '#shop' ? 'shop' : 'home')

/** "#shop" is the full catalogue, "#admin" the Admin Panel; any other hash is a section of the home page. */
export default function App() {
  const [route, setRoute] = useState<Route>(() => routeFor(location.hash))
  useEffect(() => {
    const on = () => setRoute(routeFor(location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  if (route === 'admin')
    return (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    )
  return (
    <CatalogProvider>
      <CartProvider>
        {route === 'shop' ? <ShopPage /> : <Site />}
        <CartDrawer />
      </CartProvider>
    </CatalogProvider>
  )
}

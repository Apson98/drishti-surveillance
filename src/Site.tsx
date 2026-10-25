import { useEffect } from 'react'
import Lenis from 'lenis'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Partners from './components/Partners'
import Solutions from './components/Solutions'
import HomeProducts from './components/HomeProducts'
import Coverage from './components/Coverage'
import Clients from './components/Clients'
import Process from './components/Process'
import Booking from './components/Booking'
import Footer from './components/Footer'

export default function Site() {
  // smooth scrolling + anchor links
  useEffect(() => {
    // arriving from the shop page with a section in the address (e.g. #book): go to it once the page has laid out
    const target = location.hash.slice(1)
    const jump = (fn: (el: HTMLElement) => void) => {
      if (!target || target === 'top') return window.scrollTo(0, 0)
      setTimeout(() => {
        const el = document.getElementById(target)
        if (el) fn(el)
      }, 450)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return void jump((el) => el.scrollIntoView())
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true, prevent: (node) => Boolean(node.closest?.('.sheet, .dialog-wrap')) })
    let raf = 0
    const loop = (t: number) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null
      if (!a) return
      const id = a.getAttribute('href')!
      if (id === '#admin' || id === '#shop') return
      const el = id === '#top' ? document.body : document.querySelector(id)
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el as HTMLElement, { offset: id === '#top' ? 0 : -76 })
    }
    document.addEventListener('click', onClick)
    jump((el) => lenis.scrollTo(el, { offset: -76 }))
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('click', onClick)
      lenis.destroy()
    }
  }, [])

  // section reveal: elements start visible and settle into place
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -8% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
        <Nav />
        <main>
          <Hero />
          <Partners />
          <Solutions />
          <HomeProducts />
          <Coverage />
          <Clients />
          <Process />
          <Booking />
        </main>
        <Footer />
    </>
  )
}

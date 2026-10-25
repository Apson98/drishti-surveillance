import { useEffect, useState } from 'react'
import { company, nav } from '../content'
import { IconMenu } from './Icons'
import logo from '../assets/drishti-logo.png'

export default function Nav() {
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // highlight the section currently in view
  useEffect(() => {
    const ids = nav.map((n) => n.href.slice(1))
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <>
      <header className={`nav ${solid || open ? 'is-solid' : ''}`}>
        <div className="wrap nav__inner">
          <a href="#top" className="nav__brand" aria-label={`${company.name} home`}>
            <img src={logo} alt="Drishti Surveillance" width={100} height={62} />
          </a>
          <nav aria-label="Main">
            <ul className="nav__links">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className={active === n.href.slice(1) ? 'is-active' : ''}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <a href="#book" className="btn btn--primary nav__cta">
            Book appointment
          </a>
          <button className="nav__menu" aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>
            <IconMenu open={open} />
          </button>
        </div>
      </header>
      {open && (
        <div className="drawer" role="dialog" aria-label="Menu">
          {nav.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <a href="#book" className="btn btn--primary" onClick={() => setOpen(false)}>
            Book appointment
          </a>
        </div>
      )}
    </>
  )
}

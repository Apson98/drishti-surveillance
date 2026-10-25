import { Suspense, useEffect, useRef, useState } from 'react'
import HeroScene from '../scenes/HeroScene'
import { hero } from '../content'
import { useInView } from '../hooks/useInView'
import { usePointer } from '../hooks/usePointer'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { IconArrow } from './Icons'

/** Live timestamp in Nepal time, like a recorder's on-screen display. */
function useNptClock() {
  const fmt = () => {
    const d = new Date(Date.now() + (5 * 60 + 45) * 60_000)
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }
  const [now, setNow] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setNow(fmt()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Hero() {
  const { ref, inView } = useInView<HTMLElement>('0px')
  const pointer = usePointer()
  const scroll = useRef(0)
  const compact = useMediaQuery('(max-width: 760px)')
  const reduced = useReducedMotion()
  const now = useNptClock()

  useEffect(() => {
    const onScroll = () => {
      const h = ref.current?.offsetHeight || 1
      scroll.current = Math.min(1, Math.max(0, window.scrollY / h))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ref])

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero__canvas" aria-hidden="true">
        <Suspense fallback={null}>
          <HeroScene pointer={pointer} scroll={scroll} active={inView} compact={compact} reduced={reduced} />
        </Suspense>
      </div>

      <div className="osd" aria-hidden="true">
        <span className="osd__corner osd__corner--tl" />
        <span className="osd__corner osd__corner--tr" />
        <span className="osd__corner osd__corner--bl" />
        <span className="osd__corner osd__corner--br" />
        <div className="osd__tl">
          <span>CAM 01</span>
          <span>Drishti HQ · Main gate</span>
        </div>
        <div className="osd__tr">
          <span className="rec">REC</span>
          <span>{now} NPT</span>
        </div>
        <div className="osd__bl">
          <span>4 MP</span>
          <span>25 FPS</span>
          <span>H.265+</span>
        </div>
        <div className="osd__br">
          <span>IR auto</span>
        </div>
      </div>

      <div className="wrap">
        <div className="hero__content">
          <span className="eyebrow">{hero.eyebrow}</span>
          <h1>
            {hero.title.map((l) => (
              <span className="line" key={l}>
                {l}
              </span>
            ))}
          </h1>
          <p className="hero__body">{hero.body}</p>
          <div className="hero__ctas">
            <a href={hero.primary.href} className="btn btn--primary">
              {hero.primary.label} <IconArrow />
            </a>
            <a href={hero.secondary.href} className="btn btn--ghost">
              {hero.secondary.label}
            </a>
          </div>
        </div>
      </div>
      <span className="scroll-cue" aria-hidden="true" />
    </section>
  )
}

import type { PointerEvent } from 'react'
import { solutions } from '../content'
import { solutionIcons } from './Icons'

export default function Solutions() {
  const spot = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <section className="section" id="solutions">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow">What we do</span>
          <h2>One team for cameras, cabling and the network behind them.</h2>
          <p>From a single Wi-Fi camera at home to a campus with a control room, we handle the hardware, the installation and the support after.</p>
        </div>
        <div className="solutions__grid reveal">
          {solutions.map((s, i) => {
            const Icon = solutionIcons[s.id]
            return (
              <article className="sol" key={s.id} onPointerMove={spot}>
                <Icon className="sol__icon" />
                <span className="sol__id">{String(i + 1).padStart(2, '0')}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <ul>
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

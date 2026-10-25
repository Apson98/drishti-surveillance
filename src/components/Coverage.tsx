import { Suspense, useCallback, useRef, useState } from 'react'
import CoverageScene, { type CoverageStats } from '../scenes/CoverageScene'
import { cams } from '../scenes/coverage'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

const allOn = Object.fromEntries(cams.map((c) => [c.id, true])) as Record<string, boolean>

export default function Coverage() {
  const { ref, inView } = useInView<HTMLDivElement>()
  const reduced = useReducedMotion()
  const [enabled, setEnabled] = useState(allOn)
  const [showCones, setShowCones] = useState(true)
  const [showCables, setShowCables] = useState(false)
  const [night, setNight] = useState(false)
  const [stats, setStats] = useState<CoverageStats>({ percent: 0, blindM2: 0, active: cams.length, tracked: null })
  const lastKey = useRef('')

  // the scene reports five times a second; only re-render when the readout changes
  const onStats = useCallback((s: CoverageStats) => {
    const key = `${Math.round(s.percent)}|${Math.round(s.blindM2)}|${s.active}|${s.tracked}`
    if (key !== lastKey.current) {
      lastKey.current = key
      setStats(s)
    }
  }, [])
  const toggleCam = useCallback((id: string) => setEnabled((e) => ({ ...e, [id]: !e[id] })), [])

  const pct = Math.round(stats.percent)

  return (
    <section className="section coverage" id="coverage">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow">How we plan</span>
          <h2>See the site the way we plan it.</h2>
          <p>
            Before any drilling, we map each camera's field of view, the blind spots between them and the cable route back to the recorder.
            Switch cameras off below and watch the gaps open up.
          </p>
        </div>

        <div className="coverage__layout">
          <div ref={ref} className={`coverage__stage ${night ? 'is-night' : ''}`}>
            <div className="coverage__hud" aria-hidden="true">
              <span>Site plan · sample compound</span>
              <span>{night ? 'IR night view' : 'Day view'}</span>
            </div>
            <Suspense fallback={null}>
              <CoverageScene
                enabled={enabled}
                showCones={showCones}
                showCables={showCables}
                night={night}
                active={inView}
                reduced={reduced}
                onToggleCam={toggleCam}
                onStats={onStats}
              />
            </Suspense>
            <span className="coverage__hint">Drag to orbit · tap a camera to switch it off</span>
          </div>

          <aside className="coverage__panel" aria-label="Coverage controls">
            <div className="readout" aria-live="polite">
              <span className="panel-label">Ground coverage</span>
              <div className="readout__big">
                <span className="readout__num">{pct}</span>
                <span className="readout__unit">% of open ground</span>
              </div>
              <div className="readout__bar" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </div>
              <dl className="readout__rows">
                <div>
                  <dt>Cameras live</dt>
                  <dd>
                    {stats.active} / {cams.length}
                  </dd>
                </div>
                <div>
                  <dt>Blind spots</dt>
                  <dd className={stats.blindM2 > 80 ? 'warn' : ''}>{Math.round(stats.blindM2)} m²</dd>
                </div>
                <div>
                  <dt>Person on site</dt>
                  <dd className={stats.tracked ? 'ok' : 'warn'}>{stats.tracked ? `Seen by ${stats.tracked.split(' · ')[0]}` : 'Not seen'}</dd>
                </div>
              </dl>
              <div className="legend">
                <span><i style={{ background: 'var(--accent)' }} />Watched</span>
                <span><i style={{ background: 'var(--signal)' }} />Blind spot</span>
              </div>
            </div>

            <span className="panel-label">Layers</span>
            <div className="toggles">
              <button className="chip" aria-pressed={showCones} onClick={() => setShowCones(!showCones)}>
                <span className="dot" />Fields of view
              </button>
              <button className="chip" aria-pressed={showCables} onClick={() => setShowCables(!showCables)}>
                <span className="dot" />Cable routes
              </button>
              <button className="chip" aria-pressed={night} onClick={() => setNight(!night)}>
                <span className="dot" />Night (IR)
              </button>
            </div>

            <span className="panel-label">Cameras</span>
            <div className="camlist">
              {cams.map((c) => (
                <button key={c.id} className="chip" aria-pressed={enabled[c.id]} onClick={() => toggleCam(c.id)} title={c.label}>
                  <span className="dot" />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

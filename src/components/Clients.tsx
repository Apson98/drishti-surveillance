import { useCatalog } from '../store/catalog'
import { imageUrl } from '../data/source'
import type { Client } from '../data/types'
import { IconQuote } from './Icons'

function ClientCard({ c, hidden = false }: { c: Client; hidden?: boolean }) {
  return (
    <li className="tcard" aria-hidden={hidden || undefined}>
      <div className="tcard__top">
        <span className="tcard__logo">{c.logo ? <img src={imageUrl(c.logo)} alt={hidden ? '' : c.name} loading="lazy" /> : <b>{c.name}</b>}</span>
        <span className="tcard__client">{c.name}</span>
      </div>
      {c.review ? (
        <>
          <span className="tcard__mark">
            <IconQuote />
          </span>
          <blockquote>{c.review}</blockquote>
          {(c.reviewer || c.role) && (
            <p className="tcard__by">
              {c.reviewer && <b>{c.reviewer}</b>}
              {c.role && <span>{c.role}</span>}
            </p>
          )}
        </>
      ) : (
        <p className="tcard__empty">Security systems by Drishti Surveillance</p>
      )}
    </li>
  )
}

export default function Clients() {
  const { clients } = useCatalog()
  if (clients.length === 0) return null
  // the list is drawn twice so the strip can loop without a gap
  const duration = Math.max(30, clients.length * 7)
  return (
    <section className="clients" id="clients" aria-labelledby="clients-title">
      <div className="wrap">
        <div className="clients__head">
          <div>
            <span className="eyebrow">Our clients</span>
            <h2 id="clients-title">What our clients say</h2>
          </div>
          <p>{clients.length} businesses rely on Drishti for their cameras, network and support.</p>
        </div>
      </div>
      <div className="marquee" style={{ ['--dur' as string]: `${duration}s` }}>
        <ul className="marquee__track">
          {clients.map((c) => (
            <ClientCard key={c.id} c={c} />
          ))}
          {clients.map((c) => (
            <ClientCard key={c.id + '-copy'} c={c} hidden />
          ))}
        </ul>
      </div>
    </section>
  )
}

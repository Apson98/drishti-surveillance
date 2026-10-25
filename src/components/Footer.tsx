import { company, nav, solutions } from '../content'
import logo from '../assets/drishti-logo.png'
import hik from '../assets/hikvision.png'
import ezviz from '../assets/ezviz.png'
import { IconFacebook, IconInstagram, IconWhatsApp } from './Icons'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__top">
          <div className="footer__brand">
            <img src={logo} alt="Drishti Surveillance" width={163} height={96} />
            <p>CCTV, networking and security systems for homes and businesses across Nepal.</p>
            <div className="footer__partners">
              <img src={hik} alt="Hikvision" width={135} height={18} />
              <img src={ezviz} alt="EZVIZ" className="ezviz" width={35} height={30} />
            </div>
          </div>
          <div>
            <h4>Solutions</h4>
            <ul>
              {solutions.map((s) => (
                <li key={s.id}><a href="#solutions">{s.title}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              {nav.map((n) => (
                <li key={n.href}><a href={n.href}>{n.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Reach us</h4>
            <ul>
              <li>
                Call or WhatsApp <b className="sel">{company.phone}</b>
              </li>
              <li className="sel">{company.email}</li>
              <li>{company.address}</li>
              <li className="socials">
                <a href={company.social.facebook} target="_blank" rel="noreferrer" aria-label="Drishti Surveillance on Facebook">
                  <IconFacebook /> Facebook
                </a>
                <a href={company.social.instagram} target="_blank" rel="noreferrer" aria-label="Drishti Surveillance on Instagram">
                  <IconInstagram /> Instagram
                </a>
                <a href={`https://wa.me/${company.whatsapp}`} target="_blank" rel="noreferrer" aria-label="Chat with Drishti Surveillance on WhatsApp">
                  <IconWhatsApp /> WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {company.name}. All rights reserved.</span>
          <span>Hikvision and EZVIZ are trademarks of their respective owners. · <a href="#admin">Admin Panel</a></span>
        </div>
      </div>
    </footer>
  )
}

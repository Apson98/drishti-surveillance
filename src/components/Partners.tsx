import hik from '../assets/hikvision.png'
import ezviz from '../assets/ezviz.png'

export default function Partners() {
  return (
    <section className="partners" aria-label="Brand partners">
      <div className="wrap partners__inner">
        <span className="partners__label">Brand partners</span>
        <div className="partners__logos">
          <img src={hik} alt="Hikvision" width={195} height={26} />
          <img src={ezviz} alt="EZVIZ" className="ezviz" width={47} height={40} />
        </div>
        <p className="partners__note">We supply, install and configure Hikvision and EZVIZ cameras, recorders and network gear.</p>
      </div>
    </section>
  )
}

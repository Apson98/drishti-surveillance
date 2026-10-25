import { process } from '../content'

export default function Process() {
  return (
    <section className="section process" id="process">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow">From survey to support</span>
          <h2>Four steps, one point of contact.</h2>
        </div>
        <ol className="steps">
          {process.map((s, i) => (
            <li className="step reveal" key={s.title}>
              <span className="step__n">Step {i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

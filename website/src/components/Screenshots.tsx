import { useReveal } from '../hooks/useReveal'
import './Screenshots.css'

const BASE = import.meta.env.BASE_URL

interface Shot {
  file: string
  alt: string
  caption: string
  desc: string
}

const SHOTS: Shot[] = [
  {
    file: 'connect.png',
    alt: 'QR code pairing screen — scan to connect Yawab to WhatsApp',
    caption: 'Connect',
    desc: 'Scan once with your phone. Session stored locally, reconnects automatically.'
  },
  {
    file: 'contacts.png',
    alt: 'Contact list after CSV import with validation summary',
    caption: 'Import',
    desc: 'Drop in a CSV — columns detected, numbers normalised, duplicates removed.'
  },
  {
    file: 'compose.png',
    alt: 'Message template editor with live per-contact preview',
    caption: 'Compose',
    desc: 'Write once with {{name}} and any column — preview shows the exact message per contact.'
  },
  {
    file: 'sending.png',
    alt: 'Sending progress screen with real-time delivery status',
    caption: 'Send',
    desc: 'Watch messages go out in real time. Pause or cancel at any moment.'
  }
]

export default function Screenshots() {
  const sectionRef = useReveal<HTMLElement>()

  return (
    <section
      id="screenshots"
      ref={sectionRef}
      aria-label="Screenshots"
      className="screenshots"
    >
      <div className="screenshots-header">
        <p className="section-label">See it in action</p>
        <h2 className="screenshots-heading">Designed for how you actually work.</h2>
      </div>

      <ul className="screenshots-track">
        {SHOTS.map((shot, i) => (
          <li
            key={shot.file}
            className="shot-item reveal"
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <div className="shot-frame">
              <div className="shot-titlebar" aria-hidden="true">
                <span className="traffic-red" />
                <span className="traffic-yellow" />
                <span className="traffic-green" />
                <span className="shot-title-label">{shot.caption} — Yawab</span>
              </div>
              <img
                src={`${BASE}screenshots/${shot.file}`}
                alt={shot.alt}
                loading="lazy"
                className="shot-img"
                width="800"
                height="500"
              />
            </div>
            <p className="shot-caption">{shot.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

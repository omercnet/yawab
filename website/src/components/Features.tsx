import { useReveal } from '../hooks/useReveal'
import './Features.css'

interface Feature {
  num: string
  category: string
  title: string
  tagline: string
  desc: string
  points: string[]
}

const FEATURES: Feature[] = [
  {
    num: '01',
    category: 'Connect',
    title: 'QR Pairing',
    tagline: 'No bots. No APIs. Just WhatsApp.',
    desc: "Link like WhatsApp Web — scan once and you're in. Your session is stored locally and reconnects automatically across restarts.",
    points: [
      'Standard WhatsApp Web protocol',
      'Session persists across restarts',
      'Data never leaves your device'
    ]
  },
  {
    num: '02',
    category: 'Import',
    title: 'CSV Import',
    tagline: 'Your spreadsheet, natively.',
    desc: 'Drop in any CSV or Excel export. Yawab auto-detects phone and name columns, normalises to E.164, de-duplicates, and reports every skipped row.',
    points: [
      'Auto-detects phone & name columns',
      'Normalises numbers to E.164',
      'De-duplicates, reports skipped rows'
    ]
  },
  {
    num: '03',
    category: 'Compose',
    title: 'Templated Messages',
    tagline: 'Hello {{name}}.',
    desc: 'Personalise with any column from your CSV — name, phone, or any custom field. Live preview updates per contact as you type.',
    points: [
      'Any CSV column as a variable',
      'Live message preview per contact',
      'Handles missing values gracefully'
    ]
  },
  {
    num: '04',
    category: 'Send',
    title: 'Safe Pacing',
    tagline: 'No bans. No rush.',
    desc: 'Randomised delays between messages keep your account safe. Live progress bar, pause and cancel at any time — you stay in control.',
    points: [
      'Configurable delay range',
      'Live send progress indicator',
      'Pause or cancel mid-run'
    ]
  },
  {
    num: '05',
    category: 'Platform',
    title: 'Cross-Platform',
    tagline: 'macOS. Windows. Linux.',
    desc: "Native installers for every major platform. Feels at home whether you're on Apple Silicon, Intel, Windows, or Linux.",
    points: [
      'macOS (Apple Silicon + Intel)',
      'Windows x64 + ARM64',
      'Linux AppImage + .deb'
    ]
  },
  {
    num: '06',
    category: 'Internationalisation',
    title: 'Localised & Accessible',
    tagline: 'The whole world.',
    desc: 'Ships in English, Hebrew, Russian, Arabic, and Spanish with full RTL layout support. Semantic HTML, keyboard-navigable, screen-reader-friendly.',
    points: [
      'Full RTL for Arabic & Hebrew',
      'Keyboard-friendly navigation',
      'AA contrast throughout'
    ]
  }
]

export default function Features() {
  const sectionRef = useReveal<HTMLElement>()

  return (
    <section id="features" ref={sectionRef} aria-label="Features" className="features">
      <div className="features-header">
        <p className="section-label">Capabilities</p>
        <h2 className="features-heading">
          Everything you need.
          <br />
          Nothing you don&apos;t.
        </h2>
      </div>

      <div className="features-list">
        {FEATURES.map((feat, i) => (
          <div
            key={feat.num}
            className="feature-row reveal"
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <div className="feature-row-meta">
              <span className="feature-num">{feat.num}</span>
              <span className="feature-cat">{feat.category}</span>
            </div>
            <div className="feature-row-body">
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-tagline">{feat.tagline}</p>
              <p className="feature-desc">{feat.desc}</p>
              <ul className="feature-points">
                {feat.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

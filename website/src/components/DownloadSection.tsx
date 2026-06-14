import { useReveal } from '../hooks/useReveal'
import './DownloadSection.css'

type DownloadSlot =
  | 'mac-arm64'
  | 'mac-x64'
  | 'win-x64'
  | 'win-arm64'
  | 'linux-appimage'
  | 'linux-deb'

interface SlotDef {
  slot: DownloadSlot
  sub: string
  ext: string
}

interface PlatformGroup {
  name: string
  slots: SlotDef[]
}

interface DownloadSectionProps {
  version?: string | null
  links?: Partial<Record<DownloadSlot, string>>
  primaryHref?: string
  primaryLabel?: string
}

const PLACEHOLDER = 'https://github.com/omercnet/yawab/releases/latest'

const PLATFORM_GROUPS: PlatformGroup[] = [
  {
    name: 'macOS',
    slots: [
      { slot: 'mac-arm64', sub: 'Apple Silicon', ext: '.dmg' },
      { slot: 'mac-x64', sub: 'Intel', ext: '.dmg' }
    ]
  },
  {
    name: 'Windows',
    slots: [
      { slot: 'win-x64', sub: 'x64', ext: '.exe' },
      { slot: 'win-arm64', sub: 'ARM64', ext: '.exe' }
    ]
  },
  {
    name: 'Linux',
    slots: [
      { slot: 'linux-appimage', sub: 'AppImage', ext: '.AppImage' },
      { slot: 'linux-deb', sub: 'Debian / Ubuntu', ext: '.deb' }
    ]
  }
]

export default function DownloadSection({
  version,
  links,
  primaryHref,
  primaryLabel = 'Download free'
}: DownloadSectionProps) {
  const sectionRef = useReveal<HTMLElement>()

  const href = (slot: DownloadSlot) => links?.[slot] ?? PLACEHOLDER
  const mainHref = primaryHref ?? PLACEHOLDER

  return (
    <section id="download" ref={sectionRef} aria-label="Download" className="download">
      <div className="download-inner reveal">
        {/* Hero block */}
        <div className="download-hero">
          <p className="section-label">Get Yawab</p>
          <h2 className="download-heading">Download Yawab.</h2>
          {version != null && <p className="download-version">{version}</p>}
          <a
            className="download-cta"
            href={mainHref}
            data-slot="primary"
            target="_blank"
            rel="noreferrer"
            aria-label={`${primaryLabel} — latest release`}
          >
            ↓ {primaryLabel}
          </a>
          <p className="download-tagline">
            Always the latest release — updated automatically.
          </p>
        </div>

        {/* Platform grid */}
        <div className="download-platforms">
          <p className="download-platforms-label">All platforms</p>
          <div className="download-grid">
            {PLATFORM_GROUPS.map((group) => (
              <div key={group.name} className="download-group">
                <p className="download-group-name">{group.name}</p>
                <div className="download-group-slots">
                  {group.slots.map((def) => (
                    <a
                      key={def.slot}
                      className="dl-slot"
                      href={href(def.slot)}
                      data-slot={def.slot}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Download for ${group.name} ${def.sub} (${def.ext})`}
                    >
                      <span className="dl-slot-info">
                        <span className="dl-slot-label">{def.sub}</span>
                        <span className="dl-slot-ext">{def.ext}</span>
                      </span>
                      <span className="dl-slot-arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

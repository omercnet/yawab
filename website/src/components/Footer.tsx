import './Footer.css'

const GH_URL = 'https://github.com/omercnet/yawab'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-wordmark">Yawab</span>
          <span className="footer-tagline">Free &amp; Open Source</span>
        </div>

        <nav className="footer-links" aria-label="Footer links">
          <a href={GH_URL} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <span className="footer-sep" aria-hidden="true">
            ·
          </span>
          <span>MIT License</span>
        </nav>

        <p className="footer-disclaimer">
          Not affiliated with or endorsed by WhatsApp LLC or Meta Platforms, Inc. Yawab is
          independent open-source software.
        </p>
      </div>
    </footer>
  )
}

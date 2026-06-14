import DownloadSection from './components/DownloadSection'
import Features from './components/Features'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Nav from './components/Nav'
import Screenshots from './components/Screenshots'
import { useDownloads } from './hooks/useDownloads'
import './styles/global.css'

export default function App() {
  const downloads = useDownloads()

  return (
    <>
      <div className="scroll-progress" aria-hidden="true" />
      <Nav />
      <main id="main-content">
        <Hero primaryHref={downloads.primaryHref} primaryLabel={downloads.primaryLabel} />
        <Features />
        <Screenshots />
        <DownloadSection
          version={downloads.version}
          links={downloads.links}
          primaryHref={downloads.primaryHref}
          primaryLabel={downloads.primaryLabel}
        />
      </main>
      <Footer />
    </>
  )
}

import { useLocale } from './i18n'
import { Navbar } from './components/Navbar'
import { LaunchProgress } from './components/LaunchProgress'
import { FeatureCarousel } from './components/FeatureCarousel'
import { Footer } from './components/Footer'
import { Icon } from './components/Icon'
import { Sigil } from './components/Sigil'

export default function App() {
  const { copy } = useLocale()
  return (
    <>
      <Navbar />
      <main id="main">
        <section id="home" className="hero-section page-shell" aria-labelledby="home-title">
          <div className="hero-layout grid items-center gap-12 lg:grid-cols-[1.7fr_1fr]">
            <div className="hero-copy relative z-10">
              <p className="eyebrow mb-7 flex items-center gap-3"><span className="tiny-diamond" aria-hidden="true" />{copy.hero.eyebrow}</p>
              <h1 id="home-title" className="hero-title gold-text">{copy.hero.title}</h1>
              <p className="hero-description mt-8 max-w-xl">{copy.hero.description}</p>
              <a href="#features" className="explore-link mt-9 inline-flex items-center gap-4">{copy.hero.explore}<Icon name="arrow" className="size-5" /></a>
            </div>
            <div className="hero-art"><Sigil /></div>
          </div>
          <div className="hero-bottom flex items-end justify-between gap-8">
            <LaunchProgress />
            <a href="#features" className="scroll-cue hidden sm:flex" aria-label={copy.hero.explore}><Icon name="down" className="size-5" /></a>
          </div>
        </section>

        <section id="features" className="content-section page-shell" aria-labelledby="features-title">
          <p className="eyebrow mb-5">{copy.features.eyebrow}</p>
          <h2 id="features-title" className="section-title gold-text">{copy.features.title}</h2>
          <p className="section-subtitle mt-4">{copy.features.subtitle}</p>
          <div className="mt-12 md:mt-16"><FeatureCarousel /></div>
        </section>

        <section id="world" className="empty-section page-shell" aria-labelledby="world-title">
          <p className="eyebrow mb-5">{copy.world.eyebrow}</p>
          <h2 id="world-title" className="section-title gold-text">{copy.world.title}</h2>
        </section>

        <section id="faq" className="empty-section faq-section page-shell" aria-labelledby="faq-title">
          <p className="eyebrow mb-5">{copy.faq.eyebrow}</p>
          <h2 id="faq-title" className="section-title gold-text">{copy.faq.title}</h2>
        </section>
      </main>
      <Footer />
    </>
  )
}

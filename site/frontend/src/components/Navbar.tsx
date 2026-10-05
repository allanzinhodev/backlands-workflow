import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../i18n'
import { Icon } from './Icon'

const sections = ['home', 'features', 'world', 'faq'] as const

export function Navbar() {
  const { locale, setLocale, copy } = useLocale()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string>('home')
  const [scrolled, setScrolled] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const threshold = window.scrollY + Math.min(window.innerHeight * 0.3, 240)
        const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
        const current = atBottom ? sections.at(-1) : sections.filter(id => (document.getElementById(id)?.offsetTop ?? Infinity) <= threshold).at(-1)
        setActive(current ?? 'home')
        setScrolled(window.scrollY > 30)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <header className={`site-header ${scrolled || open ? 'header-scrolled' : ''}`}>
      <a href="#main" className="skip-link">{copy.nav.skip}</a>
      <nav className="page-shell relative flex min-h-22 items-center justify-between gap-3" aria-label={copy.nav.navigation}
        onKeyDown={event => {
          if (event.key === 'Escape' && open) { setOpen(false); menuButton.current?.focus() }
        }}>
        <a className="brand gold-text shrink-0" href="#home" onClick={() => setOpen(false)}>{copy.brand}</a>
        <ul id="primary-menu" className={`nav-links ${open ? 'nav-open' : ''}`}>
          {sections.map(id => (
            <li key={id}>
              <a className={`nav-link ${active === id ? 'nav-active' : ''}`} href={`#${id}`}
                aria-current={active === id ? 'location' : undefined}
                onClick={() => { setActive(id); setOpen(false) }}>{copy.nav[id]}</a>
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="language-switch flex" role="group" aria-label={copy.language.label}>
            {(['pt', 'en'] as const).map(language => (
              <button key={language} type="button" className={`language-button ${locale === language ? 'language-active' : ''}`}
                lang={language} aria-label={copy.language[language]} aria-pressed={locale === language}
                onClick={() => setLocale(language)}>{language.toUpperCase()}</button>
            ))}
          </div>
          <button ref={menuButton} type="button" className="icon-button menu-toggle lg:hidden" aria-label={open ? copy.nav.closeMenu : copy.nav.menu}
            aria-expanded={open} aria-controls="primary-menu" onClick={() => setOpen(!open)}>
            <Icon name={open ? 'close' : 'menu'} className="size-5" />
          </button>
        </div>
      </nav>
    </header>
  )
}

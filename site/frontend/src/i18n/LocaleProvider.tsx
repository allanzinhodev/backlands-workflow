import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { catalog, type Copy, type Locale } from './catalog'
import { configuredLocale, resolveAutomaticLocale, storedLocale, storeLocale } from './locale'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  copy: Copy
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const defaultLocale = configuredLocale(import.meta.env.VITE_DEFAULT_LANGUAGE)
  const [initialChoice] = useState(storedLocale)
  const [locale, updateLocale] = useState<Locale>(initialChoice ?? defaultLocale)
  const manuallySelected = useRef(Boolean(initialChoice))

  const setLocale = useCallback((nextLocale: Locale) => {
    manuallySelected.current = true
    updateLocale(nextLocale)
    storeLocale(nextLocale)
  }, [])

  useEffect(() => {
    if (manuallySelected.current) return
    const controller = new AbortController()
    let mounted = true

    void resolveAutomaticLocale({
      defaultLocale,
      browserLanguages: navigator.languages?.length ? navigator.languages : [navigator.language],
      geoIpUrl: import.meta.env.VITE_GEOIP_URL,
      signal: controller.signal,
    }).then((detectedLocale) => {
      if (mounted && !manuallySelected.current) updateLocale(detectedLocale)
    })

    return () => {
      mounted = false
      controller.abort()
    }
  }, [defaultLocale])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = catalog[locale].metadata.title
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.name = 'description'
      document.head.append(description)
    }
    description.content = catalog[locale].metadata.description
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, copy: catalog[locale] }), [locale, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be called inside LocaleProvider')
  return context
}

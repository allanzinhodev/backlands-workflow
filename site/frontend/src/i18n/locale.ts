import type { Locale } from './catalog'

export const LOCALE_STORAGE_KEY = 'backlands.locale'
export const DEFAULT_GEOIP_URL = 'https://ipapi.co/json/'

export function supportedLocale(value: unknown): Locale | undefined {
  if (typeof value !== 'string') return undefined
  const language = value.trim().toLowerCase().split(/[-_]/)[0]
  return language === 'pt' || language === 'en' ? language : undefined
}

export function configuredLocale(value: unknown): Locale {
  return supportedLocale(value) ?? 'pt'
}

export function browserLocale(languages: readonly string[], fallback: Locale): Locale {
  for (const language of languages) {
    const locale = supportedLocale(language)
    if (locale) return locale
  }
  return fallback
}

export function storedLocale(): Locale | undefined {
  try {
    const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    // Persisted values represent an explicit choice, not a region estimate.
    return locale === 'pt' || locale === 'en' ? locale : undefined
  } catch {
    return undefined
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // The selector remains usable when the browser denies persistent storage.
  }
}

export function localeFromLocation(location: unknown): Locale | undefined {
  if (!location || typeof location !== 'object') return undefined
  const data = location as Record<string, unknown>
  if (data.error) return undefined

  // A location is an approximate language hint. Prefer the primary language
  // over other official languages listed for the country.
  if (typeof data.languages === 'string') {
    const primary = supportedLocale(data.languages.split(',')[0])
    if (primary) return primary
  }

  const country = typeof data.country_code === 'string' ? data.country_code : data.country
  if (typeof country !== 'string') return undefined
  const code = country.toUpperCase()
  if (['BR', 'PT', 'AO', 'MZ', 'CV', 'GW', 'ST', 'TL'].includes(code)) return 'pt'
  if (['US', 'GB', 'AU', 'NZ', 'IE', 'CA'].includes(code)) return 'en'
  return undefined
}

interface AutomaticLocaleOptions {
  defaultLocale: Locale
  browserLanguages: readonly string[]
  geoIpUrl?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
  signal?: AbortSignal
}

export async function resolveAutomaticLocale({
  defaultLocale,
  browserLanguages,
  geoIpUrl = DEFAULT_GEOIP_URL,
  timeoutMs = 2000,
  fetchImpl = fetch,
  signal,
}: AutomaticLocaleOptions): Promise<Locale> {
  const fallback = browserLocale(browserLanguages, defaultLocale)
  if (!geoIpUrl.trim() || signal?.aborted) return fallback

  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })

  let rejectOnAbort: (() => void) | undefined
  const aborted = new Promise<never>((_, reject) => {
    rejectOnAbort = () => reject(new DOMException('Request aborted', 'AbortError'))
    controller.signal.addEventListener('abort', rejectOnAbort, { once: true })
  })
  const timeout = setTimeout(abort, timeoutMs)

  try {
    const location = await Promise.race([
      fetchImpl(geoIpUrl, { signal: controller.signal, credentials: 'omit' }).then(async (response) => {
        if (!response.ok) throw new Error('Location service unavailable')
        return response.json() as Promise<unknown>
      }),
      aborted,
    ])
    return localeFromLocation(location) ?? fallback
  } catch {
    return fallback
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
    if (rejectOnAbort) controller.signal.removeEventListener('abort', rejectOnAbort)
  }
}

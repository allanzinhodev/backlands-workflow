import { afterEach, describe, expect, it, vi } from 'vitest'
import { browserLocale, configuredLocale, localeFromLocation, resolveAutomaticLocale } from './locale'

afterEach(() => vi.useRealTimers())

describe('language hints', () => {
  it('uses the primary IP language before a country hint', () => {
    expect(localeFromLocation({ languages: 'pt-BR,en', country_code: 'US' })).toBe('pt')
    expect(localeFromLocation({ languages: 'en-US,es-US', country: 'BR' })).toBe('en')
    expect(localeFromLocation({ country_code: 'PT' })).toBe('pt')
    expect(localeFromLocation({ country: 'GB' })).toBe('en')
  })

  it('does not guess from unsupported or malformed location data', () => {
    expect(localeFromLocation({ languages: 'es,en', country_code: 'ES' })).toBeUndefined()
    expect(localeFromLocation({ error: true, country: 'BR' })).toBeUndefined()
    expect(localeFromLocation(null)).toBeUndefined()
    expect(localeFromLocation('pt')).toBeUndefined()
  })

  it('uses a supported browser language and then the configured fallback', () => {
    expect(browserLocale(['fr-FR', 'en-US'], 'pt')).toBe('en')
    expect(browserLocale(['pt-BR', 'en-US'], 'en')).toBe('pt')
    expect(browserLocale(['fr-FR'], 'en')).toBe('en')
    expect(configuredLocale('en-GB')).toBe('en')
    expect(configuredLocale('unknown')).toBe('pt')
  })
})

describe('automatic detection', () => {
  it('uses IP inference even when the browser language differs', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ country_code: 'BR', languages: 'pt-BR' })),
    )
    const result = await resolveAutomaticLocale({
      defaultLocale: 'en', browserLanguages: ['en-US'], fetchImpl,
    })
    expect(result).toBe('pt')
    expect(fetchImpl).toHaveBeenCalledWith('https://ipapi.co/json/', {
      signal: expect.any(AbortSignal), credentials: 'omit',
    })
  })

  it('falls back safely on HTTP, network, and unsupported-region failures', async () => {
    const options = { defaultLocale: 'pt' as const, browserLanguages: ['en-US'] }
    const cases = [
      vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 429 })),
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Offline')),
      vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ country_code: 'JP' }))),
    ]
    for (const fetchImpl of cases) {
      expect(await resolveAutomaticLocale({ ...options, fetchImpl })).toBe('en')
    }
  })

  it('falls back and aborts even if a location request never settles', async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() => new Promise(() => {}))
    const result = resolveAutomaticLocale({
      defaultLocale: 'en', browserLanguages: ['pt-BR'], fetchImpl,
    })
    await vi.advanceTimersByTimeAsync(2000)
    expect(await result).toBe('pt')
    const signal = fetchImpl.mock.calls[0][1]?.signal
    expect(signal?.aborted).toBe(true)
  })

  it('allows configuration to disable the IP lookup', async () => {
    const fetchImpl = vi.fn<typeof fetch>()
    expect(await resolveAutomaticLocale({
      defaultLocale: 'pt', browserLanguages: ['fr'], geoIpUrl: '', fetchImpl,
    })).toBe('pt')
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

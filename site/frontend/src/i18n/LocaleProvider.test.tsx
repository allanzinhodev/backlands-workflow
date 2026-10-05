import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider, useLocale } from './LocaleProvider'
import { catalog } from './catalog'
import { LOCALE_STORAGE_KEY } from './locale'

function Probe() {
  const { locale, setLocale, copy } = useLocale()
  return <>
    <p data-testid="locale">{locale}</p>
    <p>{copy.footer.download}</p>
    <button onClick={() => setLocale('pt')}>PT</button>
    <button onClick={() => setLocale('en')}>EN</button>
  </>
}

beforeEach(() => {
  localStorage.clear()
  vi.stubEnv('VITE_DEFAULT_LANGUAGE', 'pt')
  vi.stubEnv('VITE_GEOIP_URL', 'https://ipapi.co/json/')
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('LocaleProvider', () => {
  it('restores explicit preference without sending a location request', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    render(<LocaleProvider><Probe /></LocaleProvider>)

    expect(screen.getByTestId('locale').textContent).toBe('en')
    expect(screen.getByText('Download game')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
    expect(document.title).toBe(catalog.en.metadata.title)
    expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content)
      .toBe(catalog.en.metadata.description)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not overwrite a manual choice when a slower IP response arrives', async () => {
    let finishRequest: (response: Response) => void = () => {}
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(() =>
      new Promise((resolve) => { finishRequest = resolve }),
    ))
    render(<LocaleProvider><Probe /></LocaleProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')

    await act(async () => {
      finishRequest(new Response(JSON.stringify({ country_code: 'BR', languages: 'pt-BR' })))
    })
    expect(screen.getByTestId('locale').textContent).toBe('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('keeps the selector working with denied storage and unavailable geolocation', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage denied', 'SecurityError')
    })
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Offline')))
    render(<LocaleProvider><Probe /></LocaleProvider>)

    await waitFor(() => expect(screen.getByTestId('locale').textContent).toBe('en'))
    fireEvent.click(screen.getByRole('button', { name: 'PT' }))
    expect(screen.getByTestId('locale').textContent).toBe('pt')
    expect(screen.getByText('Baixar jogo')).toBeTruthy()
    expect(document.documentElement.lang).toBe('pt')
  })
})

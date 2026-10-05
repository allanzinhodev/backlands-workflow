import { expect, test, type Page } from '@playwright/test'

const geoIp = 'https://ipapi.co/json/'
const errorsByPage = new WeakMap<Page, string[]>()

async function mockLocation(page: Page, language = 'pt-BR') {
  await page.route(geoIp, route => route.fulfill({
    json: { country_code: language.startsWith('pt') ? 'BR' : 'US', languages: language },
  }))
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  // Every browser check also rejects uncaught application exceptions.
  errorsByPage.set(page, errors)
})

test.afterEach(async ({ page }) => {
  if (!page.isClosed()) {
    expect(errorsByPage.get(page)).toEqual([])
  }
})

test('uses the IP language and translates the page, metadata, and controls', async ({ page }) => {
  await mockLocation(page, 'en-US')
  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'What do we have?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'English', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Next feature' })).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Discover Backlands Online/)
  await expect(page).toHaveTitle(/An RPG with Brazilian roots/)

  await page.getByRole('button', { name: 'Português', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt')
  await expect(page.getByRole('heading', { name: 'O que temos?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Próxima feature' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Baixar jogo' })).toBeDisabled()
  await expect(page).toHaveTitle(/RPG com raízes brasileiras/)
})

test('persists an explicit choice and skips geolocation on the next visit', async ({ page }) => {
  let requests = 0
  await page.route(geoIp, route => {
    requests += 1
    return route.fulfill({ json: { country_code: 'BR', languages: 'pt-BR' } })
  })
  await page.goto('/')
  await expect.poll(() => requests).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  const initialRequests = requests

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'What do we have?' })).toBeVisible()
  expect(requests).toBe(initialRequests)
})

test('a delayed IP response cannot replace a manual language selection', async ({ page }) => {
  let release = () => {}
  const released = new Promise<void>(resolve => { release = resolve })
  let requests = 0
  await page.route(geoIp, async route => {
    requests += 1
    await released
    await route.fulfill({ json: { country_code: 'BR', languages: 'pt-BR' } })
  })
  await page.goto('/')
  await expect.poll(() => requests).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'English', exact: true }).click()
  release()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'What do we have?' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('backlands.locale'))).toBe('en')
})

test('falls back to the browser language when the IP service is unavailable', async ({ page }) => {
  await page.route(geoIp, route => route.fulfill({ status: 429, body: '{}' }))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('heading', { name: 'What do we have?' })).toBeVisible()
})

test('carousel controls wrap in both directions and retain position when translating', async ({ page }) => {
  await mockLocation(page)
  await page.goto('/')
  const carousel = page.getByRole('region', { name: 'Destaques do jogo' })
  await expect(carousel.getByRole('heading', { name: 'RPG Oldschool' })).toBeVisible()
  await carousel.getByRole('button', { name: 'Feature anterior' }).click()
  await expect(carousel.getByRole('heading', { name: 'Cultura regional' })).toBeVisible()
  await expect(carousel.getByText('3 de 3', { exact: true })).toBeVisible()
  await carousel.getByRole('button', { name: 'Próxima feature' }).click()
  await expect(carousel.getByRole('heading', { name: 'RPG Oldschool' })).toBeVisible()
  await carousel.getByRole('button', { name: 'Próxima feature' }).click()
  await expect(carousel.getByRole('heading', { name: 'Folclore brasileiro' })).toBeVisible()
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await expect(page.getByRole('region', { name: 'Game highlights' }).getByRole('heading', { name: 'Brazilian folklore' })).toBeVisible()
  await expect(page.getByText('2 of 3', { exact: true })).toBeVisible()
})

test('reserves the requested empty sections and shows unavailable footer actions honestly', async ({ page }) => {
  await mockLocation(page)
  await page.goto('/')
  for (const id of ['world', 'faq']) {
    const section = page.locator(`#${id}`)
    await expect(section.locator('h2')).toHaveCount(1)
    await expect(section.locator('p:not(.eyebrow), article, button, a, details, img')).toHaveCount(0)
  }
  const footer = page.locator('footer')
  await expect(footer.getByRole('button', { name: 'Baixar jogo' })).toBeDisabled()
  await expect(footer.getByRole('button', { name: 'Cadastrar', exact: true })).toBeDisabled()
  await expect(footer.getByText('Em breve', { exact: true })).toHaveCount(2)
  await expect(page.getByText('Pré Launch', { exact: true })).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
})

for (const width of [320, 375, 768, 1440]) {
  test(`fits ${width}px and keeps language selection and navigation usable`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await mockLocation(page)
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Backlands Online!' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Português', exact: true })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'English', exact: true })).toBeInViewport()
    const dimensions = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }))
    expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
    await page.screenshot({ path: testInfo.outputPath(`hero-${width}.png`) })
    if (width === 1440 || width === 375) {
      await page.screenshot({ path: testInfo.outputPath(`landing-${width}.png`), fullPage: true })
    }

    if (width < 1024) {
      const toggle = page.getByRole('button', { name: 'Abrir menu', exact: true })
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.click()
      await expect(page.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press('Escape')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(toggle).toBeFocused()
      await toggle.click()
    } else {
      await expect(page.locator('.menu-toggle')).toBeHidden()
    }
    const nav = page.locator('nav')
    await nav.getByRole('link', { name: 'O QUE TEMOS', exact: true }).click()
    await expect(nav.locator('a[href="#features"]')).toHaveAttribute('aria-current', 'location')
    await expect(page).toHaveURL(/#features$/)
    if (width < 1024) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click()
    await nav.getByRole('link', { name: 'FAQ', exact: true }).click()
    await expect(nav.locator('a[href="#faq"]')).toHaveAttribute('aria-current', 'location')
    await expect(page).toHaveURL(/#faq$/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })
}

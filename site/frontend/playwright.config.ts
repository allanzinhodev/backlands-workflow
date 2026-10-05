import { defineConfig } from '@playwright/test'

const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? 'msedge'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    channel: browserChannel === 'chromium' ? undefined : browserChannel,
    locale: 'en-US',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    // Use the dev-server entry point without a shell-specific npm executable.
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: { VITE_DEFAULT_LANGUAGE: 'pt', VITE_GEOIP_URL: 'https://ipapi.co/json/', VITE_DOWNLOAD_URL: '', VITE_REGISTER_URL: '' },
  },
})

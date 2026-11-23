import { chromium } from 'playwright-core'

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/'
const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await context.newPage()
const session = await context.newCDPSession(page)
await session.send('Network.enable')
await session.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 100,
  downloadThroughput: (1.5 * 1024 * 1024) / 8,
  uploadThroughput: (1.5 * 1024 * 1024) / 8,
})

const audioRequests = []
page.on('request', (request) => {
  if (new URL(request.url()).pathname.endsWith('/audio/original-ambient-demo.mp3')) {
    audioRequests.push({ url: request.url(), at: Date.now() })
  }
})

try {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.locator('audio').waitFor({ state: 'attached' })
  await page.waitForTimeout(3600)

  const before = await page.locator('audio').evaluate((element) => ({
    paused: element.paused,
    preload: element.preload,
    readyState: element.readyState,
    bufferedSeconds: element.buffered.length ? element.buffered.end(0) : 0,
    src: new URL(element.currentSrc || element.src).pathname,
  }))
  if (!before.paused) throw new Error('Music played before the opening gesture')
  if (before.preload !== 'auto') throw new Error('Audio preload is not enabled')
  if (!before.src.endsWith('/audio/original-ambient-demo.mp3'))
    throw new Error(`Unexpected audio source: ${before.src}`)
  if (!audioRequests.length) throw new Error('Audio request did not begin before opening')
  if (before.bufferedSeconds < 1)
    throw new Error(`Audio did not prebuffer enough before opening: ${before.bufferedSeconds}s`)

  const clickedAt = Date.now()
  await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
  await page.waitForFunction(
    () => {
      const audio = document.querySelector('audio')
      return audio && !audio.paused && audio.currentTime > 0.05
    },
    null,
    { timeout: 3000 },
  )
  const audibleAt = Date.now()
  await page.locator('.intro').waitFor({ state: 'detached' })
  const delay = audibleAt - clickedAt
  const state = await page.locator('.music-control__label').textContent()
  if (state?.trim() !== 'Music on') throw new Error(`Unexpected player state: ${state}`)
  if (delay > 1000) throw new Error(`Music took ${delay}ms to start after opening`)
  console.log(
    `Audio requested before opening; ${before.bufferedSeconds.toFixed(1)}s buffered at 1.5 Mbps; playback began ${delay}ms after click.`,
  )
} finally {
  await browser.close()
}

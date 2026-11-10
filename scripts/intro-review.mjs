import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:5174/'
const folder = fileURLToPath(new URL('../screenshots/02c1/', import.meta.url))
mkdirSync(folder, { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const failures = []
const sizes = [
  [320, 700],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
]
const measurements = []

for (const [width, height] of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => failures.push(String(width) + 'px page error: ' + error.message))
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.querySelectorAll('.intro img')].map((image) => image.decode()))
  })
  const metrics = await page.locator('.intro').evaluate((intro) => {
    const names = intro.querySelector('.intro__names')
    const date = intro.querySelector('.intro__date-visible')
    const prompt = intro.querySelector('.intro__prompt')
    const flowers = intro.querySelector('.intro__florals--left')
    const button = intro.querySelector('.intro__open')
    const rects = [names, date, prompt, button].map((element) => element.getBoundingClientRect())
    return {
      width: innerWidth,
      height: innerHeight,
      introHeight: intro.getBoundingClientRect().height,
      scrollHeight: intro.scrollHeight,
      clientHeight: intro.clientHeight,
      scrollWidth: intro.scrollWidth,
      clientWidth: intro.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      background: getComputedStyle(intro).backgroundImage,
      nameFont: getComputedStyle(names).fontSize,
      nameColor: getComputedStyle(names).color,
      dateText: date.textContent.trim(),
      promptText: prompt.textContent.trim(),
      promptColor: getComputedStyle(prompt).color,
      namesOpacity: getComputedStyle(names).opacity,
      flowersOpacity: getComputedStyle(flowers).opacity,
      audioPaused: document.querySelector('audio').paused,
      controlCount: intro.querySelectorAll('button').length,
      clipped: rects.some((rect) => rect.left < -1 || rect.right > innerWidth + 1),
    }
  })
  measurements.push(metrics)
  await page.locator('.intro').screenshot({ path: join(folder, 'intro-' + width + '.png') })
  if (
    metrics.introHeight !== height ||
    metrics.scrollHeight > metrics.clientHeight + 1 ||
    metrics.scrollWidth > metrics.clientWidth + 1 ||
    metrics.documentWidth > width + 1 ||
    !metrics.background.includes('bloody-red.jpg') ||
    metrics.dateText !== '02 · 22 · 27' ||
    metrics.promptText !== 'Tap to open' ||
    metrics.namesOpacity !== '1' ||
    metrics.flowersOpacity !== '1' ||
    !metrics.audioPaused ||
    metrics.controlCount !== 1 ||
    metrics.clipped
  )
    failures.push(String(width) + 'px intro metrics: ' + JSON.stringify(metrics))
  console.log(JSON.stringify(metrics))
  await context.close()
}

const animationContext = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const animationPage = await animationContext.newPage()
animationPage.on('pageerror', (error) => failures.push('Animation page error: ' + error.message))
await animationPage.goto(baseURL, { waitUntil: 'domcontentloaded' })
await animationPage.locator('.intro').waitFor()
const started = Date.now()
const frames = [
  ['initial', 0],
  ['date-mid', 900],
  ['date-complete', 1780],
  ['names-fading', 1920],
  ['floral-bloom', 2450],
  ['revealed', 3350],
]
const frameMetrics = []
for (const [label, at] of frames) {
  await animationPage.waitForTimeout(Math.max(0, started + at - Date.now()))
  frameMetrics.push(
    await animationPage.locator('.intro').evaluate(
      (intro, name) => ({
        name,
        elapsed: Math.round(performance.now()),
        date: intro.querySelector('.intro__date-visible').textContent.trim(),
        namesOpacity: getComputedStyle(intro.querySelector('.intro__names')).opacity,
        flowersOpacity: getComputedStyle(intro.querySelector('.intro__florals--left')).opacity,
        envelopeOpacity: getComputedStyle(intro.querySelector('.envelope')).opacity,
      }),
      label,
    ),
  )
  await animationPage.screenshot({ path: join(folder, label + '-1440.png'), animations: 'allow' })
}
if (frameMetrics[0].date === '02 · 22 · 27' || frameMetrics[1].date === '02 · 22 · 27')
  failures.push('Date completed too early')
if (frameMetrics[2].date !== '02 · 22 · 27') failures.push('Date did not complete near 1.75 seconds')
if (frameMetrics[0].namesOpacity !== '0') failures.push('Names were visible at the first frame')
if (frameMetrics.at(-1).namesOpacity !== '1' || frameMetrics.at(-1).flowersOpacity !== '1')
  failures.push('The full reveal did not finish')
if (await animationPage.locator('audio').evaluate((element) => !element.paused))
  failures.push('Audio started without a user gesture')
await animationPage.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
await animationPage.waitForTimeout(240)
await animationPage.screenshot({ path: join(folder, 'opening-1440.png'), animations: 'allow' })
await animationPage.locator('.intro').waitFor({ state: 'detached' })
if (!(await animationPage.locator('.wedding-main').evaluate((element) => element === document.activeElement)))
  failures.push('Focus did not move to wedding content after opening')
if ((await animationPage.locator('audio').count()) !== 1) failures.push('Duplicate audio elements')
await animationContext.close()

const mobileContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  reducedMotion: 'reduce',
})
const mobilePage = await mobileContext.newPage()
await mobilePage.goto(baseURL, { waitUntil: 'networkidle' })
await mobilePage.getByRole('button', { name: 'Open wedding invitation and play music' }).tap()
await mobilePage.locator('.intro').waitFor({ state: 'detached' })
await mobileContext.close()

const blockedContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const blockedPage = await blockedContext.newPage()
await blockedPage.addInitScript(() => {
  HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'))
})
await blockedPage.goto(baseURL, { waitUntil: 'networkidle' })
await blockedPage.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
await blockedPage.locator('.intro').waitFor({ state: 'detached' })
if (!(await blockedPage.locator('.wedding-main').isVisible()))
  failures.push('Blocked audio prevented the invitation from opening')
await blockedContext.close()

await browser.close()
writeFileSync(join(folder, 'measurements.json'), JSON.stringify({ measurements, frameMetrics }, null, 2))
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}

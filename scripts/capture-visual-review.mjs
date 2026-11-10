import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, webkit } from 'playwright-core'

const phase = process.argv[2]
const milestone = process.argv[3] ?? '02a'
if (phase !== 'before' && phase !== 'after') {
  console.error('Usage: node scripts/capture-visual-review.mjs before|after [milestone]')
  process.exit(1)
}
if (!/^[a-z0-9-]+$/.test(milestone)) throw new Error('Invalid milestone name')

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/'
const folder = fileURLToPath(new URL(`../screenshots/${milestone}-${phase}/`, import.meta.url))
mkdirSync(folder, { recursive: true })
const edgePath =
  process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

let browser
try {
  browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
  })
} catch {
  browser = await webkit.launch({ headless: true })
}

for (const { label, width, height } of [
  { label: 'mobile-390', width: 390, height: 844 },
  { label: 'desktop-1024', width: 1024, height: 900 },
  { label: 'desktop-1440', width: 1440, height: 900 },
  ...(phase === 'after' ? [{ label: 'desktop-1920', width: 1920, height: 1080 }] : []),
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: join(folder, `envelope-${label}.png`) })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.locator('.hero__image').evaluate((image) => image.decode())
  await page.locator('.hero').screenshot({ path: join(folder, `hero-${label}.png`) })
  if (width !== 1920) {
    await page.evaluate(async () => {
      const images = [...document.images]
      for (const image of images) image.loading = 'eager'
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    })
    if (await page.locator('.welcome').count()) {
      await page.locator('.welcome').screenshot({ path: join(folder, `welcome-${label}.png`) })
      const clips = await page.evaluate(() => {
        const hero = document.querySelector('.hero').getBoundingClientRect()
        const welcome = document.querySelector('.welcome').getBoundingClientRect()
        const divider = document.querySelector('.photo-divider').getBoundingClientRect()
        return {
          heroWelcome: {
            x: 0,
            y: hero.bottom + scrollY - 180,
            width: document.documentElement.clientWidth,
            height: 360,
          },
          welcomeDivider: {
            x: 0,
            y: welcome.bottom + scrollY - 180,
            width: document.documentElement.clientWidth,
            height: divider.top - welcome.bottom + 360,
          },
        }
      })
      await page.screenshot({
        path: join(folder, `hero-welcome-${label}.png`),
        clip: clips.heroWelcome,
        fullPage: true,
      })
      await page.screenshot({
        path: join(folder, `welcome-divider-${label}.png`),
        clip: clips.welcomeDivider,
        fullPage: true,
      })
    }
    const transitionClip = await page.evaluate(() => {
      const hero = document.querySelector('.hero').getBoundingClientRect()
      const divider = document.querySelector('.photo-divider').getBoundingClientRect()
      const top = Math.max(0, hero.bottom + scrollY - 160)
      const bottom = divider.bottom + scrollY + 120
      return { x: 0, y: top, width: document.documentElement.clientWidth, height: bottom - top }
    })
    await page.screenshot({
      path: join(folder, `hero-transition-${label}.png`),
      clip: transitionClip,
      fullPage: true,
    })
    for (const [index, name] of ['entourage', 'venues', 'reminders', 'faqs'].entries()) {
      await page
        .locator('.photo-divider')
        .nth(index)
        .screenshot({ path: join(folder, `divider-${name}-${label}.png`) })
    }
    await page.screenshot({ path: join(folder, `page-${label}.png`), fullPage: true })
  }
  await context.close()
}

if (phase === 'after') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  const heading = page.locator('#entourage-title')
  const initial = await heading.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    transform: getComputedStyle(element).transform,
  }))
  await heading.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.screenshot({ path: join(folder, 'reveal-initial-mobile-390.png') })
  await page.waitForTimeout(900)
  const final = await heading.evaluate((element) => ({
    opacity: getComputedStyle(element).opacity,
    transform: getComputedStyle(element).transform,
  }))
  await page.screenshot({ path: join(folder, 'reveal-final-mobile-390.png') })
  writeFileSync(join(folder, 'reveal-states.json'), JSON.stringify({ initial, final }, null, 2))
  await context.close()
}

await browser.close()
console.log(`Captured ${phase} visual review in ${folder}`)

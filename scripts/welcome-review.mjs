import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const phase = process.argv[2]
if (phase !== 'before' && phase !== 'after') throw new Error('Use before or after')

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:5174/'
const folder = fileURLToPath(new URL(`../screenshots/welcome-type-${phase}/`, import.meta.url))
mkdirSync(folder, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const results = []

for (const [width, height] of [
  [320, 700],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 900],
  [1440, 900],
  [1920, 1080],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)

  const welcome = page.locator('.welcome')
  const metrics = await welcome.evaluate((section) => {
    const outer = section.getBoundingClientRect()
    const inner = section.querySelector('.welcome__inner').getBoundingClientRect()
    const heading = getComputedStyle(section.querySelector('.welcome__heading'))
    const body = getComputedStyle(section.querySelector('.welcome__message p'))
    const label = getComputedStyle(section.querySelector('.welcome__music-label'))
    const playButton = section.querySelector('.welcome__music-button').getBoundingClientRect()
    return {
      width: innerWidth,
      viewportHeight: innerHeight,
      sectionHeight: Math.round(outer.height),
      targetHeight: Math.round(innerHeight * 0.8),
      contentHeight: Math.round(inner.height),
      contentFits: inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1,
      documentWidth: document.documentElement.scrollWidth,
      heading: { fontSize: heading.fontSize, lineHeight: heading.lineHeight, color: heading.color },
      body: { fontSize: body.fontSize, lineHeight: body.lineHeight, color: body.color },
      label: { fontSize: label.fontSize, color: label.color },
      buttonSize: Math.round(playButton.width),
      clipped: [...section.querySelectorAll('h2,p,button')]
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.left < -1 || rect.right > innerWidth + 1
        })
        .map((element) => element.textContent.trim().slice(0, 40)),
    }
  })
  await welcome.screenshot({ path: join(folder, `welcome-${width}.png`), animations: 'disabled' })
  results.push(metrics)
  console.log(JSON.stringify(metrics))
  await context.close()
}

await browser.close()
writeFileSync(join(folder, 'measurements.json'), JSON.stringify(results, null, 2))

if (phase === 'after') {
  const failures = results.filter(
    ({ width, sectionHeight, targetHeight, contentFits, documentWidth, clipped, buttonSize }) =>
      Math.abs(sectionHeight - targetHeight) > 2 ||
      !contentFits ||
      documentWidth > width + 1 ||
      clipped.length ||
      buttonSize < 44,
  )
  if (failures.length) {
    console.error(`Welcome layout failed at ${failures.map(({ width }) => width).join(', ')}px`)
    process.exitCode = 1
  }
}

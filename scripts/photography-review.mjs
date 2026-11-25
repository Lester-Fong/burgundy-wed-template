import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const output = fileURLToPath(new URL('../screenshots/02d/', import.meta.url))
const edgePath =
  process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
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
const requestedWidths = new Set(process.argv.slice(2).map(Number))
const observations = []
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

try {
  for (const [width, height] of sizes.filter(
    ([width]) => !requestedWidths.size || requestedWidths.has(width),
  )) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager'
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
      await document.fonts.ready
    })
    const measurements = await page.evaluate(() => {
      const hero = document.querySelector('.hero')
      const text = ['.hero__monogram', '.hero__names', '.hero__date'].map((selector) =>
        hero.querySelector(selector).getBoundingClientRect(),
      )
      const images = [
        document.querySelector('.hero__image'),
        ...document.querySelectorAll('.photo-divider__media img'),
        document.querySelector('.timeline__image'),
      ]
      return {
        documentWidth: document.documentElement.scrollWidth,
        heroHeight: Math.round(hero.getBoundingClientRect().height),
        timelineHeight: Math.round(document.querySelector('.timeline').getBoundingClientRect().height),
        heroTextOverlap: text.some((rect, index) => index > 0 && rect.top < text[index - 1].bottom - 1),
        missingImages: [...document.images]
          .filter((image) => !image.complete || !image.naturalWidth)
          .map((image) => image.src),
        photos: images.map((image) => ({
          src: new URL(image.currentSrc).pathname,
          natural: [image.naturalWidth, image.naturalHeight],
          rendered: [
            Math.round(image.getBoundingClientRect().width),
            Math.round(image.getBoundingClientRect().height),
          ],
          fit: getComputedStyle(image).objectFit,
          position: getComputedStyle(image).objectPosition,
        })),
      }
    })
    observations.push({ width, height, ...measurements, errors })
    if (
      measurements.documentWidth > width + 1 ||
      measurements.missingImages.length ||
      measurements.heroTextOverlap ||
      errors.length
    )
      process.exitCode = 1
    await page.locator('.hero').screenshot({ path: join(output, `hero-${width}.png`) })
    await page.locator('.timeline').screenshot({ path: join(output, `timeline-${width}.png`) })
    if (width === 390 || width === 1440) {
      for (let index = 0; index < 4; index++) {
        await page
          .locator('.photo-divider')
          .nth(index)
          .screenshot({
            path: join(output, `divider-${index + 1}-${width}.png`),
          })
      }
      await page.screenshot({
        path: join(output, `full-page-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }
    console.log(
      `${width}px: document ${measurements.documentWidth}px; hero ${measurements.heroHeight}px; timeline ${measurements.timelineHeight}px; missing ${measurements.missingImages.length}`,
    )
    await page.close()
  }
} finally {
  await browser.close()
  const reportName = requestedWidths.size
    ? `measurements-${[...requestedWidths].join('-')}.json`
    : 'measurements.json'
  writeFileSync(join(output, reportName), JSON.stringify(observations, null, 2))
}

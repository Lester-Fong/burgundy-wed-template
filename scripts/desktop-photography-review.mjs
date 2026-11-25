import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const stage = process.argv[2]
if (!['before', 'after'].includes(stage)) throw new Error('Choose before or after')

const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const output = fileURLToPath(new URL(`../screenshots/02d1/${stage}/`, import.meta.url))
const edgePath =
  process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const sizes = [
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
  [390, 844],
  [430, 932],
]

mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const measurements = []

try {
  for (const [width, height] of sizes) {
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
    await page.addStyleTag({ content: '.music-control { visibility: hidden !important; }' })
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager'
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
      await document.fonts.ready
    })

    const observation = await page.evaluate(() => {
      const rect = (selector) => {
        const bounds = document.querySelector(selector).getBoundingClientRect()
        return { top: bounds.top, bottom: bounds.bottom, height: bounds.height, width: bounds.width }
      }
      const monogram = rect('.hero__monogram')
      const names = rect('.hero__names')
      const date = rect('.hero__date')
      const heroImage = document.querySelector('.hero__image')
      const timelineImage = document.querySelector('.timeline__image')
      return {
        documentWidth: document.documentElement.scrollWidth,
        heroHeight: rect('.hero').height,
        heroMediaHeight: rect('.hero__media').height,
        heroImageFit: getComputedStyle(heroImage).objectFit,
        heroImagePosition: getComputedStyle(heroImage).objectPosition,
        monogramToNames: names.top - monogram.bottom,
        namesToDate: date.top - names.bottom,
        heroTextOverlap: names.top < monogram.bottom || date.top < names.bottom,
        timelineHeight: rect('.timeline').height,
        timelineMediaWidth: rect('.timeline__media').width,
        timelineImagePosition: getComputedStyle(timelineImage).objectPosition,
        timelineImageTransform: getComputedStyle(timelineImage).transform,
        dividerHeight: rect('.photo-divider').height,
        missingImages: [...document.images]
          .filter((image) => !image.complete || !image.naturalWidth)
          .map((image) => image.src),
      }
    })
    measurements.push({ width, height, ...observation, errors })
    if (
      observation.documentWidth > width + 1 ||
      observation.heroTextOverlap ||
      observation.missingImages.length ||
      errors.length
    )
      process.exitCode = 1

    for (const [name, selector] of [
      ['hero', '.hero'],
      ['entourage-divider', '.photo-divider'],
      ['timeline', '.timeline'],
    ]) {
      await page
        .locator(selector)
        .first()
        .screenshot({ path: join(output, `${name}-${width}.png`), animations: 'disabled' })
    }
    if (width === 1440) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }))
      await page.screenshot({ path: join(output, 'hero-first-viewport-1440.png'), animations: 'disabled' })
    }
    console.log(
      `${stage} ${width}x${height}: Hero ${Math.round(observation.heroHeight)}px; text gaps ${Math.round(observation.monogramToNames)}/${Math.round(observation.namesToDate)}px; missing ${observation.missingImages.length}`,
    )
    await page.close()
  }
} finally {
  await browser.close()
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
}

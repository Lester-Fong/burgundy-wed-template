import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const phase = process.argv[2]
const milestone = process.argv[3] ?? '02a2'
if (!['before', 'after'].includes(phase)) {
  console.error('Usage: node scripts/hero-composition-review.mjs before|after [milestone]')
  process.exit(1)
}
if (!/^[a-z0-9-]+$/.test(milestone)) throw new Error('Invalid milestone name')

const folder = fileURLToPath(new URL(`../screenshots/${milestone}-${phase}/`, import.meta.url))
mkdirSync(folder, { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const viewports = [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
]
const results = []
const failures = []

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/', {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.locator('.hero__image').evaluate(async (image) => {
    await image.decode()
    await document.fonts.ready
  })
  const geometry = await page.evaluate(() => {
    const select = (selector) => document.querySelector(selector)
    const box = (selector) => {
      const element = select(selector)
      const rect = element.getBoundingClientRect()
      return {
        x: Math.round(rect.x * 10) / 10,
        y: Math.round(rect.y * 10) / 10,
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
        centerX: Math.round((rect.x + rect.width / 2) * 10) / 10,
        bottom: Math.round(rect.bottom * 10) / 10,
      }
    }
    const image = select('.hero__image')
    const content = select('.hero__content')
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      hero: box('.hero'),
      media: box('.hero__media'),
      image: box('.hero__image'),
      content: box('.hero__content'),
      monogram: box('.hero__monogram'),
      names: box('.hero__names'),
      date: box('.hero__date'),
      transition: box('.hero-transition'),
      contentPosition: getComputedStyle(content).position,
      contentTransform: getComputedStyle(content).transform,
      contentTextAlign: getComputedStyle(content).textAlign,
      contentGap: getComputedStyle(content).rowGap,
      imageObjectFit: getComputedStyle(image).objectFit,
      imageObjectPosition: getComputedStyle(image).objectPosition,
      imageNaturalSize: { width: image.naturalWidth, height: image.naturalHeight },
      imageLoaded: image.complete && image.naturalWidth > 0,
      unexpectedNavigation: !!document.querySelector('.hero nav, .hero header'),
    }
  })
  results.push(geometry)
  await page
    .locator('.hero')
    .screenshot({ path: join(folder, `hero-${viewport.width}x${viewport.height}.png`) })
  const transitionClip = await page.evaluate(() => {
    const hero = document.querySelector('.hero').getBoundingClientRect()
    const transition = document.querySelector('.hero-transition').getBoundingClientRect()
    const top = Math.max(0, hero.bottom + scrollY - 220)
    const bottom = transition.bottom + scrollY + 180
    return { x: 0, y: top, width: document.documentElement.clientWidth, height: bottom - top }
  })
  await page.screenshot({
    path: join(folder, `transition-${viewport.width}x${viewport.height}.png`),
    clip: transitionClip,
    fullPage: true,
  })

  if (phase === 'after') {
    const label = `${viewport.width}x${viewport.height}`
    if (!geometry.imageLoaded || geometry.unexpectedNavigation) failures.push(`${label}: media or navigation`)
    if (geometry.documentWidth > viewport.width + 1) failures.push(`${label}: horizontal overflow`)
    for (const key of ['monogram', 'names', 'date']) {
      const rect = geometry[key]
      if (
        rect.x < -1 ||
        rect.x + rect.width > viewport.width + 1 ||
        rect.y < -1 ||
        rect.bottom > viewport.height + 1
      )
        failures.push(`${label}: ${key} clipped`)
      if (viewport.width >= 1024 && Math.abs(rect.centerX - viewport.width / 2) > 3)
        failures.push(`${label}: ${key} off center (${rect.centerX})`)
    }
    if (viewport.width >= 1024) {
      if (geometry.monogram.bottom + 20 > geometry.names.y || geometry.names.bottom + 20 > geometry.date.y)
        failures.push(`${label}: hero stack overlaps`)
      if (geometry.date.bottom > viewport.height * 0.52)
        failures.push(`${label}: text extends into portrait area`)
      const expectedHeight =
        (geometry.media.width * geometry.imageNaturalSize.height) / geometry.imageNaturalSize.width
      if (Math.abs(geometry.media.height - expectedHeight) > 3 || geometry.hero.height < expectedHeight - 3)
        failures.push(`${label}: portrait height does not follow its natural aspect ratio`)
      if (geometry.transition.y < geometry.hero.bottom - 1)
        failures.push(`${label}: transition begins before the portrait ends`)
    }
  }
  await context.close()
}

await browser.close()
writeFileSync(join(folder, 'geometry.json'), JSON.stringify(results, null, 2))
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else console.log(`Hero ${phase} review captured in ${folder}`)

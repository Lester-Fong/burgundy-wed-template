import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const phase = process.argv[2]
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after')
const folder = fileURLToPath(new URL(`../screenshots/02b2-${phase}/`, import.meta.url))
mkdirSync(folder, { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const widths = [
  [320, 700],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
]
const results = []
const failures = []

for (const [width, height] of widths) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/', {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = [...document.images]
    for (const image of images) image.loading = 'eager'
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
  })
  const result = await page.evaluate(() => {
    const section = document.querySelector('.venues')
    const items = [...section.querySelectorAll('article')]
    const measure = (selector) => {
      const element = section.querySelector(selector)
      if (!element) return null
      const style = getComputedStyle(element)
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      }
    }
    const style = getComputedStyle(section)
    const outside = [...section.querySelectorAll('h2,h3,p,a,button,img,svg')]
      .filter((element) => {
        const box = element.getBoundingClientRect()
        return box.width && (box.left < -1 || box.right > innerWidth + 1)
      })
      .map((element) => element.textContent?.trim().slice(0, 45) || element.tagName)
    return {
      width: innerWidth,
      viewportHeight: innerHeight,
      sectionHeight: Math.round(section.getBoundingClientRect().height),
      documentWidth: document.documentElement.scrollWidth,
      itemCount: items.length,
      outside,
      paddingTop: style.paddingTop,
      paddingBottom: style.paddingBottom,
      gridColumns: getComputedStyle(section.querySelector('.venues__grid')).gridTemplateColumns,
      headings: [...section.querySelectorAll('h2,h3')].map((item) => item.textContent.trim()),
      qrPending: section.querySelectorAll('.venue-card__qr--pending,.venue-location__pending').length,
      mapLinks: [...section.querySelectorAll('a[href]')].map((link) => ({
        href: link.href,
        target: link.target,
        rel: link.rel,
      })),
      artSources: [...section.querySelectorAll('.venue-panel__art img')].map((image) => image.currentSrc),
      panelBorders: items.filter((item) => getComputedStyle(item).borderTopWidth !== '0px').length,
      pendingButtonHeight:
        section.querySelector('.venue-location__button--pending')?.getBoundingClientRect().height ?? 0,
      typography: {
        title: measure('#venues-title'),
        role: measure('.venue-card .eyebrow,.venue-panel__role'),
        name: measure('.venue-card h3,.venue-panel__name'),
        address: measure('.venue-card__address,.venue-panel__address'),
        scan: measure('.venue-location__label'),
      },
    }
  })
  result.errors = errors
  results.push(result)
  if (result.documentWidth > width + 1 || result.outside.length || errors.length)
    failures.push(`${width}px: ${JSON.stringify(result)}`)
  if (phase === 'after') {
    if (result.itemCount !== 2 || result.qrPending !== 2 || result.mapLinks.length)
      failures.push(`${width}px: prototype venue fallback changed`)
    if (result.artSources.length !== 2 || result.artSources[0] === result.artSources[1])
      failures.push(`${width}px: distinct venue illustrations missing`)
    if (result.panelBorders || result.pendingButtonHeight < 44)
      failures.push(`${width}px: card border or undersized location control`)
    if (result.gridColumns.split(' ').length !== (width < 700 ? 1 : 2))
      failures.push(`${width}px: venue columns incorrect`)
    if (width === 1440 && result.sectionHeight > 900)
      failures.push('1440px: Venues exceeds target viewport height')
  }
  if ([320, 390, 1366, 1440, 1920].includes(width)) {
    await page.locator('.venues').screenshot({ path: join(folder, `full-${width}.png`) })
    if (phase === 'after' && width === 1440) {
      await page
        .locator('.venue-panel__art')
        .nth(0)
        .screenshot({ path: join(folder, 'ceremony-illustration-1440.png') })
      await page
        .locator('.venue-panel__art')
        .nth(1)
        .screenshot({ path: join(folder, 'reception-illustration-1440.png') })
    }
    await page.evaluate(() => {
      const section = document.querySelector('.venues')
      window.scrollTo(0, section.getBoundingClientRect().top + scrollY)
    })
    await page.screenshot({ path: join(folder, `viewport-${width}.png`) })
  }
  await context.close()
  console.log(`${width}x${height}: Venues ${result.sectionHeight}px`)
}

if (phase === 'after') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto(process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/', {
    waitUntil: 'networkidle',
  })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  const panel = page.locator('.venue-panel').first()
  const initialOpacity = await panel.evaluate((element) => getComputedStyle(element).opacity)
  if (initialOpacity !== '0') failures.push(`Venue reveal began at opacity ${initialOpacity}`)
  await panel.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.venue-panel')).opacity === '1')
  await context.close()

  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const fallbackPage = await fallbackContext.newPage()
  await fallbackPage.addInitScript(() => {
    window.IntersectionObserver = undefined
  })
  await fallbackPage.goto(process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/', {
    waitUntil: 'networkidle',
  })
  await fallbackPage.getByRole('button', { name: 'Enter without music' }).click()
  await fallbackPage.locator('.intro').waitFor({ state: 'detached' })
  const fallbackOpacity = await fallbackPage
    .locator('.venue-panel')
    .first()
    .evaluate((element) => getComputedStyle(element).opacity)
  if (fallbackOpacity !== '1') failures.push('Venue hidden without IntersectionObserver')
  await fallbackContext.close()
}

writeFileSync(join(folder, 'measurements.json'), JSON.stringify({ results, failures }, null, 2))
await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}

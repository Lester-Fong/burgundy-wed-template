import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/'
const phase = process.argv[2]
if (phase && !['before', 'after'].includes(phase)) throw new Error('Use before or after')
const folder = fileURLToPath(
  new URL(`../screenshots/${phase ? `02b1a-${phase}` : '02b1-entourage'}/`, import.meta.url),
)
mkdirSync(folder, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

const widths = [320, 390, 430, 768, 1024, 1440, 1920]
const expectedOrder = [
  'bride-parents',
  'groom-parents',
  'remembrance',
  'representatives',
  'principal-sponsors',
  'secondary-sponsors',
  'honor-attendants',
  'wedding-party',
  'ceremony-readers',
  'bearers',
]
const results = []
const failures = []

async function captureRange(page, filename, firstSelector, lastSelector, topPad = 0, bottomPad = 0) {
  const clip = await page.evaluate(
    ({ firstSelector, lastSelector, topPad, bottomPad }) => {
      const first = document.querySelector(firstSelector).getBoundingClientRect()
      const last = document.querySelector(lastSelector).getBoundingClientRect()
      const y = Math.max(0, first.top + scrollY - topPad)
      const bottom = last.bottom + scrollY + bottomPad
      return { x: 0, y, width: document.documentElement.clientWidth, height: bottom - y }
    },
    { firstSelector, lastSelector, topPad, bottomPad },
  )
  await page.screenshot({ path: join(folder, filename), clip, fullPage: true })
}

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 700 ? 844 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)

  const result = await page.evaluate(() => {
    const section = document.querySelector('#entourage')
    const groups = [...section.querySelectorAll('.entourage__group')]
    const names = [...section.querySelectorAll('.entourage__name')]
    const headings = [...section.querySelectorAll('h2,h3,h4')]
    const outside = [...names, ...headings].filter((element) => {
      const box = element.getBoundingClientRect()
      return box.left < -1 || box.right > innerWidth + 1
    })
    const pairs = [...section.querySelectorAll('.entourage__pair')]
    const groupBoxes = groups.map((element) => element.getBoundingClientRect())
    const transitionGap =
      section.nextElementSibling.getBoundingClientRect().top - section.getBoundingClientRect().bottom
    const styleOf = (selector) => {
      const element = section.querySelector(selector)
      if (!element) return null
      const style = getComputedStyle(element)
      return {
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        fontWeight: style.fontWeight,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
      }
    }
    const sectionStyle = getComputedStyle(section)
    return {
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      sectionHeight: Math.round(section.getBoundingClientRect().height),
      order: groups.map((element) => element.dataset.entourageId),
      nameCount: names.length,
      headingTag: section.querySelector('#entourage-title')?.tagName,
      headingFont: getComputedStyle(section.querySelector('#entourage-title')).fontFamily,
      nameFont: getComputedStyle(names[0]).fontFamily,
      outside: outside.map((element) => element.textContent.trim()),
      cardBorders: groups.filter((element) => {
        const style = getComputedStyle(element)
        return style.borderTopWidth !== '0px' || style.boxShadow !== 'none'
      }).length,
      pairColumns: pairs.map((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
      groupOverlap: groupBoxes.some((box, index) => index > 0 && box.top < groupBoxes[index - 1].bottom - 1),
      transitionGap,
      typography: {
        heading: styleOf('#entourage-title'),
        intro: styleOf('.entourage__intro'),
        role: styleOf('.entourage__role'),
        subrole: styleOf('.entourage__role--sub'),
        name: styleOf('.entourage__name'),
        description: styleOf('.entourage__description'),
        group: styleOf('.entourage__group + .entourage__group'),
        chapterRoles: styleOf('.entourage__chapter-roles'),
        paddingTop: sectionStyle.paddingTop,
        paddingBottom: sectionStyle.paddingBottom,
      },
    }
  })
  result.pageErrors = pageErrors
  results.push(result)
  if (result.documentWidth > width + 1) failures.push(`${width}px horizontal overflow`)
  if (result.outside.length) failures.push(`${width}px clipped text: ${result.outside.join(', ')}`)
  if (result.order.join() !== expectedOrder.join()) failures.push(`${width}px entourage order changed`)
  if (result.cardBorders) failures.push(`${width}px old card border remains`)
  if (result.groupOverlap) failures.push(`${width}px groups overlap`)
  if (Math.abs(result.transitionGap) > 1) failures.push(`${width}px divider gap ${result.transitionGap}`)
  if (result.pairColumns.some((count) => count !== (width < 700 ? 1 : 2)))
    failures.push(`${width}px paired column layout incorrect`)
  if (pageErrors.length) failures.push(`${width}px page errors: ${pageErrors.join('; ')}`)
  if (width === 320 || width === 390 || width === 430 || width === 1440 || width === 1920) {
    await page.locator('#entourage').screenshot({ path: join(folder, `full-${width}.png`) })
  }
  if (width === 1440 || width === 1920) {
    await captureRange(
      page,
      `desktop-heading-parents-${width}.png`,
      '#entourage',
      '[data-entourage-id="groom-parents"]',
      0,
      26,
    )
    await captureRange(
      page,
      `desktop-principal-sponsors-${width}.png`,
      '[data-entourage-id="principal-sponsors"]',
      '[data-entourage-id="principal-sponsors"]',
      45,
      45,
    )
    if (width === 1440)
      await captureRange(
        page,
        'desktop-secondary-party-1440.png',
        '[data-entourage-id="secondary-sponsors"]',
        '[data-entourage-id="wedding-party"]',
        35,
        35,
      )
  }
  if (width === 1920 && phase) {
    await page.evaluate(() => {
      const section = document.querySelector('#entourage')
      window.scrollTo(0, section.getBoundingClientRect().top + scrollY - 22)
    })
    await page.screenshot({ path: join(folder, 'comparison-local-1920.png') })
    await page.evaluate(() => {
      const sponsors = document.querySelector('[data-entourage-id="principal-sponsors"]')
      window.scrollTo(0, sponsors.getBoundingClientRect().top + scrollY - 130)
    })
    await page.screenshot({ path: join(folder, 'comparison-sponsors-local-1920.png') })
  }
  if (width === 390) {
    await captureRange(
      page,
      'mobile-upper-390.png',
      '#entourage',
      '[data-entourage-id="principal-sponsors"]',
      0,
      25,
    )
    await captureRange(
      page,
      'mobile-lower-390.png',
      '[data-entourage-id="secondary-sponsors"]',
      '[data-entourage-id="bearers"]',
      25,
      25,
    )
    await captureRange(
      page,
      'entourage-photo-transition-390.png',
      '#entourage .entourage__group:last-child',
      '#entourage + .photo-divider',
      150,
      0,
    )
  }
  await context.close()
  console.log(
    `${width}px: ${result.nameCount} names, section ${result.sectionHeight}px, document ${result.documentWidth}px`,
  )
}

const motionContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const motionPage = await motionContext.newPage()
await motionPage.goto(baseURL, { waitUntil: 'networkidle' })
await motionPage.getByRole('button', { name: 'Enter without music' }).click()
await motionPage.locator('.intro').waitFor({ state: 'detached' })
const principalGroup = motionPage.locator('[data-entourage-id="principal-sponsors"]')
const pendingOpacity = await principalGroup.evaluate((element) => getComputedStyle(element).opacity)
if (pendingOpacity !== '0') failures.push(`Entourage category reveal started at opacity ${pendingOpacity}`)
await principalGroup.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await motionPage.waitForFunction(
  () => getComputedStyle(document.querySelector('[data-entourage-id="principal-sponsors"]')).opacity === '1',
)
const shownOpacity = await principalGroup.evaluate((element) => getComputedStyle(element).opacity)
if (shownOpacity !== '1') failures.push(`Entourage category reveal ended at opacity ${shownOpacity}`)
await motionContext.close()

const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const fallbackPage = await fallbackContext.newPage()
await fallbackPage.addInitScript(() => {
  window.IntersectionObserver = undefined
})
await fallbackPage.goto(baseURL, { waitUntil: 'networkidle' })
await fallbackPage.getByRole('button', { name: 'Enter without music' }).click()
await fallbackPage.locator('.intro').waitFor({ state: 'detached' })
const fallbackOpacity = await fallbackPage
  .locator('[data-entourage-id="principal-sponsors"]')
  .evaluate((element) => getComputedStyle(element).opacity)
if (fallbackOpacity !== '1') failures.push('Entourage category hidden without IntersectionObserver')
await fallbackContext.close()

writeFileSync(join(folder, 'checks.json'), JSON.stringify({ results, failures }, null, 2))
await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Entourage visual checks passed; screenshots saved to ${folder}`)
}

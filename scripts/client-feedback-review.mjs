import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const phase = process.argv[2]
assert.ok(['before', 'after'].includes(phase), 'Use before or after')
const output = fileURLToPath(new URL(`../screenshots/02c3-${phase}/`, import.meta.url))
const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const sizes = [320, 390, 430, 768, 1024, 1366, 1440, 1920]
const measurements = []

try {
  for (const width of sizes) {
    console.log(`${phase}: checking ${width}px`)
    const page = await browser.newPage({
      viewport: { width, height: width < 768 ? 844 : width < 1024 ? 1024 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.setDefaultTimeout(15000)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      await document.fonts.ready
      for (const image of document.images) image.loading = 'eager'
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
    })

    const result = await page.evaluate(() => {
      const rect = (selector) => {
        const element = document.querySelector(selector)
        if (!element) return null
        const box = element.getBoundingClientRect()
        return { height: Math.round(box.height), width: Math.round(box.width) }
      }
      const attire = document.querySelector('#attire') ?? document.querySelector('.attire')
      const entourage = document.querySelector('#entourage')
      const gifts = document.querySelector('.gifts')
      const welcome = document.querySelector('.welcome')
      const outside = [...document.querySelectorAll('h1,h2,h3,h4,button,a,.entourage__name')]
        .filter((element) => {
          const box = element.getBoundingClientRect()
          return box.left < -1 || box.right > innerWidth + 1
        })
        .map((element) => element.textContent.trim().slice(0, 50))
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        attireHeight: Math.round(attire.getBoundingClientRect().height),
        entourageHeight: Math.round(entourage.getBoundingClientRect().height),
        giftHeight: Math.round(gifts.getBoundingClientRect().height),
        welcomeHeight: Math.round(welcome.getBoundingClientRect().height),
        attireFigures: attire.querySelectorAll('.attire__look img').length,
        attireLegend: attire.querySelectorAll('.attire__legend-item').length,
        guestColors: attire.querySelectorAll('.attire__guest-color').length,
        entourageNames: entourage.querySelectorAll('.entourage__name').length,
        entourageOrder: [...entourage.querySelectorAll('.entourage__group')].map(
          (group) => group.dataset.entourageId,
        ),
        sponsorColumns: [
          ...entourage.querySelectorAll('[data-entourage-id="principal-sponsors"] .entourage__column'),
        ].map((column) => column.querySelectorAll('.entourage__name').length),
        welcomeSubtitle: welcome.querySelector('.welcome__subtitle')?.textContent.trim() ?? null,
        giftOptions: [...gifts.querySelectorAll('.gifts__option')].map((option) => option.textContent.trim()),
        outside,
        missingImages: [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.src),
        sections: [rect('#entourage'), rect('.attire'), rect('.gifts')],
      }
    })
    result.errors = errors
    measurements.push(result)
    assert.equal(result.documentWidth, width, `${width}px page overflow`)
    assert.deepEqual(result.outside, [], `${width}px clipped text`)
    assert.deepEqual(result.missingImages, [], `${width}px missing images`)
    assert.deepEqual(errors, [], `${width}px browser errors`)
    if (phase === 'after') {
      assert.equal(result.attireFigures, 5)
      assert.equal(result.attireLegend, 2)
      assert.equal(result.guestColors, 3)
      assert.deepEqual(result.sponsorColumns, [17, 17])
      assert.equal(result.welcomeSubtitle, 'The Convalidation of Our Marriage')
      assert.equal(result.giftOptions.length, 2)
    }
    if ([390, 1440].includes(width)) {
      await page.locator('.attire').screenshot({ path: join(output, `attire-${width}.png`) })
      if (phase === 'after') {
        await page.locator('#entourage').screenshot({ path: join(output, `entourage-${width}.png`) })
        await page.locator('.gifts').screenshot({ path: join(output, `gifts-${width}.png`) })
        await page.locator('.welcome').screenshot({ path: join(output, `welcome-${width}.png`) })
        await page.screenshot({ path: join(output, `full-page-${width}.png`), fullPage: true })
      }
    }
    if (phase === 'after' && width === 1440) {
      await page
        .locator('.attire__group--sponsors')
        .screenshot({ path: join(output, 'principal-sponsors-closeup-1440.png') })
      await page
        .locator('.attire__group--guests')
        .screenshot({ path: join(output, 'wedding-guests-1440.png') })
    }
    await page.close()
  }
} finally {
  await browser.close()
}
writeFileSync(join(output, 'measurements.json'), `${JSON.stringify(measurements, null, 2)}\n`)
console.log(JSON.stringify({ phase, output, measurements }, null, 2))

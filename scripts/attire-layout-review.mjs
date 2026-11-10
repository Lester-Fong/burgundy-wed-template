import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const stage = process.argv[2]
assert.ok(['before', 'after'].includes(stage), 'Run with before or after')

const output = fileURLToPath(new URL('../screenshots/02b3d/', import.meta.url))
const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const sizes = [320, 390, 430, 768, 1024, 1440, 1920]
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const measurements = []

try {
  for (const width of sizes) {
    const page = await browser.newPage({
      viewport: { width, height: width < 600 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      await document.fonts.ready
      const images = [...document.querySelectorAll('.attire img')]
      for (const image of images) image.loading = 'eager'
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    })
    const result = await page.evaluate(() => {
      const section = document.querySelector('.attire')
      const party = section.querySelector('#attire-party-title').closest('.attire__group')
      const guests = section.querySelector('#attire-guests-title').closest('.attire__group')
      const legend = section.querySelector('.attire__legend')
      const partyBox = party.getBoundingClientRect()
      const guestBox = guests.getBoundingClientRect()
      const sectionBox = section.getBoundingClientRect()
      const images = [...section.querySelectorAll('.attire__look img')]
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionBox.height),
        partyWidth: Math.round(partyBox.width),
        guestsWidth: Math.round(guestBox.width),
        partyTop: Math.round(partyBox.top - sectionBox.top),
        guestsTop: Math.round(guestBox.top - sectionBox.top),
        groupOrder: partyBox.bottom <= guestBox.top + 1 ? 'stacked' : 'side-by-side',
        partyFigures: party.querySelectorAll('.attire__look img').length,
        guestFigures: guests.querySelectorAll('.attire__look img').length,
        imagesLoaded: images.every((image) => image.complete && image.naturalWidth > 0),
        partyColors: [...legend.querySelectorAll('.attire__legend-item')].map((item) => ({
          role: item.querySelector('strong').textContent.trim(),
          text: item.querySelector('div > span').textContent.trim().replace(/\s+/g, ' '),
        })),
        guestColors: [...section.querySelectorAll('.attire__guest-color')].map((item) => ({
          name: item.querySelector('strong').textContent.trim(),
          hex: item.querySelector('small').textContent.trim(),
        })),
        legendColumns: getComputedStyle(legend).gridTemplateColumns.split(' ').length,
        outsideViewport: [...section.querySelectorAll('h2, h3, p, strong, small, img')]
          .filter((node) => {
            const box = node.getBoundingClientRect()
            return box.left < -1 || box.right > innerWidth + 1
          })
          .map((node) => node.textContent?.trim() || node.getAttribute('alt')),
      }
    })
    assert.equal(result.documentWidth, width, `Horizontal overflow at ${width}px`)
    assert.equal(result.partyFigures, 5)
    assert.equal(result.guestFigures, 3)
    assert.equal(result.imagesLoaded, true)
    assert.equal(result.partyColors.length, 12)
    assert.equal(result.guestColors.length, 3)
    assert.deepEqual(result.outsideViewport, [])
    if (stage === 'after') {
      assert.equal(result.groupOrder, 'stacked', `Groups should stack at ${width}px`)
      assert.equal(result.legendColumns, width >= 1100 ? 4 : 2)
      const baseline = JSON.parse(readFileSync(join(output, 'before-measurements.json'), 'utf8'))
      const prior = baseline.find((item) => item.width === width)
      assert.deepEqual(result.partyColors, prior.partyColors)
      assert.deepEqual(result.guestColors, prior.guestColors)
    }
    await page.locator('.attire').screenshot({
      path: join(output, `${stage}-attire-${width}.png`),
      animations: 'disabled',
      style: '.music-control { visibility: hidden !important; }',
    })
    if (stage === 'after' && width === 1440) {
      await page
        .locator('#attire-party-title')
        .locator('..')
        .screenshot({
          path: join(output, 'after-party-closeup-1440.png'),
          animations: 'disabled',
        })
      await page
        .locator('#attire-guests-title')
        .locator('..')
        .screenshot({
          path: join(output, 'after-guests-closeup-1440.png'),
          animations: 'disabled',
        })
    }
    measurements.push(result)
    console.log(`${stage} ${width}px: ${result.sectionHeight}px, ${result.groupOrder}`)
    await page.close()
  }
  writeFileSync(join(output, `${stage}-measurements.json`), JSON.stringify(measurements, null, 2))
} finally {
  await browser.close()
}

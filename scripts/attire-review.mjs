import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import jsQR from 'jsqr'

const output = fileURLToPath(new URL('../screenshots/02b3b/', import.meta.url))
const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const sizes = [
  [320, 700],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
]
const measurements = []
try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.setDefaultTimeout(15000)
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      await document.fonts.ready
      const images = [...document.images]
      for (const image of images) image.loading = 'eager'
      await Promise.all(images.map((img) => img.decode().catch(() => undefined)))
    })
    await page.locator('.venue-location__qr img').first().waitFor({ state: 'visible' })
    const values = await page.evaluate(() => {
      const attire = document.querySelector('.attire')
      const rect = attire.getBoundingClientRect()
      return {
        documentWidth: document.documentElement.scrollWidth,
        attireHeight: Math.round(rect.height),
        fashionFigures: attire.querySelectorAll('.fashion-figure').length,
        fashionImages: [...attire.querySelectorAll('.attire__look img')].map((image) => ({
          complete: image.complete,
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight,
          renderedWidth: Math.round(image.getBoundingClientRect().width),
          renderedHeight: Math.round(image.getBoundingClientRect().height),
          alt: image.alt,
        })),
        partyColors: attire.querySelectorAll('.attire__legend-item').length,
        guestColors: attire.querySelectorAll('.attire__guest-color').length,
        venueQrs: document.querySelectorAll('.venue-location__qr img').length,
        venueLinks: [...document.querySelectorAll('.venue-location__button[href]')].map((a) =>
          a.getAttribute('href'),
        ),
        clipped: [...attire.querySelectorAll('h2,h3,strong,small,p')]
          .filter((node) => {
            const r = node.getBoundingClientRect()
            return r.left < -1 || r.right > innerWidth + 1
          })
          .map((node) => node.textContent.trim().slice(0, 40)),
      }
    })
    assert.equal(values.documentWidth, width)
    assert.equal(values.fashionFigures, 0)
    assert.equal(values.fashionImages.length, 8)
    for (const image of values.fashionImages) {
      assert.equal(image.complete, true)
      assert.deepEqual([image.naturalWidth, image.naturalHeight], [768, 1152])
      assert.ok(image.renderedWidth >= 80, `Illustration too small at ${width}px`)
      assert.ok(image.alt.length > 20)
    }
    assert.equal(values.partyColors, 12)
    assert.equal(values.guestColors, 3)
    assert.equal(values.venueQrs, 2)
    assert.equal(values.venueLinks.length, 2)
    assert.deepEqual(values.clipped, [])
    assert.deepEqual(errors, [])
    if (width === 390) {
      for (let index = 0; index < 2; index++) {
        const qr = page.locator('.venue-location__qr img').nth(index)
        const image = await qr.evaluate((element) => {
          const canvas = document.createElement('canvas')
          canvas.width = element.naturalWidth
          canvas.height = element.naturalHeight
          const context = canvas.getContext('2d')
          context.drawImage(element, 0, 0)
          return {
            width: canvas.width,
            height: canvas.height,
            pixels: [...context.getImageData(0, 0, canvas.width, canvas.height).data],
          }
        })
        const decoded = jsQR(new Uint8ClampedArray(image.pixels), image.width, image.height)?.data
        const button = page.locator('.venue-location__button[href]').nth(index)
        assert.equal(decoded, await button.getAttribute('href'))
        assert.equal(await button.getAttribute('target'), '_blank')
        assert.equal(await button.getAttribute('rel'), 'noopener noreferrer')
      }
      await page.locator('.venues').screenshot({
        path: join(output, 'verified-venue-maps-390.png'),
        animations: 'disabled',
      })
      await page.locator('.venues').screenshot({
        path: join(output, 'verified-venue-maps-390-unobstructed.png'),
        animations: 'disabled',
        style: '.music-control { visibility: hidden !important; }',
      })
    }
    await page.locator('.attire').screenshot({
      path: join(output, `attire-${width}.png`),
      animations: 'disabled',
    })
    if ([320, 390, 1440].includes(width))
      await page.locator('.attire').screenshot({
        path: join(output, `attire-${width}-unobstructed.png`),
        animations: 'disabled',
        style: '.music-control { visibility: hidden !important; }',
      })
    if (width === 390 || width === 1440) {
      await page.locator('.hero').screenshot({
        path: join(output, `hero-${width}.png`),
        animations: 'disabled',
      })
      await page.locator('.entourage').screenshot({
        path: join(output, `entourage-${width}.png`),
        animations: 'disabled',
      })
      await page.locator('.venues').screenshot({
        path: join(output, `venues-${width}.png`),
        animations: 'disabled',
      })
      await page.screenshot({
        path: join(output, `full-page-${width}.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }
    if (width === 1440) {
      await page.locator('.attire__lineup--party').screenshot({
        path: join(output, 'wedding-party-illustration.png'),
        animations: 'disabled',
      })
      await page.locator('.attire__lineup--guests').screenshot({
        path: join(output, 'wedding-guests-illustration.png'),
        animations: 'disabled',
      })
    }
    measurements.push({ width, height, ...values })
    console.log(`${width}x${height}: attire ${values.attireHeight}px, QR ${values.venueQrs}`)
    await page.close()
  }
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
} finally {
  await browser.close()
}

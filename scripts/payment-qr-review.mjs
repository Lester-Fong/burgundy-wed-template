import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import jsQR from 'jsqr'

const phase = process.argv[2]
assert.ok(['before', 'after'].includes(phase), 'Use before or after')
const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const output = fileURLToPath(new URL(`../screenshots/02c4-${phase}/`, import.meta.url))
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
  [768, 1024],
  [1440, 900],
]
const results = []
const decodeWarnings = []

try {
  for (const [width, height] of sizes) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      await document.fonts.ready
      for (const image of document.querySelectorAll('.gifts img')) image.loading = 'eager'
      await Promise.all(
        [...document.querySelectorAll('.gifts img')].map((image) => image.decode().catch(() => undefined)),
      )
    })

    const result = await page.evaluate(() => {
      const section = document.querySelector('.gifts')
      const sectionBox = section.getBoundingClientRect()
      const options = [...section.querySelectorAll('.gifts__option')]
      const images = options.map((option) => {
        const image = option.querySelector('.gifts__qr-square img')
        if (!image) return null
        const box = image.getBoundingClientRect()
        const readPixels = (size) => {
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size
          const context = canvas.getContext('2d', { willReadFrequently: true })
          context.imageSmoothingEnabled = size !== image.naturalWidth
          context.imageSmoothingQuality = 'high'
          context.fillStyle = '#fff'
          context.fillRect(0, 0, size, size)
          context.drawImage(image, 0, 0, size, size)
          return [...context.getImageData(0, 0, size, size).data]
        }
        return {
          src: image.getAttribute('src'),
          alt: image.alt,
          complete: image.complete,
          natural: [image.naturalWidth, image.naturalHeight],
          rendered: [Math.round(box.width), Math.round(box.height)],
          objectFit: getComputedStyle(image).objectFit,
          naturalPixels: readPixels(Math.max(image.naturalWidth, image.naturalHeight)),
          renderedPixels: readPixels(Math.round(box.width)),
        }
      })
      const clipped = [...section.querySelectorAll('.gifts__art,.gifts__content,.gifts__option')]
        .filter((element) => {
          const box = element.getBoundingClientRect()
          return (
            box.left < sectionBox.left - 1 ||
            box.right > sectionBox.right + 1 ||
            box.top < sectionBox.top - 1 ||
            box.bottom > sectionBox.bottom + 1
          )
        })
        .map((element) => element.className)
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionBox.height),
        optionLabels: options.map((option) => option.querySelector('h3').textContent.trim()),
        pendingLabels: [...section.querySelectorAll('.gifts__pending')].map((node) =>
          node.textContent.trim(),
        ),
        artworkSrc: section.querySelector('.gifts__art img').getAttribute('src'),
        message: section.querySelector('.gifts__message p').textContent.trim(),
        clipped,
        images,
      }
    })
    assert.equal(result.documentWidth, width, `${width}px horizontal overflow`)
    assert.deepEqual(result.optionLabels, ['BDO', 'GCash'])
    assert.deepEqual(result.clipped, [], `${width}px clipped gift content`)
    assert.deepEqual(errors, [], `${width}px browser errors`)
    if (phase === 'before') {
      assert.deepEqual(result.pendingLabels, ['QR pending', 'QR pending'])
      assert.deepEqual(result.images, [null, null])
    } else {
      assert.deepEqual(result.pendingLabels, [])
      for (const [index, image] of result.images.entries()) {
        assert.ok(image, `${result.optionLabels[index]} image missing`)
        assert.equal(image.complete, true)
        assert.ok(image.natural[0] > 200 && image.natural[1] > 200)
        assert.ok(Math.abs(image.natural[0] / image.natural[1] - 1) < 0.03)
        assert.equal(image.objectFit, 'contain')
        const natural = jsQR(
          Uint8ClampedArray.from(image.naturalPixels),
          image.natural[0],
          image.natural[1],
          {
            inversionAttempts: 'attemptBoth',
          },
        )
        const rendered = jsQR(
          Uint8ClampedArray.from(image.renderedPixels),
          image.rendered[0],
          image.rendered[1],
          { inversionAttempts: 'attemptBoth' },
        )
        image.decodesAtNaturalSize = Boolean(natural)
        image.decodesAtRenderedSize = Boolean(rendered)
        delete image.naturalPixels
        delete image.renderedPixels
        if (!natural) decodeWarnings.push(`${result.optionLabels[index]} source QR did not decode`)
        if (!rendered)
          decodeWarnings.push(`${result.optionLabels[index]} displayed QR did not decode at ${width}px`)
      }
    }
    result.errors = errors
    results.push(result)
    await page.locator('.gifts').screenshot({
      path: join(output, `gift-${width}.png`),
      animations: 'disabled',
      style: '.music-control { visibility: hidden !important; }',
    })
    await page.close()
  }
} finally {
  await browser.close()
}

writeFileSync(join(output, 'measurements.json'), `${JSON.stringify({ results, decodeWarnings }, null, 2)}\n`)
console.log(`${phase} Gift Guide layout passed at ${sizes.map(([width]) => width).join(', ')}px`)
if (decodeWarnings.length) {
  console.warn(`QR decode warnings: ${[...new Set(decodeWarnings)].join('; ')}`)
  process.exitCode = 1
}

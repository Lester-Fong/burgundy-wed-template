import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'

const project = fileURLToPath(new URL('../', import.meta.url))
const review = pathToFileURL(join(project, 'artwork', '02b3a', 'review.html')).href
const output = join(project, 'screenshots', '02b3a')
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const results = []
try {
  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1440, 900],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(review, { waitUntil: 'load' })
    await page.evaluate(async () => {
      await Promise.all([...document.images].map((image) => image.decode()))
    })
    const result = await page.evaluate(() => ({
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      images: [...document.querySelectorAll('figure img')].map((image) => ({
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        renderedWidth: Math.round(image.getBoundingClientRect().width),
        renderedHeight: Math.round(image.getBoundingClientRect().height),
      })),
      smallFigures: [...document.querySelectorAll('.small-figures img')].map((image) =>
        Math.round(image.getBoundingClientRect().width),
      ),
    }))
    assert.equal(result.documentWidth, width)
    assert.equal(result.images.length, 2)
    for (const image of result.images) {
      assert.equal(image.naturalWidth, 1024)
      assert.equal(image.naturalHeight, 1536)
      assert.ok(image.renderedWidth >= 240)
    }
    assert.deepEqual(result.smallFigures, [112, 112])
    assert.deepEqual(errors, [])
    await page.screenshot({
      path: join(output, `artwork-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    })
    if (width === 1440) {
      await page
        .locator('figure')
        .nth(0)
        .screenshot({
          path: join(output, 'gown-desktop.png'),
          animations: 'disabled',
        })
      await page
        .locator('figure')
        .nth(1)
        .screenshot({
          path: join(output, 'suit-desktop.png'),
          animations: 'disabled',
        })
    }
    results.push(result)
    console.log(
      `${width}px: ${result.images.map((image) => `${image.renderedWidth}×${image.renderedHeight}`).join(', ')}; no overflow`,
    )
    await page.close()
  }
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}

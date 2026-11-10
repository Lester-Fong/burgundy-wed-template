import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const stage = process.argv[2]
assert.ok(['before', 'after'].includes(stage), 'Run with before or after')
const output = fileURLToPath(new URL('../screenshots/02b6/', import.meta.url))
const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
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
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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
    await page.evaluate(async () => {
      await document.fonts.ready
      const images = [...document.querySelectorAll('.reminders img')]
      for (const image of images) image.loading = 'eager'
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    })
    const result = await page.evaluate(() => {
      const section = document.querySelector('.reminders')
      const sectionBox = section.getBoundingClientRect()
      const heading = section.querySelector('h2')
      const firstTitle = section.querySelector('.reminder h3')
      const firstBody = section.querySelector('.reminder p')
      const rows = [...section.querySelectorAll('.reminder')]
      const ornaments = [...section.querySelectorAll('.reminder img')]
      const font = (element) => {
        const style = getComputedStyle(element)
        return {
          family: style.fontFamily,
          size: style.fontSize,
          lineHeight: style.lineHeight,
          weight: style.fontWeight,
          letterSpacing: style.letterSpacing,
        }
      }
      return {
        width: innerWidth,
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionBox.height),
        heading: heading.textContent.trim().replace(/\s+/g, ' '),
        headingFont: font(heading),
        titleFont: font(firstTitle),
        bodyFont: font(firstBody),
        titles: rows.map((row) => row.querySelector('h3').textContent.trim()),
        paragraphsPerReminder: rows.map((row) => row.querySelectorAll('p').length),
        layout: rows.every(
          (row) => Math.abs(row.getBoundingClientRect().top - rows[0].getBoundingClientRect().top) < 1,
        )
          ? 'columns'
          : 'stacked',
        cardBorders: rows.map((row) => getComputedStyle(row).borderTopWidth),
        ornaments: ornaments.map((image) => ({
          src: image.getAttribute('src'),
          loaded: image.complete && image.naturalWidth > 0,
          naturalSize: [image.naturalWidth, image.naturalHeight],
          renderedSize: [
            Math.round(image.getBoundingClientRect().width),
            Math.round(image.getBoundingClientRect().height),
          ],
        })),
        text: section.textContent.trim(),
        nextGap: Math.round(section.nextElementSibling.getBoundingClientRect().top - sectionBox.bottom),
        clipped: [...section.querySelectorAll('h2, h3, p, img')]
          .filter((node) => {
            const box = node.getBoundingClientRect()
            return box.left < -1 || box.right > innerWidth + 1
          })
          .map((node) => node.textContent?.trim() || node.getAttribute('src')),
      }
    })
    assert.equal(result.documentWidth, width)
    assert.deepEqual(result.clipped, [])
    assert.equal(result.nextGap, 0)
    assert.deepEqual(errors, [])
    if (stage === 'after') {
      assert.equal(result.heading, 'Reminders to Our Dear Guests')
      assert.deepEqual(result.titles, ['Please arrive early!', 'Celebrate with us!', 'Snap & share!'])
      assert.deepEqual(result.paragraphsPerReminder, [2, 2, 2])
      assert.equal(result.layout, width >= 768 ? 'columns' : 'stacked')
      assert.deepEqual(result.cardBorders, ['0px', '0px', '0px'])
      assert.equal(result.ornaments.length, 3)
      for (const ornament of result.ornaments) {
        assert.equal(ornament.src, '/images/attire/reminder-icon.png')
        assert.equal(ornament.loaded, true)
        assert.deepEqual(ornament.naturalSize, [800, 441])
        assert.ok(Math.abs(ornament.renderedSize[0] / ornament.renderedSize[1] - 800 / 441) < 0.02)
      }
      assert.doesNotMatch(result.text, /3:00 PM|#allifetimem|Rich|Ira/i)
    }
    await page.locator('.reminders').screenshot({
      path: join(output, `${stage}-${width}x${height}.png`),
      animations: 'disabled',
      style: '.music-control { visibility: hidden !important; }',
    })
    measurements.push(result)
    console.log(`${stage} ${width}×${height}: ${result.sectionHeight}px, ${result.layout}`)
    await page.close()
  }
  writeFileSync(join(output, `${stage}-measurements.json`), JSON.stringify(measurements, null, 2))
} finally {
  await browser.close()
}

import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const output = fileURLToPath(new URL('../screenshots/02b4/', import.meta.url))
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
  [1366, 768],
  [1440, 900],
  [1920, 1080],
]
const expected = [
  ['2:30 PM', 'Gathering'],
  ['3:00 PM', 'Ceremony'],
  ['5:00 PM', 'Cocktails'],
  ['6:00 PM', 'Reception'],
  ['7:00 PM', 'Dinner'],
  ['9:00 PM', 'After Party'],
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
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Enter without music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      await document.fonts.ready
      const images = [...document.images]
      for (const image of images) image.loading = 'eager'
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)))
    })
    const values = await page.evaluate(() => {
      const section = document.querySelector('.timeline')
      const sectionBox = section.getBoundingClientRect()
      const rows = [...section.querySelectorAll('.timeline__event')]
      const image = section.querySelector('.timeline__image')
      const imageBox = image.getBoundingClientRect()
      const nextBox = section.nextElementSibling.getBoundingClientRect()
      const attire = document.querySelector('.attire')
      const legend = attire.querySelector('.attire__legend')
      return {
        width: innerWidth,
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionBox.height),
        sectionScrollHeight: section.scrollHeight,
        sectionClientHeight: section.clientHeight,
        overflowY: getComputedStyle(section).overflowY,
        heading: section.querySelector('h2').textContent.trim(),
        provisionalNote: section.querySelector('.timeline__note')?.textContent.trim(),
        events: rows.map((row) => [
          row.querySelector('time').textContent.trim(),
          row.querySelector('h3').textContent.trim(),
        ]),
        icons: section.querySelectorAll('.timeline__icon').length,
        dots: section.querySelectorAll('.timeline__dot').length,
        imageLoaded: image.complete && image.naturalWidth > 0,
        imageFit: getComputedStyle(image).objectFit,
        imageCoversSection:
          Math.abs(imageBox.width - sectionBox.width) < 1 &&
          Math.abs(imageBox.height - sectionBox.height) < 1,
        nextSectionGap: Math.round(nextBox.top - sectionBox.bottom),
        clippedRows: rows
          .map((row, index) => ({ index, box: row.getBoundingClientRect() }))
          .filter(
            ({ box }) =>
              box.left < sectionBox.left - 1 ||
              box.right > sectionBox.right + 1 ||
              box.top < sectionBox.top - 1 ||
              box.bottom > sectionBox.bottom + 1,
          )
          .map(({ index }) => index),
        overlappingRows: rows
          .slice(1)
          .map((row, index) =>
            row.getBoundingClientRect().top < rows[index].getBoundingClientRect().bottom - 1 ? index : null,
          )
          .filter((index) => index !== null),
        attireHeight: Math.round(attire.getBoundingClientRect().height),
        attireImages: attire.querySelectorAll('.attire__look img').length,
        partyAssignments: legend.querySelectorAll('.attire__legend-item').length,
        guestColors: attire.querySelectorAll('.attire__guest-color').length,
        assignmentColumns: getComputedStyle(legend).gridTemplateColumns.split(' ').length,
      }
    })
    assert.equal(values.documentWidth, width)
    assert.equal(values.heading, 'The Timeline')
    assert.equal(values.provisionalNote, 'Sample program — details to be confirmed')
    assert.deepEqual(values.events, expected)
    assert.equal(values.icons, 6)
    assert.equal(values.dots, 6)
    assert.equal(values.imageLoaded, true)
    assert.equal(values.imageFit, 'cover')
    assert.equal(values.imageCoversSection, true)
    assert.equal(values.nextSectionGap, 0)
    assert.deepEqual(values.clippedRows, [])
    assert.deepEqual(values.overlappingRows, [])
    assert.ok(!['auto', 'scroll', 'hidden'].includes(values.overflowY))
    assert.ok(values.sectionScrollHeight <= values.sectionClientHeight + 1)
    assert.ok(values.sectionHeight <= height + 1, `Timeline exceeds viewport at ${width} × ${height}`)
    assert.equal(values.attireImages, 8)
    assert.equal(values.partyAssignments, 12)
    assert.equal(values.guestColors, 3)
    assert.equal(values.assignmentColumns, width >= 1100 ? 4 : 2)
    assert.deepEqual(errors, [])
    await page.locator('.timeline').screenshot({
      path: join(output, `timeline-${width}x${height}.png`),
      animations: 'disabled',
    })
    if (width === 390 || width === 1440) {
      await page.locator('.attire').screenshot({
        path: join(output, `attire-${width}.png`),
        animations: 'disabled',
        style: '.music-control { visibility: hidden !important; }',
      })
    }
    if (width === 390) {
      await page.screenshot({
        path: join(output, 'full-page-390.png'),
        fullPage: true,
        animations: 'disabled',
      })
      await page.getByRole('button', { name: 'Play background music' }).click()
      await page.waitForFunction(() => !document.querySelector('audio').paused)
      await page.locator('.timeline').scrollIntoViewIfNeeded()
      assert.equal(await page.locator('audio').evaluate((audio) => audio.paused), false)
    }
    measurements.push(values)
    console.log(
      `${width}×${height}: timeline ${values.sectionHeight}px, next-section gap ${values.nextSectionGap}px`,
    )
    await page.close()
  }
  const shortPage = await browser.newPage({
    viewport: { width: 390, height: 500 },
    reducedMotion: 'reduce',
  })
  await shortPage.goto(origin, { waitUntil: 'networkidle' })
  await shortPage.getByRole('button', { name: 'Enter without music' }).click()
  await shortPage.locator('.intro').waitFor({ state: 'detached' })
  const shortLayout = await shortPage.evaluate(() => {
    const section = document.querySelector('.timeline')
    const sectionBox = section.getBoundingClientRect()
    const rows = [...section.querySelectorAll('.timeline__event')]
    return {
      height: sectionBox.height,
      nextSectionGap: section.nextElementSibling.getBoundingClientRect().top - sectionBox.bottom,
      clippedRows: rows.filter((row) => row.getBoundingClientRect().bottom > sectionBox.bottom + 1).length,
      overflowY: getComputedStyle(section).overflowY,
    }
  })
  assert.ok(shortLayout.height > 500, 'Short viewport should allow the program to grow')
  assert.ok(Math.abs(shortLayout.nextSectionGap) < 1)
  assert.equal(shortLayout.clippedRows, 0)
  assert.ok(!['auto', 'scroll', 'hidden'].includes(shortLayout.overflowY))
  console.log(`390×500: timeline expands naturally to ${Math.round(shortLayout.height)}px`)
  await shortPage.close()
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
} finally {
  await browser.close()
}

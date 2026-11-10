import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const output = fileURLToPath(new URL('../screenshots/02b5/', import.meta.url))
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
    await page.getByRole('button', { name: 'Enter without music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(async () => {
      await document.fonts.ready
      const art = document.querySelector('.gifts__art img')
      art.loading = 'eager'
      await art.decode()
    })
    const result = await page.evaluate(() => {
      const section = document.querySelector('.gifts')
      const sectionBox = section.getBoundingClientRect()
      const art = section.querySelector('.gifts__art img')
      const artBox = art.getBoundingClientRect()
      const contentBox = section.querySelector('.gifts__content').getBoundingClientRect()
      const optionBoxes = [...section.querySelectorAll('.gifts__option')].map((node) =>
        node.getBoundingClientRect(),
      )
      return {
        width: innerWidth,
        viewportHeight: innerHeight,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionBox.height),
        targetHeight: Math.round(innerHeight * 0.8),
        sectionScrollHeight: section.scrollHeight,
        sectionClientHeight: section.clientHeight,
        overflowY: getComputedStyle(section).overflowY,
        previousGap: Math.round(
          sectionBox.top - section.previousElementSibling.getBoundingClientRect().bottom,
        ),
        nextGap: Math.round(section.nextElementSibling.getBoundingClientRect().top - sectionBox.bottom),
        artworkSrc: art.getAttribute('src'),
        artworkNaturalSize: [art.naturalWidth, art.naturalHeight],
        artworkRenderedSize: [Math.round(artBox.width), Math.round(artBox.height)],
        artworkFit: getComputedStyle(art).objectFit,
        contentOrder: artBox.bottom <= contentBox.top + 1 ? 'stacked' : 'side-by-side',
        optionLabels: [...section.querySelectorAll('.gifts__option h3')].map((node) =>
          node.textContent.trim(),
        ),
        pendingLabels: [...section.querySelectorAll('.gifts__pending')].map((node) =>
          node.textContent.trim(),
        ),
        qrImages: section.querySelectorAll('.gifts__qr-square img').length,
        placeholderIcons: section.querySelectorAll('.gifts__qr-square svg').length,
        optionsSideBySide: Math.abs(optionBoxes[0].top - optionBoxes[1].top) < 1,
        clippedContent: [...section.querySelectorAll('.gifts__art, .gifts__message, .gifts__options')]
          .filter((node) => {
            const box = node.getBoundingClientRect()
            return (
              box.top < sectionBox.top - 1 ||
              box.bottom > sectionBox.bottom + 1 ||
              box.left < sectionBox.left - 1 ||
              box.right > sectionBox.right + 1
            )
          })
          .map((node) => node.className),
      }
    })
    assert.equal(result.documentWidth, width)
    assert.equal(result.artworkSrc, '/images/attire/gift%20vector%20element.png')
    assert.deepEqual(result.artworkNaturalSize, [469, 468])
    assert.equal(result.artworkFit, 'contain')
    assert.ok(Math.abs(result.artworkRenderedSize[0] / result.artworkRenderedSize[1] - 469 / 468) < 0.01)
    assert.deepEqual(result.optionLabels, ['Gift Option 01', 'Gift Option 02'])
    assert.deepEqual(result.pendingLabels, ['QR pending', 'QR pending'])
    assert.equal(result.qrImages, 0)
    assert.equal(result.placeholderIcons, 2)
    assert.equal(result.optionsSideBySide, true)
    assert.equal(result.previousGap, 0)
    assert.equal(result.nextGap, 0)
    assert.deepEqual(result.clippedContent, [])
    assert.ok(!['auto', 'scroll', 'hidden'].includes(result.overflowY))
    assert.ok(result.sectionScrollHeight <= result.sectionClientHeight + 1)
    assert.equal(result.contentOrder, width <= 850 ? 'stacked' : 'side-by-side')
    assert.deepEqual(errors, [])
    await page.locator('.gifts').screenshot({
      path: join(output, `gift-${width}x${height}.png`),
      animations: 'disabled',
      style: '.music-control { visibility: hidden !important; }',
    })
    if (width === 390) {
      await page.screenshot({
        path: join(output, 'full-page-390.png'),
        fullPage: true,
        animations: 'disabled',
      })
    }
    measurements.push(result)
    console.log(`${width}×${height}: gift ${result.sectionHeight}px; target ${result.targetHeight}px`)
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
    const section = document.querySelector('.gifts')
    const box = section.getBoundingClientRect()
    const options = section.querySelector('.gifts__options').getBoundingClientRect()
    return {
      height: box.height,
      optionsVisible: options.bottom <= box.bottom + 1,
      nextGap: section.nextElementSibling.getBoundingClientRect().top - box.bottom,
    }
  })
  assert.ok(shortLayout.height > 400, 'Short viewport should allow gift content to grow')
  assert.equal(shortLayout.optionsVisible, true)
  assert.ok(Math.abs(shortLayout.nextGap) < 1)
  console.log(`390×500: gift section expands naturally to ${Math.round(shortLayout.height)}px`)
  await shortPage.close()
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
} finally {
  await browser.close()
}

import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const stage = process.argv[2]
if (!['before', 'after'].includes(stage)) throw new Error('Choose before or after')

const output = fileURLToPath(new URL(`../screenshots/02d2/${stage}/`, import.meta.url))
const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const sizes = [
  [320, 700],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
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
      for (const image of document.images) image.loading = 'eager'
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)))
      await document.fonts.ready
    })

    const values = await page.evaluate(() => {
      const section = document.querySelector('.attire')
      const sponsor = section.querySelector('.attire__group--sponsors')
      const newImage = sponsor.querySelector('.attire__sponsor-artwork img')
      const guestImages = [...section.querySelectorAll('.attire__group--guests .attire__look img')]
      const sectionRect = section.getBoundingClientRect()
      const imageRect = newImage?.getBoundingClientRect()
      return {
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionRect.height),
        oldSponsorImages: sponsor.querySelectorAll('.attire__lineup--sponsors img').length,
        newSponsorImages: newImage ? 1 : 0,
        newImage: newImage
          ? {
              src: new URL(newImage.currentSrc).pathname,
              natural: [newImage.naturalWidth, newImage.naturalHeight],
              rendered: [imageRect.width, imageRect.height],
              withinSection: imageRect.left >= 0 && imageRect.right <= innerWidth + 1,
              loaded: newImage.complete && newImage.naturalWidth > 0,
            }
          : null,
        sponsorLabels: [...sponsor.querySelectorAll('.attire__legend-item')].map((item) =>
          item.innerText.replace(/\s+/g, ' ').trim(),
        ),
        guestImages: guestImages.map((image) => ({
          src: new URL(image.currentSrc).pathname,
          loaded: image.complete && image.naturalWidth > 0,
        })),
        guestColors: [...section.querySelectorAll('.attire__guest-color')].map((item) =>
          item.innerText.replace(/\s+/g, ' ').trim(),
        ),
        clipped: [...section.querySelectorAll('h2,h3,h4,strong,small,p')]
          .filter((node) => {
            const rect = node.getBoundingClientRect()
            return rect.left < -1 || rect.right > innerWidth + 1
          })
          .map((node) => node.textContent.trim().slice(0, 50)),
      }
    })
    measurements.push({ width, height, ...values, errors })
    assert.equal(values.documentWidth, width)
    assert.deepEqual(values.clipped, [])
    assert.deepEqual(errors, [])
    assert.equal(values.oldSponsorImages, stage === 'before' ? 2 : 0)
    assert.equal(values.newSponsorImages, stage === 'after' ? 1 : 0)
    assert.deepEqual(values.sponsorLabels, [
      'Ninong / Male Sponsors Deep Mocha #4C3626',
      'Ninang / Female Sponsors Caramel #C49A6C',
    ])
    assert.deepEqual(
      values.guestImages.map((image) => image.src),
      [
        '/images/attire/guest-grey-suit.webp',
        '/images/attire/guest-lavender-gown.webp',
        '/images/attire/guest-yellow-dress.webp',
      ],
    )
    assert.ok(values.guestImages.every((image) => image.loaded))
    assert.deepEqual(values.guestColors, ['Grey #A7A7A7', 'Lavender #C9B4E4', 'Light Yellow #F9E79F'])
    if (stage === 'after') {
      assert.deepEqual(values.newImage.natural, [1447, 1087])
      assert.equal(values.newImage.src, '/images/attire/principal-sponsors-gala.webp')
      assert.ok(values.newImage.loaded && values.newImage.withinSection)
      assert.ok(
        Math.abs(
          values.newImage.rendered[0] / values.newImage.rendered[1] -
            values.newImage.natural[0] / values.newImage.natural[1],
        ) < 0.01,
      )
    }

    if ([390, 1440].includes(width)) {
      for (const [name, selector] of [
        ['attire', '.attire'],
        ['sponsors', '.attire__group--sponsors'],
        ['guests', '.attire__group--guests'],
      ]) {
        await page.locator(selector).screenshot({
          path: join(output, `${name}-${width}.png`),
          animations: 'disabled',
          style: '.music-control { visibility: hidden !important; }',
        })
      }
    }
    console.log(
      `${stage} ${width}px: section ${values.sectionHeight}px; sponsor images ${values.oldSponsorImages}+${values.newSponsorImages}; guests ${values.guestImages.length}`,
    )
    await page.close()
  }
} finally {
  await browser.close()
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
}

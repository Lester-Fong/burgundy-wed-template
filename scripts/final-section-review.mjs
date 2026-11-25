import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const stage = process.argv[2]
if (!['before', 'after'].includes(stage)) throw new Error('Choose before or after')

const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const output = fileURLToPath(new URL(`../screenshots/02e/${stage}/`, import.meta.url))
const sizes =
  stage === 'before'
    ? [
        [390, 844],
        [1440, 900],
      ]
    : [
        [320, 700],
        [390, 844],
        [430, 932],
        [768, 1024],
        [1024, 768],
        [1440, 900],
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
      const image = document.querySelector('.closing__background')
      image.loading = 'eager'
      await image.decode()
    })

    const observation = await page.evaluate(() => {
      const section = document.querySelector('.closing')
      const footer = document.querySelector('.footer')
      const sectionRect = section.getBoundingClientRect()
      const footerRect = footer.getBoundingClientRect()
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(sectionRect.height),
        footerHeight: Math.round(footerRect.height),
        joined: Math.abs(footerRect.top - sectionRect.bottom) < 1,
        heading: section.querySelector('h2')?.textContent.trim(),
        target: section.querySelector('time')?.getAttribute('datetime'),
        countdownUnits: section.querySelectorAll('.closing__unit').length,
        sectionText: section.innerText.replace(/\s+/g, ' ').trim(),
        footerText: footer.innerText.replace(/\s+/g, ' ').trim(),
        brandLink: footer.querySelector('a')?.href ?? null,
        backgroundLoaded: section.querySelector('.closing__background').naturalWidth > 0,
        hasForm: Boolean(section.querySelector('form, input, button')),
        clipped: [
          ...document.querySelectorAll(
            '.closing h2,.closing h3,.closing p,.closing time,.closing strong,.footer p,.footer small',
          ),
        ]
          .filter((element) => {
            const textRange = document.createRange()
            textRange.selectNodeContents(element)
            const rect = textRange.getBoundingClientRect()
            return rect.left < -1 || rect.right > innerWidth + 1
          })
          .map((element) => element.textContent.trim().slice(0, 40)),
      }
    })
    assert.equal(observation.documentWidth, width)
    assert.equal(observation.joined, true)
    assert.deepEqual(errors, [])
    if (stage === 'after') {
      assert.deepEqual(observation.clipped, [])
      assert.equal(observation.countdownUnits, 4)
      assert.equal(observation.target, '2027-02-22T16:00:00+08:00')
      assert.equal(observation.backgroundLoaded, true)
      assert.equal(observation.hasForm, false)
      assert.doesNotMatch(observation.sectionText, /RSVP|confirm your attendance|announced soon/i)
      assert.doesNotMatch(observation.footerText, /client preview|details pending/i)
      assert.match(observation.footerText, /Wedding website crafted by Imbitado/i)
      assert.equal(observation.brandLink, null)
      await page.locator('.footer').scrollIntoViewIfNeeded()
      const musicOverlap = await page.evaluate(() => {
        const control = document.querySelector('.music-control')?.getBoundingClientRect()
        if (!control) return false
        return [...document.querySelectorAll('.footer__monogram,.footer__message,.footer__credit')].some(
          (element) => {
            const textRange = document.createRange()
            textRange.selectNodeContents(element)
            const rect = textRange.getBoundingClientRect()
            return (
              rect.left < control.right &&
              rect.right > control.left &&
              rect.top < control.bottom &&
              rect.bottom > control.top
            )
          },
        )
      })
      assert.equal(musicOverlap, false, `Music control overlaps footer content at ${width}px`)
    }

    if (width === 390 || width === 1440) {
      await page.locator('.closing').screenshot({
        path: join(output, `closing-${width}.png`),
        animations: 'disabled',
      })
      await page.locator('.footer').screenshot({
        path: join(output, `footer-${width}.png`),
        animations: 'disabled',
      })
      await page.evaluate(() => {
        const footer = document.querySelector('.footer')
        window.scrollTo(0, footer.offsetTop - innerHeight / 2)
      })
      await page.screenshot({
        path: join(output, `closing-footer-${width}.png`),
        animations: 'disabled',
      })
    }
    measurements.push({ ...observation, errors })
    console.log(
      `${stage} ${width}px: closing ${observation.sectionHeight}px, footer ${observation.footerHeight}px, target ${observation.target}`,
    )
    await page.close()
  }
} finally {
  await browser.close()
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
}

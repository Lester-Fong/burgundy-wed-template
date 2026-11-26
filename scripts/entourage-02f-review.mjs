import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { weddingContent } from '../src/data/wedding-content.ts'

const origin = process.env.WEDDING_REVIEW_ORIGIN ?? 'http://127.0.0.1:4173/'
const output = fileURLToPath(new URL('../screenshots/02f/', import.meta.url))
const widths = [320, 360, 390, 430, 768, 1024, 1440]
const pairedGroups = weddingContent.entourage.groups.filter((group) => group.layout === 'paired')
mkdirSync(output, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const results = []

try {
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: width < 600 ? 844 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
    await page.locator('.intro').waitFor({ state: 'detached' })
    await page.evaluate(() => document.fonts.ready)

    const observation = await page.evaluate(() => {
      const section = document.querySelector('#entourage')
      const visibleNames = [...section.querySelectorAll('.entourage__name')].filter(
        (element) => element.getClientRects().length,
      )
      const paired = [...section.querySelectorAll('.entourage__group--paired')].map((group) => ({
        id: group.dataset.entourageId,
        mobileDisplay: getComputedStyle(group.querySelector('.entourage__pair-mobile')).display,
        desktopDisplay: getComputedStyle(group.querySelector('.entourage__pair--desktop')).display,
        rows: [...group.querySelectorAll('.entourage__paired-row')].map((row) => {
          const cells = [...row.children]
          const first = cells[0].getBoundingClientRect()
          const second = cells[1].getBoundingClientRect()
          return {
            names: cells.map((cell) => cell.textContent.trim()),
            sameTop: Math.abs(first.top - second.top) < 1,
            separated: first.right <= second.left + 1,
          }
        }),
      }))
      return {
        width: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        sectionHeight: Math.round(section.getBoundingClientRect().height),
        nameCount: visibleNames.length,
        clipped: visibleNames
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return (
              rect.left < -1 || rect.right > innerWidth + 1 || element.scrollWidth > element.clientWidth + 1
            )
          })
          .map((element) => element.textContent.trim()),
        paired,
      }
    })

    assert.equal(observation.documentWidth, width, `${width}px has horizontal page overflow`)
    assert.deepEqual(observation.clipped, [], `${width}px has clipped names`)
    assert.deepEqual(errors, [], `${width}px has browser errors`)
    for (const group of pairedGroups) {
      const rendered = observation.paired.find((item) => item.id === group.id)
      const expected = Array.from(
        { length: Math.max(group.columns[0].people.length, group.columns[1].people.length) },
        (_, index) => [
          group.columns[0].people[index]?.name ?? '',
          group.columns[1].people[index]?.name ?? '',
        ],
      )
      assert.deepEqual(
        rendered.rows.map((row) => row.names),
        expected,
        `${group.id} lost or reordered a pair at ${width}px`,
      )
      if (width < 560) {
        assert.notEqual(rendered.mobileDisplay, 'none')
        assert.equal(rendered.desktopDisplay, 'none')
        assert.ok(rendered.rows.every((row) => row.sameTop && row.separated))
      } else {
        assert.equal(rendered.mobileDisplay, 'none')
        assert.notEqual(rendered.desktopDisplay, 'none')
      }
    }

    if (width < 560) {
      const musicOverlap = await page.evaluate(() => {
        const section = document.querySelector('#entourage')
        window.scrollTo(0, section.offsetTop + section.offsetHeight - innerHeight)
        const control = document.querySelector('.music-control').getBoundingClientRect()
        return [...section.querySelectorAll('.entourage__name')]
          .filter((element) => element.getClientRects().length)
          .some((element) => {
            const text = document.createRange()
            text.selectNodeContents(element)
            const rect = text.getBoundingClientRect()
            return (
              rect.left < control.right &&
              rect.right > control.left &&
              rect.top < control.bottom &&
              rect.bottom > control.top
            )
          })
      })
      assert.equal(musicOverlap, false, `Music control obscures the final entourage names at ${width}px`)
    }

    if (width === 320 || width === 390 || width === 1440) {
      await page
        .locator('[data-entourage-id="principal-sponsors"]')
        .screenshot({ path: join(output, `principal-${width}.png`), animations: 'disabled' })
    }
    if (width === 390) {
      await page
        .locator('[data-entourage-id="secondary-sponsors"]')
        .screenshot({ path: join(output, 'secondary-390.png'), animations: 'disabled' })
      await page
        .locator('[data-entourage-id="wedding-party"]')
        .screenshot({ path: join(output, 'groomsmen-bridesmaids-390.png'), animations: 'disabled' })
    }
    if (width === 390 || width === 1440) {
      await page.locator('#entourage').screenshot({
        path: join(output, `full-entourage-${width}.png`),
        animations: 'disabled',
        timeout: 60_000,
      })
    }

    results.push({ ...observation, errors })
    console.log(`${width}px: ${observation.nameCount} visible names, section ${observation.sectionHeight}px`)
    await page.close()
  }
} finally {
  await browser.close()
  writeFileSync(join(output, 'measurements.json'), JSON.stringify(results, null, 2))
}

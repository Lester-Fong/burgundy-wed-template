import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'
import { safeHexColor } from '../src/utils/colors.ts'

test('fashion palette values accept only six-digit hex colors', () => {
  assert.equal(safeHexColor('#A67C5E'), '#A67C5E')
  assert.equal(safeHexColor('var(--unsafe)'), '#8D7768')
  assert.equal(safeHexColor('#123'), '#8D7768')
})

test('changing a color prop recolors garment fabric only and four variants render', async () => {
  const vite = await createServer({
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
    server: { host: '127.0.0.1', port: 0, hmr: false },
  })
  await vite.listen()
  const browser = await chromium.launch({
    executablePath:
      process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
  })
  try {
    const page = await browser.newPage({ viewport: { width: 900, height: 720 } })
    await page.goto(new URL('tests/fixtures/fashion-figure.html', vite.resolvedUrls.local[0]).toString())
    const first = page.locator('.comparison .fashion-figure').first()
    await first.waitFor()
    assert.equal(await page.locator('.variants .fashion-figure').count(), 4)
    const variants = await page
      .locator('.variants .fashion-figure')
      .evaluateAll((items) => items.map((item) => item.getAttribute('class')))
    for (const variant of ['gown', 'cocktail-dress', 'suit', 'barong'])
      assert.ok(variants.some((name) => name.includes(`fashion-figure--${variant}`)))
    const colors = async () =>
      first.evaluate((element) => ({
        garment: getComputedStyle(element.querySelector('.garment-primary')).fill,
        secondary: getComputedStyle(element.querySelector('.garment-secondary')).fill,
        skin: getComputedStyle(element.querySelector('.figure-skin')).fill,
        hair: getComputedStyle(element.querySelector('.figure-hair')).fill,
        outline: getComputedStyle(element.querySelector('.figure-outline')).stroke,
      }))
    const before = await colors()
    assert.equal(before.garment, 'rgb(166, 124, 94)')
    const second = await page
      .locator('.comparison .fashion-figure')
      .last()
      .evaluate((element) => getComputedStyle(element.querySelector('.garment-primary')).fill)
    assert.equal(second, 'rgb(201, 180, 228)')
    const folder = fileURLToPath(new URL('../screenshots/02b3/', import.meta.url))
    mkdirSync(folder, { recursive: true })
    await page.screenshot({
      path: join(folder, 'color-configuration-comparison.png'),
      fullPage: true,
    })
    await page.evaluate(() => window.setOutfitColor('#87CEEB'))
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('.comparison .garment-primary')).fill ===
        'rgb(135, 206, 235)',
    )
    const after = await colors()
    assert.equal(after.garment, 'rgb(135, 206, 235)')
    assert.equal(after.secondary, before.secondary)
    assert.equal(after.skin, before.skin)
    assert.equal(after.hair, before.hair)
    assert.equal(after.outline, before.outline)
    await page.evaluate(() => window.setOutfitColor('url(javascript:alert(1))'))
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('.comparison .garment-primary')).fill ===
        'rgb(141, 119, 104)',
    )
    await page.close()
  } finally {
    await browser.close()
    await vite.close()
  }
})

import assert from 'node:assert/strict'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import jsQR from 'jsqr'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createServer } from 'vite'

test('venues keep optional art and parking notes independent of location links', async () => {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false },
  })
  try {
    const { default: VenuesSection } = await vite.ssrLoadModule(
      '/src/templates/BurgundyWedding/components/VenuesSection.vue',
    )
    const content = {
      parkingNote: 'Parking directions will be confirmed.',
      items: [
        {
          kind: 'The ceremony',
          name: 'Test Chapel',
          address: 'Address pending',
          time: '4:00 PM',
          illustration: { src: '/images/template/venue-ceremony-concept.svg', alt: '' },
          parkingNote: 'Use the east entrance.',
        },
        { kind: 'The reception', name: 'Test Hall', address: 'Address pending' },
      ],
    }
    const html = await renderToString(createSSRApp(VenuesSection, { content }))
    assert.match(html, /<h2 id="venues-title"[^>]*>The Venues<\/h2>/)
    assert.match(html, /Test Chapel/)
    assert.match(html, /Test Hall/)
    assert.match(html, /Parking directions will be confirmed/)
    assert.match(html, /Use the east entrance/)
    assert.equal((html.match(/venue-panel__art/g) ?? []).length, 1)
    assert.equal((html.match(/venue-location__pending/g) ?? []).length, 2)
    assert.doesNotMatch(html, /href="https:\/\/www\.google\.com\/maps/)
    const single = await renderToString(
      createSSRApp(VenuesSection, { content: { items: [content.items[0]] } }),
    )
    assert.match(single, /venues__grid--single/)
  } finally {
    await vite.close()
  }
})

test('verified Google Maps URL produces a scannable QR and safe matching button', async () => {
  const vite = await createServer({
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: ['qrcode'] },
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
    const baseUrl = vite.resolvedUrls.local[0]
    const context = await browser.newContext({ viewport: { width: 720, height: 420 } })
    await context.route('https://www.google.com/maps/**', (route) =>
      route.fulfill({ status: 200, body: '<title>Test map destination</title>' }),
    )
    const page = await context.newPage()
    page.on('pageerror', (error) => console.error(`Venue fixture page error: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') console.error(`Venue fixture console: ${message.text()}`)
    })
    await page.goto(new URL('tests/fixtures/venue-location.html', baseUrl).toString(), {
      waitUntil: 'networkidle',
    })
    const image = page.locator('#valid .venue-location__qr img')
    await image.waitFor({ state: 'visible' })
    const pixels = await image.evaluate((element) => {
      const canvas = document.createElement('canvas')
      canvas.width = element.naturalWidth
      canvas.height = element.naturalHeight
      const context = canvas.getContext('2d')
      context.drawImage(element, 0, 0)
      return {
        width: canvas.width,
        height: canvas.height,
        data: [...context.getImageData(0, 0, canvas.width, canvas.height).data],
      }
    })
    const decoded = jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height)?.data
    const link = page.locator('#valid .venue-location__button')
    assert.equal(decoded, 'https://www.google.com/maps/search/?api=1&query=Test+Venue')
    assert.equal(await link.getAttribute('href'), decoded)
    assert.equal(await image.getAttribute('data-destination'), decoded)
    assert.equal(await link.getAttribute('target'), '_blank')
    assert.equal(await link.getAttribute('rel'), 'noopener noreferrer')
    assert.equal(await page.locator('#invalid .venue-location__pending').count(), 1)
    assert.equal(await page.locator('#invalid a').count(), 0)
    const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()])
    await popup.waitForLoadState('domcontentloaded')
    assert.equal(popup.url(), decoded)

    const folder = fileURLToPath(new URL('../screenshots/02b2-after/', import.meta.url))
    mkdirSync(folder, { recursive: true })
    await page.screenshot({ path: join(folder, 'verified-test-qr-and-link.png') })
    await context.close()
  } finally {
    await browser.close()
    await vite.close()
  }
})

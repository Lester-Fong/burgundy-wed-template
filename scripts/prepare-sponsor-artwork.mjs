import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = join(root, 'artwork', '02d2', 'Deep Mocha and Caramel Gala Lineup.png')
const destination = join(root, 'public', 'images', 'attire', 'principal-sponsors-gala.webp')
const png = readFileSync(source)
const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

try {
  const page = await browser.newPage()
  const result = await page.evaluate(async (base64) => {
    const image = new Image()
    image.src = `data:image/png;base64,${base64}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas 2D context unavailable')
    context.drawImage(image, 0, 0)
    return {
      width: canvas.width,
      height: canvas.height,
      transparentCorner: context.getImageData(0, 0, 1, 1).data[3] === 0,
      webp: canvas.toDataURL('image/webp', 0.98),
    }
  }, png.toString('base64'))
  assert.deepEqual([result.width, result.height], [1447, 1087])
  assert.equal(result.transparentCorner, true)
  assert.ok(result.webp.startsWith('data:image/webp;base64,'))
  const webp = Buffer.from(result.webp.slice('data:image/webp;base64,'.length), 'base64')
  writeFileSync(destination, webp)
  console.log(`${png.length} byte PNG -> ${webp.length} byte WebP at ${result.width}x${result.height}`)
} finally {
  await browser.close()
}

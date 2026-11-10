import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = join(root, 'public', 'images', 'attire')
mkdirSync(output, { recursive: true })

const assets = [
  ['artwork/02b3a/gown-taupe-watercolor.png', 'party-taupe-gown.webp'],
  ['artwork/02b3b/originals/party-sky-suit.png', 'party-sky-suit.webp'],
  ['artwork/02b3b/originals/party-sky-gown.png', 'party-sky-gown.webp'],
  ['artwork/02b3a/suit-mocha-watercolor.png', 'party-mocha-suit.webp'],
  ['artwork/02b3b/originals/party-caramel-gown.png', 'party-caramel-gown.webp'],
  ['artwork/02b3b/originals/guest-grey-suit.png', 'guest-grey-suit.webp'],
  ['artwork/02b3b/originals/guest-lavender-gown.png', 'guest-lavender-gown.webp'],
  ['artwork/02b3b/originals/guest-yellow-dress.png', 'guest-yellow-dress.webp'],
]

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

try {
  const page = await browser.newPage()
  for (const [source, filename] of assets) {
    const input = readFileSync(join(root, source))
    const dataUrl = `data:image/png;base64,${input.toString('base64')}`
    const result = await page.evaluate(async (url) => {
      const image = new Image()
      image.src = url
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = 768
      canvas.height = 1152
      const context = canvas.getContext('2d')
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      // Clear nearly invisible edge noise from the generated alpha channel.
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      for (let index = 3; index < pixels.data.length; index += 4) {
        if (pixels.data[index] < 16) pixels.data[index] = 0
      }
      context.putImageData(pixels, 0, 0)
      const topLeftAlpha = context.getImageData(0, 0, 1, 1).data[3]
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        topLeftAlpha,
        webp: canvas.toDataURL('image/webp', 0.88),
      }
    }, dataUrl)
    assert.equal(result.width, 1024)
    assert.equal(result.height, 1536)
    assert.equal(result.topLeftAlpha, 0)
    assert.ok(result.webp.startsWith('data:image/webp;base64,'))
    const webp = Buffer.from(result.webp.slice('data:image/webp;base64,'.length), 'base64')
    writeFileSync(join(output, filename), webp)
    console.log(`${filename}: ${input.length} -> ${webp.length} bytes`)
  }
} finally {
  await browser.close()
}

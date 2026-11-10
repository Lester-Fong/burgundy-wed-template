import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const source = fileURLToPath(new URL('../artwork/02c1/intro-florals-source.png', import.meta.url))
const target = fileURLToPath(new URL('../public/images/template/intro-florals.webp', import.meta.url))
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
})
try {
  const page = await browser.newPage()
  const encoded = await page.evaluate(async (base64) => {
    const image = new Image()
    image.src = `data:image/png;base64,${base64}`
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 960
    canvas.height = Math.round((image.height / image.width) * canvas.width)
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/webp', 0.86).split(',')[1]
  }, readFileSync(source).toString('base64'))
  writeFileSync(target, Buffer.from(encoded, 'base64'))
  console.log(`Wrote ${target}`)
} finally {
  await browser.close()
}

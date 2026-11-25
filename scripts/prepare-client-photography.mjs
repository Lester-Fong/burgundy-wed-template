import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

// Unchanged originals stay outside public/ so Vite cannot publish their metadata.
// Canvas applies each approved crop and resize; CSS handles final viewport framing.
const originals = new URL('../artwork/client-photography-originals/', import.meta.url)
const output = new URL('../public/images/client/', import.meta.url)
const edgePath =
  process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const photos = [
  {
    number: 1,
    mobile: 900,
    desktop: 1800,
    desktopCrop: { x: 800, y: 1100, width: 4450, height: 7182 },
  },
  { number: 2, mobile: 900, desktop: 1800 },
  {
    number: 3,
    mobile: 900,
    desktop: 1400,
    mobileCrop: { x: 750, y: 450, width: 2274, height: 3582 },
    desktopCrop: { x: 750, y: 450, width: 2274, height: 3582 },
  },
  { number: 4, mobile: 900, desktop: 1600 },
  {
    number: 5,
    mobile: 900,
    desktop: 1600,
    mobileCrop: { x: 500, y: 2000, width: 5300, height: 6064 },
    desktopCrop: { x: 500, y: 2000, width: 5300, height: 6064 },
  },
  {
    number: 6,
    mobile: 900,
    desktop: 1500,
    mobileCrop: { x: 1100, y: 2800, width: 4000, height: 5292 },
    desktopCrop: { x: 1100, y: 2800, width: 4000, height: 5292 },
  },
]

mkdirSync(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: edgePath,
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

try {
  const page = await browser.newPage()
  for (const photo of photos) {
    const original = readFileSync(new URL(`${photo.number}.jpeg`, originals))
    const dataUrl = `data:image/jpeg;base64,${original.toString('base64')}`
    const variants = await page.evaluate(
      async ({ dataUrl, widths }) => {
        const image = new Image()
        image.src = dataUrl
        await image.decode()
        return widths.map(({ label, width, crop }) => {
          const canvas = document.createElement('canvas')
          const frame = crop ?? {
            x: 0,
            y: 0,
            width: image.naturalWidth,
            height: image.naturalHeight,
          }
          if (
            frame.x < 0 ||
            frame.y < 0 ||
            frame.x + frame.width > image.naturalWidth ||
            frame.y + frame.height > image.naturalHeight
          )
            throw new Error('Crop extends beyond source photograph')
          canvas.width = width
          canvas.height = Math.round((frame.height / frame.width) * width)
          const context = canvas.getContext('2d', { alpha: false })
          if (!context) throw new Error('Canvas 2D context unavailable')
          context.imageSmoothingEnabled = true
          context.imageSmoothingQuality = 'high'
          context.drawImage(
            image,
            frame.x,
            frame.y,
            frame.width,
            frame.height,
            0,
            0,
            canvas.width,
            canvas.height,
          )
          const encoded = canvas.toDataURL('image/webp', 0.83)
          if (!encoded.startsWith('data:image/webp;base64,')) throw new Error('Browser did not encode WebP')
          return { label, width: canvas.width, height: canvas.height, encoded }
        })
      },
      {
        dataUrl,
        widths: [
          { label: 'mobile', width: photo.mobile, crop: photo.mobileCrop },
          { label: 'desktop', width: photo.desktop, crop: photo.desktopCrop },
        ],
      },
    )
    for (const variant of variants) {
      const name = `photo-${photo.number}-${variant.label}.webp`
      const bytes = Buffer.from(variant.encoded.split(',')[1], 'base64')
      writeFileSync(new URL(name, output), bytes)
      console.log(`${name}: ${variant.width}x${variant.height}, ${Math.round(bytes.length / 1024)} KiB`)
    }
  }
  await page.close()
} finally {
  await browser.close()
}

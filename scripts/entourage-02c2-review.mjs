import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const phase = process.argv[2]
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after')

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:5173/'
const folder = fileURLToPath(new URL('../screenshots/02c2/', import.meta.url))
mkdirSync(folder, { recursive: true })

const browser = await chromium.launch({
  executablePath:
    process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})

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
const expectedOrder = ['honor-attendants', 'wedding-party', 'secondary-sponsors', 'bearers']
const results = []
const failures = []

for (const [width, height] of sizes) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)

  const result = await page.evaluate(() => {
    const section = document.querySelector('#entourage')
    const groups = [...section.querySelectorAll('.entourage__group')]
    const names = [...section.querySelectorAll('.entourage__name')]
    const pairs = [...section.querySelectorAll('.entourage__pair')]
    const rect = (element) => element.getBoundingClientRect()
    const style = (selector) => {
      const element = section.querySelector(selector)
      if (!element) return null
      const css = getComputedStyle(element)
      return {
        fontFamily: css.fontFamily,
        fontSize: css.fontSize,
        lineHeight: css.lineHeight,
        letterSpacing: css.letterSpacing,
        fontWeight: css.fontWeight,
        marginTop: css.marginTop,
        marginBottom: css.marginBottom,
      }
    }
    const groupRects = groups.map(rect)
    const sectionCss = getComputedStyle(section)
    return {
      width: innerWidth,
      height: innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      sectionHeight: Math.round(rect(section).height),
      order: groups.map((element) => element.dataset.entourageId),
      names: names.map((element) => element.textContent.trim()),
      descriptions: [...section.querySelectorAll('.entourage__description')].map((element) =>
        element.textContent.trim(),
      ),
      pairColumns: pairs.map((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length),
      clippedText: [...section.querySelectorAll('h2,h3,h4,.entourage__name,.entourage__description')]
        .filter((element) => rect(element).left < -1 || rect(element).right > innerWidth + 1)
        .map((element) => element.textContent.trim()),
      groupOverlap: groupRects.some((box, index) => index && box.top < groupRects[index - 1].bottom - 1),
      groupGaps: groupRects.slice(1).map((box, index) => Math.round(box.top - groupRects[index].bottom)),
      typography: {
        title: style('#entourage-title'),
        intro: style('.entourage__intro'),
        role: style('.entourage__role'),
        subrole: style('.entourage__role--sub'),
        name: style('.entourage__name'),
        description: style('.entourage__description'),
        paddingTop: sectionCss.paddingTop,
        paddingBottom: sectionCss.paddingBottom,
      },
    }
  })

  results.push(result)
  if (result.documentWidth > width + 1) failures.push(`${width}px horizontal overflow`)
  if (result.clippedText.length) failures.push(`${width}px clipped text: ${result.clippedText.join(', ')}`)
  if (result.order.join() !== expectedOrder.join()) failures.push(`${width}px group order changed`)
  if (result.groupOverlap) failures.push(`${width}px groups overlap`)
  if (errors.length) failures.push(`${width}px page errors: ${errors.join('; ')}`)
  if ([320, 390, 1440].includes(width)) {
    await page.locator('#entourage').screenshot({ path: join(folder, `${phase}-full-${width}.png`) })
  }
  if (width === 1440) {
    const section = page.locator('#entourage')
    const box = await section.boundingBox()
    const pageY = await section.evaluate((element) => element.getBoundingClientRect().top + scrollY)
    await page.screenshot({
      path: join(folder, `${phase}-heading-1440.png`),
      clip: { x: 0, y: pageY, width, height: Math.min(900, box.height) },
      fullPage: true,
    })
  }
  console.log(`${width}x${height}: ${result.names.length} names, section ${result.sectionHeight}px`)
  await context.close()
}

if (phase === 'after') {
  const before = JSON.parse(readFileSync(join(folder, 'before.json'), 'utf8')).results
  for (let index = 0; index < results.length; index++) {
    if (results[index].names.join() !== before[index].names.join())
      failures.push(`${results[index].width}px names or order changed`)
  }

  const comparison = await browser.newPage({ viewport: { width: 1440, height: 490 } })
  await comparison.setContent('<canvas id="comparison" width="1440" height="490"></canvas>')
  const beforeImage = `data:image/png;base64,${readFileSync(join(folder, 'before-full-1440.png')).toString('base64')}`
  const afterImage = `data:image/png;base64,${readFileSync(join(folder, 'after-full-1440.png')).toString('base64')}`
  const imageData = await comparison.evaluate(
    async ([beforeSource, afterSource]) => {
      const load = (src) =>
        new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = reject
          image.src = src
        })
      const [beforeImage, afterImage] = await Promise.all([load(beforeSource), load(afterSource)])
      const canvas = document.querySelector('#comparison')
      const context = canvas.getContext('2d')
      context.fillStyle = '#f8f3eb'
      context.fillRect(0, 0, 1440, 490)
      context.fillStyle = '#650303'
      context.font = '600 18px Georgia'
      context.fillText('BEFORE · 1440 PX', 16, 27)
      context.fillText('AFTER · 1440 PX', 736, 27)
      context.drawImage(beforeImage, 0, 0, 1440, 900, 0, 40, 720, 450)
      context.drawImage(afterImage, 0, 0, 1440, 900, 720, 40, 720, 450)
      return canvas.toDataURL('image/png')
    },
    [beforeImage, afterImage],
  )
  writeFileSync(join(folder, 'before-after-1440.png'), Buffer.from(imageData.split(',')[1], 'base64'))
  await comparison.close()
}

writeFileSync(join(folder, `${phase}.json`), JSON.stringify({ results, failures }, null, 2))
await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Entourage ${phase} checks passed`)
}

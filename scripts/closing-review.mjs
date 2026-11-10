import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const baseURL = process.env.CLOSING_QA_URL ?? 'http://127.0.0.1:5174/'
const screenshotDir = fileURLToPath(new URL('../screenshots/02b8-type-refine/', import.meta.url))
mkdirSync(screenshotDir, { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const failures = []
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

for (const [width, height] of sizes) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (error) => failures.push(`${width}px page error: ${error.message}`))
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(async () => {
    await document.fonts.ready
    const image = document.querySelector('.closing__background')
    image.loading = 'eager'
    await image.decode()
  })
  const closing = page.locator('.closing')
  const metrics = await closing.evaluate((section) => {
    const rect = section.getBoundingClientRect()
    const inner = section.querySelector('.closing__inner').getBoundingClientRect()
    const image = section.querySelector('.closing__background')
    const items = [...section.querySelectorAll('.closing__unit')]
    const titleStyle = getComputedStyle(section.querySelector('.closing__opening h2'))
    const bodyStyle = getComputedStyle(section.querySelector('.closing__opening p'))
    const numberStyle = getComputedStyle(section.querySelector('.closing__unit strong'))
    return {
      height: Math.round(rect.height),
      viewportHeight: innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      typography: {
        titleSize: titleStyle.fontSize,
        titleColor: titleStyle.color,
        bodySize: bodyStyle.fontSize,
        bodyColor: bodyStyle.color,
        numberSize: numberStyle.fontSize,
      },
      imageLoaded: image.complete && image.naturalWidth > 0,
      imageSource: image.getAttribute('src'),
      targetDate: section.querySelector('time')?.getAttribute('datetime'),
      countdownUnits: items.map((item) => ({
        value: item.querySelector('strong')?.textContent,
        label: item.querySelector('span')?.textContent,
      })),
      noForm: !section.querySelector('form,input,textarea,button'),
      footerFollows: section.nextElementSibling?.classList.contains('footer'),
      contentInside: inner.top >= rect.top - 1 && inner.bottom <= rect.bottom + 1,
      internalOverflow: section.scrollHeight > section.clientHeight + 1,
      visibleWithReducedMotion: getComputedStyle(section.querySelector('.closing__opening')).opacity === '1',
      clipped: [...section.querySelectorAll('h2,h3,p,time,strong,span')]
        .filter((element) => {
          const bounds = element.getBoundingClientRect()
          return bounds.width > 0 && (bounds.left < -1 || bounds.right > innerWidth + 1)
        })
        .map((element) => element.textContent.trim().slice(0, 50)),
    }
  })
  await closing.screenshot({ path: join(screenshotDir, `closing-${width}-full.png`), animations: 'disabled' })
  await closing.evaluate((element) => window.scrollTo({ top: element.offsetTop, behavior: 'instant' }))
  await page.screenshot({
    path: join(screenshotDir, `closing-${width}-viewport.png`),
    animations: 'disabled',
  })
  if (width === 390 || width === 1440)
    await page.screenshot({
      path: join(screenshotDir, `page-${width}-full.png`),
      fullPage: true,
      animations: 'disabled',
    })
  console.log(`${width}x${height}: ${JSON.stringify(metrics)}`)
  if (metrics.documentWidth > width + 1 || metrics.clipped.length || metrics.internalOverflow)
    failures.push(`${width}px: closing layout overflow`)
  const expectedTitleSize = width < 360 ? '36px' : '40px'
  const expectedBodySize = width <= 600 ? '16px' : '20px'
  if (
    metrics.typography.titleSize !== expectedTitleSize ||
    metrics.typography.bodySize !== expectedBodySize ||
    metrics.typography.titleColor !== 'rgb(251, 215, 152)' ||
    metrics.typography.bodyColor !== 'rgb(251, 215, 152)'
  )
    failures.push(`${width}px: closing typography differs from approved scale or color`)
  if (!metrics.imageLoaded || metrics.imageSource !== '/images/template/bloody-red.jpg')
    failures.push(`${width}px: closing image missing`)
  if (metrics.targetDate !== '2027-02-22') failures.push(`${width}px: wrong wedding date`)
  if (metrics.countdownUnits.map((unit) => unit.label).join(',') !== 'Days,Hours,Minutes,Seconds')
    failures.push(`${width}px: countdown units missing`)
  if (
    !metrics.noForm ||
    !metrics.footerFollows ||
    !metrics.contentInside ||
    !metrics.visibleWithReducedMotion
  )
    failures.push(`${width}px: closing structure invalid`)
  if (width >= 768 && metrics.height < height)
    failures.push(`${width}px: closing panel below viewport height`)
  await context.close()
}

for (const [time, expected] of [
  ['2027-02-22T10:00:00+08:00', 'Today is our wedding day.'],
  ['2027-02-23T10:00:00+08:00', 'Thank you for celebrating our wedding day.'],
]) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.clock.install({ time: new Date(time) })
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  const message = await page.locator('.closing__complete').textContent()
  if (message?.trim() !== expected) failures.push(`${time}: completed state was ${message}`)
  if ((await page.locator('.closing__target-note').count()) !== 0)
    failures.push(`${time}: pending countdown note remained after completion`)
  await context.close()
}

await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}

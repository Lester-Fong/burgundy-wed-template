import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const mode = process.argv[2] === 'before' ? 'before' : 'after'
const baseURL = process.env.FAQ_QA_URL ?? 'http://127.0.0.1:5174/'
const screenshotDir = new URL('../screenshots/02b8-20/', import.meta.url).pathname.replace(
  /^\/(?=[A-Za-z]:)/,
  '',
)
mkdirSync(screenshotDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
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
const failures = []

for (const [width, height] of sizes) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (error) => failures.push(`${width}px page error: ${error.message}`))
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(() => document.fonts.ready)
  const faq = page.locator('.faqs')
  const metrics = await faq.evaluate((section) => {
    const heading = section.querySelector('h2')
    const items = [...section.querySelectorAll('.faq')]
    const question = section.querySelector('.faq__question, summary')
    const answer = section.querySelector('.faq__answer, .faq > p')
    const style = (element) => {
      const css = getComputedStyle(element)
      return {
        fontSize: css.fontSize,
        lineHeight: css.lineHeight,
        fontFamily: css.fontFamily,
        color: css.color,
      }
    }
    return {
      height: Math.round(section.getBoundingClientRect().height),
      heading: style(heading),
      question: style(question),
      answer: style(answer),
      itemCount: items.length,
      detailsCount: section.querySelectorAll('details,summary').length,
      heartCounts: items.map((item) => item.querySelectorAll('.faq__heart').length),
      answers: items.map((item) => {
        const node = item.querySelector('.faq__answer, p')
        return {
          text: node?.textContent?.trim(),
          visible: !!node && getComputedStyle(node).display !== 'none',
        }
      }),
      documentWidth: document.documentElement.scrollWidth,
      clipped: [...section.querySelectorAll('h2,h3,p')]
        .filter((element) => {
          const rect = element.getBoundingClientRect()
          return rect.left < -1 || rect.right > innerWidth + 1
        })
        .map((element) => element.textContent.trim().slice(0, 50)),
    }
  })
  const label = `${mode}-${width}`
  // Isolate the FAQ for visual review; full-page QA retains the floating music control.
  await page.addStyleTag({ content: '.music-control { visibility: hidden !important; }' })
  await faq.screenshot({ path: join(screenshotDir, `${label}-full.png`), animations: 'disabled' })
  await faq.evaluate((element) => window.scrollTo({ top: element.offsetTop, behavior: 'instant' }))
  await page.screenshot({ path: join(screenshotDir, `${label}-viewport.png`), animations: 'disabled' })
  console.log(`${width}x${height}: ${JSON.stringify(metrics)}`)
  if (mode === 'after') {
    if (metrics.documentWidth > width + 1 || metrics.clipped.length)
      failures.push(`${width}px overflow: ${JSON.stringify(metrics.clipped)}`)
    if (metrics.detailsCount || metrics.itemCount !== 4 || metrics.heartCounts.some((count) => count !== 1))
      failures.push(`${width}px FAQ structure invalid`)
    if (metrics.answers.some((answer) => !answer.visible || !answer.text))
      failures.push(`${width}px FAQ answer missing or hidden`)
    if (metrics.answer.fontSize !== '16px')
      failures.push(`${width}px answer font is ${metrics.answer.fontSize}`)
    if (width >= 768 && metrics.question.fontSize !== '20px')
      failures.push(`${width}px question font is ${metrics.question.fontSize}`)
    if (
      width < 768 &&
      (parseFloat(metrics.question.fontSize) < 18 || parseFloat(metrics.question.fontSize) > 20)
    )
      failures.push(`${width}px mobile question font is ${metrics.question.fontSize}`)
    if (metrics.question.color !== 'rgb(81, 9, 27)' || metrics.answer.color !== 'rgb(81, 9, 27)')
      failures.push(`${width}px burgundy typography changed`)
    if (width === 320) {
      const wraps = await faq.locator('.faqs__title').evaluate((title) => {
        const lineHeight = parseFloat(getComputedStyle(title).lineHeight)
        return Math.round(title.getBoundingClientRect().height / lineHeight)
      })
      if (wraps !== 2) failures.push(`320px heading spans ${wraps} lines`)
      const firstQuestion = faq.locator('.faq__question').first()
      await firstQuestion.evaluate((element) => {
        element.textContent =
          'How can guests with very long names find all the details for the wedding celebration?'
      })
      const longQuestionOverflow = await firstQuestion.evaluate(
        (element) => element.getBoundingClientRect().right > innerWidth + 1,
      )
      if (longQuestionOverflow || (await page.evaluate(() => document.documentElement.scrollWidth)) > width)
        failures.push('Long FAQ question caused overflow at 320px')
    }
    const reducedOpacity = await faq
      .locator('.faq')
      .first()
      .evaluate((item) => getComputedStyle(item).opacity)
    if (reducedOpacity !== '1') failures.push(`${width}px reduced-motion FAQ item was hidden`)
  }
  await context.close()
}

if (mode === 'after') {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Enter without music' }).click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  const item = page.locator('.faqs .faq').first()
  const initialOpacity = await item.evaluate((element) => getComputedStyle(element).opacity)
  if (initialOpacity !== '0') failures.push(`FAQ reveal initial opacity was ${initialOpacity}`)
  await item.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.faqs .faq')).opacity === '1')
  await context.close()

  const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const fallbackPage = await fallbackContext.newPage()
  await fallbackPage.addInitScript(() => {
    window.IntersectionObserver = undefined
  })
  await fallbackPage.goto(baseURL, { waitUntil: 'networkidle' })
  await fallbackPage.getByRole('button', { name: 'Enter without music' }).click()
  await fallbackPage.locator('.intro').waitFor({ state: 'detached' })
  const fallbackOpacity = await fallbackPage
    .locator('.faqs .faq')
    .first()
    .evaluate((element) => getComputedStyle(element).opacity)
  if (fallbackOpacity !== '1') failures.push('FAQ hidden without IntersectionObserver')
  await fallbackContext.close()
}

await browser.close()
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, webkit } from 'playwright-core'

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:4173/'
const screenshotDir = new URL('../screenshots/', import.meta.url)
mkdirSync(screenshotDir, { recursive: true })
const screenshotPath = fileURLToPath(screenshotDir)
const edgePath =
  process.env.WEDDING_BROWSER_PATH ?? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
let browser
let browserName = 'Edge'

try {
  browser = await chromium.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
  })
} catch (error) {
  console.warn(`Edge launch unavailable: ${error.message.split('\n')[0]}`)
  browser = await webkit.launch({ headless: true })
  browserName = 'WebKit'
}

const widths = [320, 360, 390, 393, 430, 768, 1024, 1440, 1920]
const failures = []
const errors = []

for (const width of widths) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : width === 1920 ? 1080 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(`${width}px: ${error.message}`))
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  const introFit = await page.locator('.intro').evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    namesOverflow:
      element.querySelector('.intro__names').scrollWidth >
      element.querySelector('.intro__names').clientWidth + 1,
  }))
  if (introFit.scrollHeight > introFit.clientHeight + 1)
    failures.push(`${width}px: envelope scrolls despite standard viewport height`)
  if (introFit.scrollWidth > introFit.clientWidth + 1 || introFit.namesOverflow)
    failures.push(`${width}px: envelope has horizontal overflow`)
  if (await page.locator('audio').evaluate((element) => !element.paused))
    failures.push(`${width}px: music started before opening gesture`)
  if (width === 390) await page.screenshot({ path: join(screenshotPath, 'intro-390.png') })
  await page.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
  await page.getByRole('main').waitFor({ state: 'visible' })
  await page.locator('.intro').waitFor({ state: 'detached' })
  await page.evaluate(async () => {
    const images = [...document.images]
    for (const img of images) img.loading = 'eager'
    await Promise.all(images.map((img) => img.decode().catch(() => undefined)))
    await document.fonts.ready
  })
  const geometry = await page.evaluate(() => ({
    viewport: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    clipped: [...document.querySelectorAll('h1,h2,h3,button,summary')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1)
      })
      .map((element) => element.textContent.trim().replace(/\s+/g, ' ').slice(0, 55)),
    missingImages: [...document.images]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.src),
    heroOutOfView: [...document.querySelectorAll('.hero__monogram,.hero__names,.hero__date')]
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.left < -1 || rect.right > innerWidth + 1 || rect.top < -1 || rect.bottom > innerHeight + 1
      })
      .map((element) => element.className),
    heroNamesOverflow:
      document.querySelector('.hero__names').scrollWidth >
      document.querySelector('.hero__names').clientWidth + 1,
    dividerCount: document.querySelectorAll('.photo-divider').length,
    placeholderPhotoLabels: document.querySelectorAll('.photo-divider__placeholder-note').length,
    heroPlaceholderLabel: !!document.querySelector('.hero__placeholder-note'),
    dividerCaptions: [...document.querySelectorAll('.photo-divider')].filter(
      (element) =>
        (element.textContent.trim() && element.textContent.trim() !== 'Illustrative photography') ||
        element.querySelector('.photo-divider__rule'),
    ).length,
    welcomeHeight: document.querySelector('.welcome')?.getBoundingClientRect().height ?? 0,
    welcomeOrder:
      document.querySelector('.hero')?.nextElementSibling?.matches('.welcome') &&
      document.querySelector('.welcome')?.nextElementSibling?.matches('.photo-divider'),
    welcomeParagraphs: document.querySelectorAll('.welcome__message p').length,
    welcomeButtonSize: document.querySelector('.welcome__music-button')?.getBoundingClientRect().width ?? 0,
    audioCount: document.querySelectorAll('audio').length,
    staleHeroTransition: !!document.querySelector('.hero-transition'),
    unexpectedNavigation: !!document.querySelector('.hero nav, .hero header'),
  }))
  if (
    geometry.documentWidth > width + 1 ||
    geometry.clipped.length ||
    geometry.missingImages.length ||
    geometry.heroOutOfView.length ||
    geometry.heroNamesOverflow ||
    geometry.dividerCount !== 4 ||
    geometry.placeholderPhotoLabels !== 0 ||
    geometry.heroPlaceholderLabel ||
    geometry.dividerCaptions ||
    geometry.welcomeHeight < 340 ||
    !geometry.welcomeOrder ||
    geometry.welcomeParagraphs !== 2 ||
    geometry.welcomeButtonSize < 44 ||
    geometry.audioCount !== 1 ||
    geometry.staleHeroTransition ||
    geometry.unexpectedNavigation
  )
    failures.push(`${width}px: ${JSON.stringify(geometry)}`)
  await page.screenshot({
    path: join(screenshotPath, `page-${width}.png`),
    fullPage: true,
    animations: 'disabled',
  })
  if (width === 390) {
    const reducedOpacity = await page
      .locator('#entourage-title')
      .evaluate((element) => getComputedStyle(element).opacity)
    if (reducedOpacity !== '1') failures.push('Reduced-motion heading was hidden')
    const welcomeOpacity = await page
      .locator('#welcome-title')
      .evaluate((element) => getComputedStyle(element).opacity)
    if (welcomeOpacity !== '1') failures.push('Reduced-motion welcome heading was hidden')
  }
  await context.close()
  console.log(
    `${width}px: document ${geometry.documentWidth}px, clipped ${geometry.clipped.length}, missing images ${geometry.missingImages.length}`,
  )
}

const interactionContext = await browser.newContext({
  viewport: { width: 390, height: 844 },
  reducedMotion: 'reduce',
})
const interactionPage = await interactionContext.newPage()
interactionPage.on('pageerror', (error) => errors.push(`interaction: ${error.message}`))
await interactionPage.goto(baseURL, { waitUntil: 'networkidle' })
const openButton = interactionPage.getByRole('button', { name: 'Open wedding invitation and play music' })
await openButton.focus()
await interactionPage.keyboard.press('Enter')
await interactionPage.locator('.intro').waitFor({ state: 'detached' })
const player = interactionPage.getByRole('button', { name: /background music/ })
if ((await player.getAttribute('aria-pressed')) !== 'true')
  failures.push('Music did not start from the opening gesture')
const welcomePlayer = interactionPage.getByRole('button', { name: /our song/ })
if ((await welcomePlayer.getAttribute('aria-pressed')) !== 'true')
  failures.push('Welcome music control did not reflect envelope playback')
await welcomePlayer.focus()
await interactionPage.keyboard.press('Space')
if ((await player.getAttribute('aria-pressed')) !== 'false')
  failures.push('Welcome keyboard pause did not update floating control')
await player.click()
await interactionPage.getByRole('button', { name: 'Pause our song' }).waitFor({ state: 'visible' })
if ((await welcomePlayer.getAttribute('aria-pressed')) !== 'true')
  failures.push('Floating play did not update welcome control')
await welcomePlayer.focus()
await interactionPage.keyboard.press('Enter')
if ((await player.getAttribute('aria-pressed')) !== 'false')
  failures.push('Welcome keyboard play/pause did not update floating control')
if ((await interactionPage.locator('audio').count()) !== 1)
  failures.push('More than one audio element was rendered')
const faqItems = interactionPage.locator('.faqs .faq')
if ((await interactionPage.locator('.faqs details, .faqs summary').count()) !== 0)
  failures.push('FAQ accordion markup remained')
if ((await faqItems.count()) !== 4) failures.push('Configured FAQ items did not render')
for (const item of await faqItems.all()) {
  if ((await item.locator('.faq__heart[aria-hidden="true"]').count()) !== 1)
    failures.push('FAQ item did not have exactly one decorative heart')
  if (!(await item.locator('.faq__question').isVisible())) failures.push('FAQ question was hidden')
  if (!(await item.locator('.faq__answer').isVisible())) failures.push('FAQ answer was hidden')
}
if ((await interactionPage.locator('.venue-location__qr img').count()) !== 2)
  failures.push('Verified venue QR codes did not render')
if ((await interactionPage.locator('.venue-location__pending').count()) !== 0)
  failures.push('Pending venue QR placeholders remained')
if ((await interactionPage.locator('.closing__unit').count()) !== 4)
  failures.push('Date-only wedding countdown did not render four units')
if (
  (await interactionPage.locator('.closing__background').getAttribute('src')) !==
  '/images/template/bloody-red.jpg'
)
  failures.push('Closing background image did not render')
if ((await interactionPage.locator('.closing form, .closing input, .closing button').count()) !== 0)
  failures.push('Closing section unexpectedly contains an RSVP form or action')
if (
  (await interactionPage
    .getByText('Counting down to our wedding day. The ceremony begins at 4:00 PM.')
    .count()) !== 1
)
  failures.push('Date-only countdown clarification did not render')
await interactionPage.locator('audio').evaluate((element) => element.dispatchEvent(new Event('error')))
if (!(await interactionPage.getByRole('status').getByText('Music is unavailable right now.').isVisible()))
  failures.push('Welcome music error was not surfaced')
const envelopePage = await interactionContext.newPage()
await envelopePage.goto(baseURL, { waitUntil: 'networkidle' })
await envelopePage.getByRole('button', { name: 'Open wedding invitation and play music' }).focus()
await envelopePage.keyboard.press('Space')
await envelopePage.locator('.intro').waitFor({ state: 'detached' })
if (
  (await envelopePage
    .getByRole('button', { name: 'Pause background music' })
    .getAttribute('aria-pressed')) !== 'true'
)
  failures.push('Envelope keyboard action did not open with music')
await interactionContext.close()

for (const { width, height, label } of [
  { width: 320, height: 568, label: 'compact phone' },
  { width: 195, height: 300, label: '390x600 at 200% CSS viewport equivalent' },
]) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  const opener = page.getByRole('button', { name: 'Open wedding invitation and play music' })
  await opener.scrollIntoViewIfNeeded()
  if (!(await opener.isVisible())) failures.push(`${label}: opening action unreachable`)
  await opener.click()
  await page.locator('.intro').waitFor({ state: 'detached' })
  await context.close()
}

const revealContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const revealPage = await revealContext.newPage()
await revealPage.goto(baseURL, { waitUntil: 'networkidle' })
await revealPage.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
await revealPage.locator('.intro').waitFor({ state: 'detached' })
const revealHeading = revealPage.locator('#entourage-title')
const welcomeHeading = revealPage.locator('#welcome-title')
const welcomeInitialOpacity = await welcomeHeading.evaluate((element) => getComputedStyle(element).opacity)
if (welcomeInitialOpacity !== '0')
  failures.push(`Welcome reveal initial opacity was ${welcomeInitialOpacity}`)
await welcomeHeading.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await revealPage.waitForFunction(
  () => getComputedStyle(document.querySelector('#welcome-title')).opacity === '1',
)
const initialOpacity = await revealHeading.evaluate((element) => getComputedStyle(element).opacity)
if (initialOpacity !== '0') failures.push(`Scroll reveal initial opacity was ${initialOpacity}`)
await revealHeading.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await revealPage.waitForFunction(
  () => getComputedStyle(document.querySelector('#entourage-title')).opacity === '1',
)
const finalOpacity = await revealHeading.evaluate((element) => getComputedStyle(element).opacity)
if (finalOpacity !== '1') failures.push(`Scroll reveal final opacity was ${finalOpacity}`)
const giftArt = revealPage.locator('.gifts__art')
const giftInitialOpacity = await giftArt.evaluate((element) => getComputedStyle(element).opacity)
if (giftInitialOpacity !== '0') failures.push(`Gift reveal initial opacity was ${giftInitialOpacity}`)
await giftArt.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await revealPage.waitForFunction(
  () => getComputedStyle(document.querySelector('.gifts__art')).opacity === '1',
)
const remindersHeading = revealPage.locator('#reminders-title')
const remindersInitialOpacity = await remindersHeading.evaluate(
  (element) => getComputedStyle(element).opacity,
)
if (remindersInitialOpacity !== '0')
  failures.push(`Reminders reveal initial opacity was ${remindersInitialOpacity}`)
await remindersHeading.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await revealPage.waitForFunction(
  () => getComputedStyle(document.querySelector('#reminders-title')).opacity === '1',
)
const closingOpening = revealPage.locator('.closing__opening')
const closingInitialOpacity = await closingOpening.evaluate((element) => getComputedStyle(element).opacity)
if (closingInitialOpacity !== '0')
  failures.push(`Closing reveal initial opacity was ${closingInitialOpacity}`)
await closingOpening.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }))
await revealPage.waitForFunction(
  () => getComputedStyle(document.querySelector('.closing__opening')).opacity === '1',
)
await revealContext.close()

const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
const fallbackPage = await fallbackContext.newPage()
await fallbackPage.addInitScript(() => {
  window.IntersectionObserver = undefined
})
await fallbackPage.goto(baseURL, { waitUntil: 'networkidle' })
await fallbackPage.getByRole('button', { name: 'Open wedding invitation and play music' }).click()
await fallbackPage.locator('.intro').waitFor({ state: 'detached' })
const fallbackOpacity = await fallbackPage
  .locator('#entourage-title')
  .evaluate((element) => getComputedStyle(element).opacity)
if (fallbackOpacity !== '1') failures.push('Heading hidden without IntersectionObserver')
const welcomeFallbackOpacity = await fallbackPage
  .locator('#welcome-title')
  .evaluate((element) => getComputedStyle(element).opacity)
if (welcomeFallbackOpacity !== '1') failures.push('Welcome hidden without IntersectionObserver')
const timelineFallbackOpacity = await fallbackPage
  .locator('.timeline__header')
  .evaluate((element) => getComputedStyle(element).opacity)
if (timelineFallbackOpacity !== '1') failures.push('Timeline hidden without IntersectionObserver')
const giftFallbackOpacity = await fallbackPage
  .locator('.gifts__art')
  .evaluate((element) => getComputedStyle(element).opacity)
if (giftFallbackOpacity !== '1') failures.push('Gift artwork hidden without IntersectionObserver')
const remindersFallbackOpacity = await fallbackPage
  .locator('#reminders-title')
  .evaluate((element) => getComputedStyle(element).opacity)
if (remindersFallbackOpacity !== '1') failures.push('Reminders hidden without IntersectionObserver')
const closingFallbackOpacity = await fallbackPage
  .locator('.closing__opening')
  .evaluate((element) => getComputedStyle(element).opacity)
if (closingFallbackOpacity !== '1') failures.push('Closing hidden without IntersectionObserver')
await fallbackContext.close()

await browser.close()
if (errors.length || failures.length) {
  console.error('Browser QA failures:', [...errors, ...failures].join('\n'))
  process.exitCode = 1
} else console.log(`Browser QA passed in ${browserName}; screenshots saved to ${screenshotPath}`)

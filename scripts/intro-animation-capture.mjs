import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const baseURL = process.env.WEDDING_QA_URL ?? 'http://127.0.0.1:5174/'
const folder = fileURLToPath(new URL('../screenshots/02c1/', import.meta.url))
mkdirSync(folder, { recursive: true })
const browser = await chromium.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: true,
  args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
})
const frames = [
  ['initial', 0],
  ['date-mid', 850],
  ['date-complete', 1780],
  ['names-fading', 1680],
  ['floral-bloom', 2240],
  ['fully-revealed', 3300],
]
const states = []
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})

for (const [name, wait] of frames) {
  const page = await context.newPage()
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' })
  await page.locator('.intro').waitFor()
  if (wait) await page.waitForTimeout(wait)
  const state = await page.locator('.intro').evaluate((intro, label) => {
    window.requestAnimationFrame = () => 0
    for (const animation of document.getAnimations()) animation.pause()
    const names = intro.querySelector('.intro__names')
    const flowers = intro.querySelector('.intro__florals--left')
    const envelope = intro.querySelector('.envelope')
    const prompt = intro.querySelector('.intro__prompt')
    return {
      label,
      date: intro.querySelector('.intro__date-visible').textContent.trim(),
      namesOpacity: getComputedStyle(names).opacity,
      flowersOpacity: getComputedStyle(flowers).opacity,
      flowersTransform: getComputedStyle(flowers).transform,
      envelopeOpacity: getComputedStyle(envelope).opacity,
      promptOpacity: getComputedStyle(prompt).opacity,
    }
  }, name)
  states.push(state)
  await page.screenshot({ path: join(folder, 'state-' + name + '-1440.png') })
  await page.close()
}

await context.close()
await browser.close()
writeFileSync(join(folder, 'animation-states.json'), JSON.stringify(states, null, 2))
console.log(JSON.stringify(states, null, 2))
const byName = Object.fromEntries(states.map((state) => [state.label, state]))
if (
  byName.initial.namesOpacity !== '0' ||
  byName.initial.date === '02 · 22 · 27' ||
  byName['date-mid'].date === '02 · 22 · 27' ||
  byName['date-complete'].date !== '02 · 22 · 27' ||
  Number(byName['names-fading'].namesOpacity) <= 0 ||
  Number(byName['names-fading'].namesOpacity) >= 1 ||
  Number(byName['floral-bloom'].flowersOpacity) <= 0 ||
  byName['fully-revealed'].flowersOpacity !== '1'
)
  process.exitCode = 1

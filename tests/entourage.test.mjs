import assert from 'node:assert/strict'
import test from 'node:test'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createServer } from 'vite'

test('entourage renders ordered roles when optional categories are omitted', async () => {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
  })
  try {
    const { default: EntourageSection } = await vite.ssrLoadModule(
      '/src/templates/BurgundyWedding/components/EntourageSection.vue',
    )
    const content = {
      groups: [
        {
          id: 'parents',
          layout: 'single',
          heading: 'Parents',
          people: [{ name: 'Mrs. Elena Rivera' }, { name: 'Mr. Tomas Rivera' }],
        },
        {
          id: 'attendants',
          layout: 'paired',
          columns: [
            { heading: 'Best man', people: [{ name: 'Mr. Luis Rivera' }] },
            { heading: 'Maid of honor', people: [{ name: 'Ms. Bea Santos' }] },
          ],
        },
        {
          id: 'custom',
          layout: 'chapter',
          heading: 'Ceremony helpers',
          roles: [
            {
              heading: 'Readers',
              description: 'To share words of joy',
              people: [{ name: 'Ms. Sofia Reyes' }],
            },
          ],
        },
      ],
    }
    const html = await renderToString(createSSRApp(EntourageSection, { content }))
    assert.match(html, /<h2 id="entourage-title">The Entourage<\/h2>/)
    assert.match(html, /<h3 class="entourage__role">Parents<\/h3>/)
    assert.match(html, /<h4 class="entourage__role entourage__role--sub">Readers<\/h4>/)
    assert.match(html, /To share words of joy/)
    assert.ok(html.indexOf('Elena Rivera') < html.indexOf('Tomas Rivera'))
    assert.ok(html.indexOf('Best man') < html.indexOf('Maid of honor'))
    assert.ok(html.indexOf('Ceremony helpers') < html.indexOf('Readers'))
    assert.doesNotMatch(html, /Secondary sponsors|Flower girls|In loving memory/)
  } finally {
    await vite.close()
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { countdownTo } from '../src/utils/dates.ts'
import { safeExternalUrl, safeGoogleMapsUrl } from '../src/utils/links.ts'

test('countdown uses the exact offset instant and handles completion', () => {
  const target = '2027-06-19T16:00:00+08:00'
  const before = Date.parse(target) - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000
  assert.deepEqual(countdownTo(target, before), {
    days: 2,
    hours: 3,
    minutes: 4,
    seconds: 5,
    complete: false,
  })
  assert.equal(countdownTo(target, Date.parse(target)).complete, true)
  assert.equal(countdownTo('invalid', before).complete, true)
})

test('external links accept only absolute HTTPS destinations', () => {
  assert.equal(safeExternalUrl('https://maps.google.com/?q=example'), 'https://maps.google.com/?q=example')
  assert.equal(safeExternalUrl('javascript:alert(1)'), undefined)
  assert.equal(safeExternalUrl('http://example.com'), undefined)
  assert.equal(safeExternalUrl('/relative'), undefined)
})

test('venue links accept only HTTPS Google Maps destinations', () => {
  const url = 'https://www.google.com/maps/search/?api=1&query=Test+Venue'
  assert.equal(safeGoogleMapsUrl(url), url)
  assert.equal(safeGoogleMapsUrl('https://maps.app.goo.gl/TestVenue'), 'https://maps.app.goo.gl/TestVenue')
  assert.equal(
    safeGoogleMapsUrl('https://maps.google.com/?q=Test+Venue'),
    'https://maps.google.com/?q=Test+Venue',
  )
  assert.equal(safeGoogleMapsUrl('https://maps.app.goo.gl.evil.example/test'), undefined)
  assert.equal(safeGoogleMapsUrl('https://www.google.com.evil.example/maps/test'), undefined)
  assert.equal(safeGoogleMapsUrl('https://www.google.com/search?q=test'), undefined)
  assert.equal(safeGoogleMapsUrl('https://user@www.google.com/maps/test'), undefined)
  assert.equal(safeGoogleMapsUrl('http://www.google.com/maps/test'), undefined)
})

import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { weddingContent } from '../src/data/wedding-content.ts'
import { safeGoogleMapsUrl } from '../src/utils/links.ts'

test('confirmed couple, date, venues, and pending wedding time are represented accurately', () => {
  assert.deepEqual(weddingContent.couple, {
    first: 'Jamie',
    second: 'Emiliano',
    firstFullName: 'Jamie Cosio',
    secondFullName: 'Emiliano Cosio',
    monogram: 'J&E',
  })
  assert.deepEqual(weddingContent.date, {
    iso: '2027-02-22',
    timeZone: 'Asia/Manila',
    display: 'February 22, 2027',
    day: 'Monday',
    timeConfirmed: false,
    countdownTarget: {
      iso: '2027-02-22T00:00:00+08:00',
      note: 'Counting down to our wedding day. Ceremony time to be announced.',
    },
  })
  assert.equal(weddingContent.venues.items[0].name, 'San Antonio De Padua Parish Church')
  assert.equal(weddingContent.venues.items[0].address, 'Pooc, Silang, Cavite')
  assert.equal(weddingContent.venues.items[1].name, 'El Roi Events Place at Casa Concepcion')
  assert.equal(weddingContent.venues.items[1].address, 'Silang, Cavite')
  for (const venue of weddingContent.venues.items) {
    assert.equal(safeGoogleMapsUrl(venue.verifiedMapUrl), venue.verifiedMapUrl)
    assert.equal(venue.time, undefined)
  }
  assert.equal(weddingContent.music.title, 'Original instrumental preview')
  assert.equal(weddingContent.music.preferredTitle, 'Risk It All')
  assert.equal(weddingContent.music.preferredArtist, 'Bruno Mars')
  assert.doesNotMatch(JSON.stringify(weddingContent), /Amelia|Gabriel|Conservatory Chapel|Garden Ballroom/)
})

test('provisional entourage names remain independently ordered and unsupported roles are omitted', () => {
  const groups = weddingContent.entourage.groups
  const pairNames = (id, side) =>
    groups.find((group) => group.id === id).columns[side].people.map((person) => person.name)
  assert.deepEqual(pairNames('honor-attendants', 0), ['Jian Angelo Domingo', 'Earvin Mc Laren Cosio'])
  assert.deepEqual(pairNames('honor-attendants', 1), ['Jessa Ramos Cepillo', 'Nelffa Tinumpic'])
  assert.deepEqual(pairNames('wedding-party', 0), [
    'Van Defante',
    'Ephie Santos',
    'Jan Mapalad',
    'Jamir Defante',
    'Jop Madrid',
    'Erwin Pat Eddyson Cosio',
    'Justin Solomon',
    'Russ Ignacio',
  ])
  assert.deepEqual(pairNames('wedding-party', 1), [
    'Ellery Kong',
    'Melissa Abesamis',
    'Jelai Tanola',
    'Shiela Cepeda',
    'Maryrose Diamos',
    'Enoc Allyson Cosio',
    'Bailey Villojan',
  ])
  const roles = groups.flatMap((group) => (group.layout === 'chapter' ? group.roles : []))
  const name = (heading) => roles.find((role) => role.heading === heading).people.map((p) => p.name)
  assert.deepEqual(name('Veil sponsors'), ['Yho Guro', 'Ethelmira Guro'])
  assert.deepEqual(name('Cord sponsors'), ['Sonny Cosio', 'Josephine Cosio'])
  assert.deepEqual(name('Candle sponsors'), ['Primitivo Madrid', 'Josie Madrid'])
  assert.deepEqual(name('Ring bearer'), ['Elin Noah Abad'])
  assert.deepEqual(name('Bible bearer'), ['Ervie Ann Cosio'])
  assert.deepEqual(name('Flower girl'), ['Yangyang'])
  assert.equal(
    roles.some((role) => /aras|coin/i.test(role.heading)),
    false,
  )
})

test('all supplied attire colors stay separate from website theme colors', () => {
  assert.deepEqual(
    Object.fromEntries(weddingContent.attire.partyColors.map((entry) => [entry.role, entry.color.hex])),
    {
      Bridesmaids: '#A67C5E',
      'Maid of Honor': '#87CEEB',
      'Mother of the Bride': '#DCC7A4',
      'Father of the Bride': '#000080',
      'Mother of the Groom': '#C49A6C',
      'Father of the Groom': '#000080',
      'Best Man': '#87CEEB',
      Groomsmen: '#4C3626',
      'Ring Bearer': '#556B2F',
      'Flower Girl': '#A67C5E',
      'Ninong / Male Sponsors': '#4C3626',
      'Ninang / Female Sponsors': '#C49A6C',
    },
  )
  assert.deepEqual(weddingContent.attire.guestColors, [
    { name: 'Grey', hex: '#A7A7A7' },
    { name: 'Lavender', hex: '#C9B4E4' },
    { name: 'Light Yellow', hex: '#F9E79F' },
  ])
  assert.equal(weddingContent.attire.restrictedColors, 'Please avoid wearing white, pearl, and ivory.')
})

test('eight distinct watercolor illustrations map to the approved outfit colors and ship as small assets', () => {
  const looks = [...weddingContent.attire.partyLooks, ...weddingContent.attire.guestLooks]
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.deepEqual(
    looks.map((look) => look.colors.primary),
    ['#A67C5E', '#87CEEB', '#87CEEB', '#4C3626', '#C49A6C', '#A7A7A7', '#C9B4E4', '#F9E79F'],
  )
  assert.equal(new Set(looks.map((look) => look.id)).size, 8)
  assert.equal(new Set(looks.map((look) => look.illustration.src)).size, 8)
  for (const look of looks) {
    const { src, alt, width, height } = look.illustration
    assert.match(src, /^\/images\/attire\/[\w-]+\.webp$/)
    assert.ok(alt.startsWith('Example '))
    assert.deepEqual([width, height], [768, 1152])
    const file = join(root, 'public', src.slice(1))
    assert.ok(existsSync(file), `${look.id} image is missing`)
    assert.ok(statSync(file).size < 150_000, `${look.id} image exceeds the mobile asset budget`)
  }
})

test('the six-event program is explicitly sample content and does not confirm the wedding time', () => {
  const { timeline, date } = weddingContent
  assert.equal(date.timeConfirmed, false)
  assert.equal(timeline.provisional, true)
  assert.equal(timeline.note, 'Sample program — details to be confirmed')
  assert.deepEqual(
    timeline.events.map(({ time, title }) => [time, title]),
    [
      ['2:30 PM', 'Gathering'],
      ['3:00 PM', 'Ceremony'],
      ['5:00 PM', 'Cocktails'],
      ['6:00 PM', 'Reception'],
      ['7:00 PM', 'Dinner'],
      ['9:00 PM', 'After Party'],
    ],
  )
  assert.equal(new Set(timeline.events.map((event) => event.id)).size, 6)
})

test('gift preview uses the supplied artwork without exposing unapproved payment destinations', () => {
  const { gifts } = weddingContent
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.equal(gifts.messagePendingApproval, true)
  assert.equal(gifts.artwork.src, '/images/attire/gift%20vector%20element.png')
  assert.ok(existsSync(join(root, 'public', decodeURIComponent(gifts.artwork.src.slice(1)))))
  assert.deepEqual(
    gifts.options.map(({ id, label, approved, qrImage }) => ({ id, label, approved, qrImage })),
    [
      { id: 'gift-option-01', label: 'Gift Option 01', approved: undefined, qrImage: undefined },
      { id: 'gift-option-02', label: 'Gift Option 02', approved: undefined, qrImage: undefined },
    ],
  )
  assert.doesNotMatch(JSON.stringify(gifts), /account number|wallet address|https?:\/\//i)
})

test('reminders use the approved ornament with provisional wording and no unconfirmed details', () => {
  const { reminders } = weddingContent
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.equal(reminders.pendingApproval, true)
  assert.deepEqual(reminders.heading, ['Reminders to', 'Our Dear Guests'])
  assert.equal(reminders.ornament.src, '/images/attire/reminder-icon.png')
  assert.deepEqual([reminders.ornament.width, reminders.ornament.height], [800, 441])
  assert.ok(existsSync(join(root, 'public', reminders.ornament.src.slice(1))))
  assert.deepEqual(
    reminders.items.map(({ title, paragraphs }) => [title, paragraphs.length]),
    [
      ['Please arrive early!', 2],
      ['Celebrate with us!', 2],
      ['Snap & share!', 2],
    ],
  )
  assert.equal(new Set(reminders.items.map((item) => item.id)).size, 3)
  assert.ok(reminders.items.every((item) => !item.eventTime && !item.hashtag))
  assert.doesNotMatch(JSON.stringify(reminders), /3:00 PM|#allifetimem|Rich|Ira/i)
})

test('FAQ keeps four static answers and uses the approved guest attire palette', () => {
  const { faqs, attire } = weddingContent
  assert.deepEqual(
    faqs.map(({ question, answer }) => [question, answer.length]),
    [
      ['Can I bring a plus one?', 2],
      ['Are kids allowed?', 2],
      ['Is there a dress code?', 1],
      ['How can I help the couple to have the best time on their wedding day?', 1],
    ],
  )
  const dressCode = faqs[2].answer.join(' ')
  for (const color of attire.guestColors) assert.match(dressCode, new RegExp(color.name, 'i'))
  assert.match(dressCode, /formal attire/i)
  assert.match(dressCode, /white, pearl, and ivory/i)
  assert.doesNotMatch(dressCode, /maroon|black|gold/i)
})

test('closing uses the supplied texture and a date-only Manila countdown without a form', () => {
  const { closing, date } = weddingContent
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.equal(closing.background.src, '/images/template/bloody-red.jpg')
  assert.ok(existsSync(join(root, 'public', closing.background.src.slice(1))))
  assert.equal(Date.parse(date.countdownTarget.iso), Date.parse('2027-02-21T16:00:00Z'))
  assert.equal(date.timeConfirmed, false)
  assert.match(closing.deadlineNote, /announced soon/i)
  assert.doesNotMatch(JSON.stringify(closing), /<form|<input|submit/i)
})

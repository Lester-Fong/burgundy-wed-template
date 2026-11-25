import assert from 'node:assert/strict'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { weddingContent } from '../src/data/wedding-content.ts'
import { safeGoogleMapsUrl } from '../src/utils/links.ts'

test('confirmed couple, date, venues, and date-only countdown are represented accurately', () => {
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
    timeConfirmed: true,
    countdownTarget: {
      iso: '2027-02-22T00:00:00+08:00',
      note: 'Counting down to our wedding day. The ceremony begins at 4:00 PM.',
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

test('latest client entourage roster keeps parent, sponsor, attendant, and ceremonial roles in order', () => {
  const groups = weddingContent.entourage.groups
  const singleNames = (id) => groups.find((group) => group.id === id).people.map((person) => person.name)
  assert.deepEqual(singleNames('groom-parents'), ['Mr. Erwin Cosio', 'Mrs. Consuelo Cosio'])
  assert.deepEqual(singleNames('bride-father'), ['Mr. Jayson Cepillo'])
  assert.deepEqual(singleNames('bride-mother-memory'), ['Mrs. Liza Ramos'])
  assert.deepEqual(singleNames('bride-representative'), ['Mrs. Kcenia Zarate'])
  assert.equal(
    groups.find((group) => group.id === 'bride-representative').description,
    'To be represented and escorted by',
  )
  const pairNames = (id, side) =>
    groups.find((group) => group.id === id).columns[side].people.map((person) => person.name)
  assert.deepEqual(pairNames('principal-sponsors', 0), [
    'Mr. Calvin Hackett',
    'Mr. Mario Moncado',
    'Mr. Arman Diamos',
    'Mr. Russel Ramos',
    'Mr. Benjie Gamayo',
    'Mr. Rolly Ramos',
    'Mr. Ariel Calimbas',
    'Mr. Prince Edionne Solomon',
    'Mr. Allain John Colcol',
    'Mr. Jened Catindig',
    'Mr. Jessie Cabral',
    'Mr. Ingvar Simonsson',
    'Mr. BJ Gagui',
    'Mr. Larry Parsons',
    'Mr. Angel Madlangbayan',
    'Mr. Belermino Montanez',
    'Mr. George Claton',
  ])
  assert.deepEqual(pairNames('principal-sponsors', 1), [
    'Mrs. Eleonor Hackett',
    'Mrs. Vilma Moncada',
    'Mrs. Cinderella Diamos',
    'Mrs. Luzviminda Sanchez',
    'Mrs. Merlinda Ramos',
    'Mrs. Lhavz Ramos',
    'Mrs. Irene Calimbas',
    'Mrs. Efvi Frances Martinez',
    'Mrs. Cristy Recio',
    'Mrs. Jasmine Alojado',
    'Mrs. Celeste Kibanoff',
    'Mrs. Ivy Simonsson',
    'Mrs. Maria Gracia Gagui',
    'Mrs. Cheryl Parsons',
    'Mrs. Fe S. Madlangbayan',
    'Mrs. Dolores Cabrales',
    'Mrs. Claton',
  ])
  assert.deepEqual(pairNames('honor-attendants', 0), ['Jian Angelo Domingo', 'Earvin Mc Laren Cosio'])
  assert.deepEqual(pairNames('honor-attendants', 1), ['Jessa Ramos Cepillo', 'Nelffa Tinumpic'])
  assert.deepEqual(pairNames('wedding-party', 0), [
    'Vahn Reiven Defante',
    'Ephie Santos',
    'Jan Mapalad',
    'Jamir Defante',
    'Joprey Madrid',
    'Erwin Pat Eddyson Cosio',
    'Justine Solomon',
  ])
  assert.deepEqual(pairNames('wedding-party', 1), [
    'Jemeliz Tanola',
    'Melissa Abesamis',
    'Ellery Kong',
    'Shiela Cepeda',
    'Maryrose Diamos',
    'Enoc Allyson Cosio',
    'Bailey Ann Villojan',
  ])
  const roles = groups.flatMap((group) => (group.layout === 'chapter' ? group.roles : []))
  const name = (heading) => roles.find((role) => role.heading === heading).people.map((p) => p.name)
  assert.deepEqual(name('Veil sponsors'), ['Yoly Guro', 'Ethelmira Guro'])
  assert.deepEqual(name('Cord sponsors'), ['Sonny Cosio', 'Josephine Cosio'])
  assert.deepEqual(name('Candle sponsors'), ['Primitivo Madrid', 'Josie Madrid'])
  assert.deepEqual(name('Aras sponsor'), ['Russ Ignacio'])
  assert.deepEqual(name('Ring bearer'), ['Elin Noah'])
  assert.deepEqual(name('Bible bearer'), ['Robin Amigo'])
  assert.deepEqual(name('Flower girl'), ['Ran Long Yang'])
  assert.equal(groups.find((group) => group.id === 'bearers').heading, 'Ceremonial roles')
  assert.doesNotMatch(groups.map((group) => group.heading).join(' '), /little bearers/i)
})

test('principal sponsor and guest colors stay separate from website theme colors', () => {
  assert.deepEqual(
    Object.fromEntries(weddingContent.attire.sponsorColors.map((entry) => [entry.role, entry.color.hex])),
    {
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

test('sponsor and guest watercolor illustrations map to approved colors and ship as small assets', () => {
  const looks = [...weddingContent.attire.sponsorLooks, ...weddingContent.attire.guestLooks]
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.deepEqual(
    looks.map((look) => look.colors.primary),
    ['#4C3626', '#C49A6C', '#A7A7A7', '#C9B4E4', '#F9E79F'],
  )
  assert.equal(new Set(looks.map((look) => look.id)).size, 5)
  assert.equal(new Set(looks.map((look) => look.illustration.src)).size, 5)
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

test('the confirmed five-event program keeps the after party without an invented time', () => {
  const { timeline, date } = weddingContent
  assert.equal(date.timeConfirmed, true)
  assert.equal(timeline.provisional, false)
  assert.equal(timeline.note, undefined)
  assert.deepEqual(
    timeline.events.map(({ time, title }) => [time, title]),
    [
      ['3:00 PM', 'Gathering'],
      ['4:00 PM', 'Ceremony'],
      ['5:00 PM', 'Cocktails'],
      ['6:00 PM', 'Reception'],
      ['After the program', 'After Party'],
    ],
  )
  assert.equal(timeline.events[4].detail, 'Once the host’s program concludes')
  assert.equal(new Set(timeline.events.map((event) => event.id)).size, 5)
})

test('six client photos use distinct optimized assets in their intended order', () => {
  const root = fileURLToPath(new URL('../', import.meta.url))
  const slots = [
    weddingContent.images.hero,
    weddingContent.images.entourageDivider,
    weddingContent.images.venuesDivider,
    weddingContent.images.timeline,
    weddingContent.images.remindersDivider,
    weddingContent.images.faqsDivider,
  ]
  slots.forEach((photo, index) => {
    assert.match(photo.src, new RegExp(`/photo-${index + 1}-mobile\\.webp$`))
    assert.match(photo.desktopSrc, new RegExp(`/photo-${index + 1}-desktop\\.webp$`))
    assert.equal(photo.placeholder, undefined)
    for (const source of [photo.src, photo.desktopSrc]) {
      const file = join(root, 'public', source.slice(1))
      assert.ok(existsSync(file), `${source} is missing`)
      assert.ok(statSync(file).size < 600_000, `${source} exceeds the photo asset budget`)
    }
  })
})

test('gift preview uses the supplied artwork and locally stored payment QR crops', () => {
  const { gifts } = weddingContent
  const root = fileURLToPath(new URL('../', import.meta.url))
  assert.equal(gifts.messagePendingApproval, true)
  assert.equal(gifts.artwork.src, '/images/attire/gift%20vector%20element.png')
  assert.ok(existsSync(join(root, 'public', decodeURIComponent(gifts.artwork.src.slice(1)))))
  assert.deepEqual(
    gifts.options.map(({ id, label, approved, qrImage }) => ({ id, label, approved, qrImage })),
    [
      {
        id: 'bdo',
        label: 'BDO',
        approved: true,
        qrImage: { src: '/images/client/payment-bdo.png', alt: 'BDO payment QR code' },
      },
      {
        id: 'gcash',
        label: 'GCash',
        approved: true,
        qrImage: { src: '/images/client/payment-gcash.png', alt: 'GCash payment QR code' },
      },
    ],
  )
  for (const option of gifts.options) {
    assert.ok(existsSync(join(root, 'public', option.qrImage.src.slice(1))))
  }
  assert.ok(!existsSync(join(root, 'public/images/client/qr-bdo.png')))
  assert.ok(!existsSync(join(root, 'public/images/client/qr-gcash.png')))
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
  assert.equal(date.timeConfirmed, true)
  assert.match(closing.deadlineNote, /announced soon/i)
  assert.doesNotMatch(JSON.stringify(closing), /<form|<input|submit/i)
})

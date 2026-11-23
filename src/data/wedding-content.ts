import type { HexColor, WeddingContent } from '../types/wedding'

// Client-supplied colors are dress-code data, separate from the template theme.
const sponsor = {
  caramel: '#C49A6C',
  mocha: '#4C3626',
} satisfies Record<string, HexColor>

const guests = {
  grey: '#A7A7A7',
  lavender: '#C9B4E4',
  yellow: '#F9E79F',
} satisfies Record<string, HexColor>

export const weddingContent: WeddingContent = {
  prototypeNotice: 'Client preview · illustrative photographs and pending details',
  couple: {
    first: 'Jamie',
    second: 'Emiliano',
    firstFullName: 'Jamie Cosio',
    secondFullName: 'Emiliano Cosio',
    monogram: 'J&E',
  },
  date: {
    iso: '2027-02-22',
    timeZone: 'Asia/Manila',
    display: 'February 22, 2027',
    day: 'Monday',
    timeConfirmed: false,
    // Date-only prototype countdown: midnight in Manila, not a ceremony time.
    countdownTarget: {
      iso: '2027-02-22T00:00:00+08:00',
      note: 'Counting down to our wedding day. Ceremony time to be announced.',
    },
  },
  introduction: 'With full hearts, we invite you to celebrate the beginning of our forever.',
  welcome: {
    heading: 'Welcome, Family & Friends',
    subtitle: 'The Convalidation of Our Marriage',
    musicLabel: 'Listen to Our Song',
    paragraphs: [
      'With grateful hearts, we invite you to share in the joy of our special day.',
      'Your love, laughter, and presence will make this celebration even more meaningful. We look forward to celebrating together.',
    ],
  },
  images: {
    hero: {
      src: '/images/prototype/couple-editorial.jpg',
      alt: 'Illustrative prototype photograph of a fictional couple beneath a candlelit stone arch',
      placeholder: true,
      position: 'center 57%',
      mobilePosition: 'center 54%',
      desktopPosition: 'center 69%',
    },
    editorial: {
      src: '/images/prototype/wedding-still-life.jpg',
      alt: 'Illustrative prototype photograph of candlelit flowers and an invitation',
      placeholder: true,
      position: 'center center',
    },
    garden: {
      src: '/images/prototype/garden-walk.jpg',
      alt: 'Illustrative prototype photograph of a fictional couple in a garden',
      placeholder: true,
      position: 'center center',
      mobilePosition: '84% center',
      desktopPosition: 'center 52%',
    },
  },
  entourage: {
    intro: 'With gratitude to those standing beside us',
    groups: [
      {
        id: 'groom-parents',
        layout: 'single',
        heading: 'Parents of the Groom',
        people: [{ name: 'Mr. Erwin Cosio' }, { name: 'Mrs. Consuelo Cosio' }],
      },
      {
        id: 'bride-father',
        layout: 'single',
        heading: 'Father of the Bride',
        people: [{ name: 'Mr. Jayson Cepillo' }],
      },
      {
        id: 'bride-mother-memory',
        layout: 'single',
        heading: 'In Loving Memory of the Mother of the Bride',
        people: [{ name: 'Mrs. Liza Ramos' }],
      },
      {
        id: 'bride-representative',
        layout: 'single',
        description: 'To be represented and escorted by',
        people: [{ name: 'Mrs. Kcenia Zarate' }],
      },
      {
        id: 'principal-sponsors',
        layout: 'paired',
        heading: 'Principal Sponsors',
        description: 'To guide and support us with wisdom and love',
        columns: [
          {
            people: [
              { name: 'Mr. Calvin Hackett' },
              { name: 'Mr. Mario Moncado' },
              { name: 'Mr. Arman Diamos' },
              { name: 'Mr. Russel Ramos' },
              { name: 'Mr. Benjie Gamayo' },
              { name: 'Mr. Rolly Ramos' },
              { name: 'Mr. Ariel Calimbas' },
              { name: 'Mr. Prince Edionne Solomon' },
              { name: 'Mr. Allain John Colcol' },
              { name: 'Mr. Jened Catindig' },
              { name: 'Mr. Jessie Cabral' },
              { name: 'Mr. Ingvar Simonsson' },
              { name: 'Mr. BJ Gagui' },
              { name: 'Mr. Larry Parsons' },
              { name: 'Mr. Angel Madlangbayan' },
              { name: 'Mr. Belermino Montanez' },
              { name: 'Mr. George Claton' },
            ],
          },
          {
            people: [
              { name: 'Mrs. Eleonor Hackett' },
              { name: 'Mrs. Vilma Moncada' },
              { name: 'Mrs. Cinderella Diamos' },
              { name: 'Mrs. Luzviminda Sanchez' },
              { name: 'Mrs. Merlinda Ramos' },
              { name: 'Mrs. Lhavz Ramos' },
              { name: 'Mrs. Irene Calimbas' },
              { name: 'Mrs. Efvi Frances Martinez' },
              { name: 'Mrs. Cristy Recio' },
              { name: 'Mrs. Jasmine Alojado' },
              { name: 'Mrs. Celeste Kibanoff' },
              { name: 'Mrs. Ivy Simonsson' },
              { name: 'Mrs. Maria Gracia Gagui' },
              { name: 'Mrs. Cheryl Parsons' },
              { name: 'Mrs. Fe S. Madlangbayan' },
              { name: 'Mrs. Dolores Cabrales' },
              { name: 'Mrs. Claton' },
            ],
          },
        ],
      },
      {
        id: 'honor-attendants',
        layout: 'paired',
        columns: [
          {
            heading: 'Best men',
            people: [{ name: 'Jian Angelo Domingo' }, { name: 'Earvin Mc Laren Cosio' }],
          },
          {
            heading: 'Maids of honor',
            people: [{ name: 'Jessa Ramos Cepillo' }, { name: 'Nelffa Tinumpic' }],
          },
        ],
      },
      {
        id: 'wedding-party',
        layout: 'paired',
        description: 'To share in the joy of our celebration',
        columns: [
          {
            heading: 'Groomsmen',
            people: [
              { name: 'Vahn Reiven Defante' },
              { name: 'Ephie Santos' },
              { name: 'Jan Mapalad' },
              { name: 'Jamir Defante' },
              { name: 'Joprey Madrid' },
              { name: 'Erwin Pat Eddyson Cosio' },
              { name: 'Justine Solomon' },
            ],
          },
          {
            heading: 'Bridesmaids',
            people: [
              { name: 'Jemeliz Tanola' },
              { name: 'Melissa Abesamis' },
              { name: 'Ellery Kong' },
              { name: 'Shiela Cepeda' },
              { name: 'Maryrose Diamos' },
              { name: 'Enoc Allyson Cosio' },
              { name: 'Bailey Ann Villojan' },
            ],
          },
        ],
      },
      {
        id: 'secondary-sponsors',
        layout: 'chapter',
        heading: 'Secondary sponsors',
        description: 'To witness and support our union',
        roles: [
          { heading: 'Veil sponsors', people: [{ name: 'Yoly Guro' }, { name: 'Ethelmira Guro' }] },
          {
            heading: 'Cord sponsors',
            people: [{ name: 'Sonny Cosio' }, { name: 'Josephine Cosio' }],
          },
          {
            heading: 'Candle sponsors',
            people: [{ name: 'Primitivo Madrid' }, { name: 'Josie Madrid' }],
          },
          { heading: 'Aras sponsor', people: [{ name: 'Russ Ignacio' }] },
        ],
      },
      {
        id: 'bearers',
        layout: 'chapter',
        heading: 'Ceremonial roles',
        description: 'To carry the symbols of our ceremony with care',
        roles: [
          { heading: 'Ring bearer', people: [{ name: 'Elin Noah' }] },
          { heading: 'Bible bearer', people: [{ name: 'Robin Amigo' }] },
          { heading: 'Flower girl', people: [{ name: 'Ran Long Yang' }] },
        ],
      },
    ],
  },
  venues: {
    items: [
      {
        kind: 'The ceremony',
        name: 'San Antonio De Padua Parish Church',
        address: 'Pooc, Silang, Cavite',
        verifiedMapUrl: 'https://maps.app.goo.gl/MQQYJJCmjNdmDJXv9',
        illustration: { src: '/images/template/venue-ceremony-concept.svg', alt: '' },
      },
      {
        kind: 'The reception',
        name: 'El Roi Events Place at Casa Concepcion',
        address: 'Silang, Cavite',
        verifiedMapUrl: 'https://maps.app.goo.gl/daoDrVe3JxtLZXsv9',
        illustration: { src: '/images/template/venue-reception-concept.svg', alt: '' },
      },
    ],
  },
  attire: {
    guidance: 'Formal attire',
    sponsorHeading: 'Principal Sponsors',
    sponsorCaption: 'Ladies in caramel gowns · Gentlemen in deep mocha suits',
    guestHeading: 'Wedding Guests',
    guestCaption: 'Please wear formal attire in the colors below',
    notesHeading: 'Special Notes on Attire',
    sponsorLooks: [
      {
        id: 'male-sponsor-mocha',
        label: 'Ninong / Male sponsor',
        variant: 'suit',
        colors: { primary: sponsor.mocha },
        illustration: {
          src: '/images/attire/party-mocha-suit.webp',
          alt: 'Example male principal sponsor in a tailored deep mocha formal suit',
          width: 768,
          height: 1152,
        },
      },
      {
        id: 'female-sponsor-caramel',
        label: 'Ninang / Female sponsor',
        variant: 'gown',
        colors: { primary: sponsor.caramel },
        illustration: {
          src: '/images/attire/party-caramel-gown.webp',
          alt: 'Example female principal sponsor in a long caramel formal gown',
          width: 768,
          height: 1152,
        },
      },
    ],
    guestLooks: [
      {
        id: 'guest-grey-suit',
        label: 'Grey formal suit',
        variant: 'suit',
        colors: { primary: guests.grey, secondary: guests.grey },
        illustration: {
          src: '/images/attire/guest-grey-suit.webp',
          alt: 'Example wedding guest in a refined grey formal suit',
          width: 768,
          height: 1152,
        },
      },
      {
        id: 'guest-lavender-gown',
        label: 'Lavender gown',
        variant: 'gown',
        colors: { primary: guests.lavender, secondary: guests.lavender },
        illustration: {
          src: '/images/attire/guest-lavender-gown.webp',
          alt: 'Example wedding guest in a flowing lavender formal gown',
          width: 768,
          height: 1152,
        },
      },
      {
        id: 'guest-yellow-dress',
        label: 'Light yellow formal dress',
        variant: 'cocktail-dress',
        colors: { primary: guests.yellow, secondary: guests.yellow },
        illustration: {
          src: '/images/attire/guest-yellow-dress.webp',
          alt: 'Example wedding guest in a light yellow formal dress',
          width: 768,
          height: 1152,
        },
      },
    ],
    sponsorColors: [
      { role: 'Ninong / Male Sponsors', color: { name: 'Deep Mocha', hex: sponsor.mocha } },
      { role: 'Ninang / Female Sponsors', color: { name: 'Caramel', hex: sponsor.caramel } },
    ],
    guestColors: [
      { name: 'Grey', hex: guests.grey },
      { name: 'Lavender', hex: guests.lavender },
      { name: 'Light Yellow', hex: guests.yellow },
    ],
    restrictedColors: 'Please avoid wearing white, pearl, and ivory.',
    closingNote: 'Thank you for celebrating with us.',
  },
  timeline: {
    heading: 'The Timeline',
    provisional: true,
    note: 'Sample program — details to be confirmed',
    events: [
      { id: 'gathering', time: '2:30 PM', title: 'Gathering', icon: 'bells' },
      { id: 'ceremony', time: '3:00 PM', title: 'Ceremony', icon: 'rings' },
      { id: 'cocktails', time: '5:00 PM', title: 'Cocktails', icon: 'glasses' },
      { id: 'reception', time: '6:00 PM', title: 'Reception', icon: 'sparkle' },
      { id: 'dinner', time: '7:00 PM', title: 'Dinner', icon: 'dinner' },
      { id: 'after-party', time: '9:00 PM', title: 'After Party', icon: 'disco' },
    ],
  },
  gifts: {
    artwork: {
      src: '/images/attire/gift%20vector%20element.png',
      alt: 'Gift Guide card resting on a burgundy envelope and ornamental lace',
      width: 469,
      height: 468,
    },
    // Client-suggested wording awaits final approval. Verify both payment recipients in their apps before publication.
    messagePendingApproval: true,
    message:
      'Your presence and prayers are the greatest gifts we could receive. As we are currently residing in Dubai, bringing physical gifts home would be a little challenging. Should you wish to bless us further, a monetary gift toward our next chapter would be sincerely appreciated.',
    optionsIntro: 'If you prefer to give digitally, please scan the BDO or GCash code below.',
    options: [
      {
        id: 'bdo',
        label: 'BDO',
        approved: true,
        qrImage: {
          src: '/images/client/payment-bdo.png',
          alt: 'BDO payment QR code',
        },
      },
      {
        id: 'gcash',
        label: 'GCash',
        approved: true,
        qrImage: {
          src: '/images/client/payment-gcash.png',
          alt: 'GCash payment QR code',
        },
      },
    ],
  },
  reminders: {
    heading: ['Reminders to', 'Our Dear Guests'],
    // Preview wording only. Confirm timing, photography guidance, and hashtag with the couple.
    pendingApproval: true,
    ornament: {
      src: '/images/attire/reminder-icon.png',
      alt: '',
      width: 800,
      height: 441,
    },
    items: [
      {
        id: 'arrival',
        title: 'Please arrive early!',
        paragraphs: [
          'To help everything run smoothly, please arrive at least 30 minutes before the start of the ceremony.',
          'This gives you time to settle in, take in the view, and be ready for our big moment.',
        ],
      },
      {
        id: 'celebrate',
        title: 'Celebrate with us!',
        paragraphs: [
          "We've planned a night full of laughter, dancing, and happy memories.",
          'Bring your best energy, your brightest smile, and get ready to enjoy every part of this special day with us.',
        ],
      },
      {
        id: 'photos',
        title: 'Snap & share!',
        paragraphs: [
          'Once the ceremony ends, feel free to take and post photos.',
          "Don't forget to tag your moments using our wedding hashtag so we can enjoy them too!",
        ],
      },
    ],
  },
  faqs: [
    {
      question: 'Can I bring a plus one?',
      answer: [
        'Due to limited space, we are only able to accommodate those guests formally invited on our wedding invitation.',
        'We want to be surrounded by our families, friends, and familiar faces. Please refer to the number of seats allocated for you. Thank you for understanding.',
      ],
    },
    {
      question: 'Are kids allowed?',
      answer: [
        'We certainly love your kids, but due to necessity rather than choice, we regretfully cannot accommodate them at the venue.',
        'The only children attending are our ring bearer and flower girl. We hope you understand and enjoy the night off.',
      ],
    },
    {
      question: 'Is there a dress code?',
      answer: [
        'While we truly appreciate your personal style, we kindly request formal attire in the guest palette of grey, lavender, and light yellow. Please avoid white, pearl, and ivory. We cannot wait to see you dressed up!',
      ],
    },
    {
      question: 'How can I help the couple to have the best time on their wedding day?',
      answer: [
        'Be there on time. Wear appropriate attire. Stay until the end of the party. ENJOY AND HAVE FUN!',
      ],
    },
  ],
  closing: {
    background: { src: '/images/template/bloody-red.jpg', alt: '' },
    heading: 'Kindly RSVP',
    privacyHeading: 'Privacy Notice',
    privacyText:
      'We kindly ask that you keep this invitation private, as we will be celebrating our vows with only our closest loved ones.',
    countdownIntro: 'Join us as we count the days ’til our wedding day!',
    reminder: 'Please confirm your attendance once RSVP instructions are finalized.',
    deadlineNote: 'RSVP details and confirmation deadline will be announced soon.',
  },
  music: {
    src: '/audio/original-ambient-demo.mp3',
    title: 'Original instrumental preview',
    preferredTitle: 'Risk It All',
    preferredArtist: 'Bruno Mars',
  },
  footer: 'Made with love, for a day to remember.',
}

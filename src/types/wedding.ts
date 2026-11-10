export interface ImageAsset {
  src: string
  alt: string
  placeholder?: boolean
  position?: string
  desktopSrc?: string
  mobilePosition?: string
  desktopPosition?: string
  /** Width ÷ height for an optional intentionally cropped desktop frame. Omit to show the full image. */
  desktopFrameRatio?: number
}

export interface Person {
  name: string
  role?: string
}

export interface EntourageRole {
  heading: string
  description?: string
  people: Person[]
}

export interface EntourageColumn {
  heading?: string
  description?: string
  people: Person[]
}

export type EntourageGroup =
  | ({ id: string; layout: 'single' } & EntourageRole)
  | {
      id: string
      layout: 'paired'
      heading?: string
      description?: string
      columns: [EntourageColumn, EntourageColumn]
    }
  | {
      id: string
      layout: 'chapter'
      heading: string
      description?: string
      roles: EntourageRole[]
    }

export interface Venue {
  kind: string
  name: string
  address: string
  time?: string
  /** Set only after the client confirms this exact Google Maps destination. */
  verifiedMapUrl?: string
  /** Concept art may be replaced with an approved venue-specific illustration. */
  illustration?: ImageAsset
  parkingNote?: string
}

export type HexColor = `#${string}`

export interface AttireColor {
  name: string
  hex: HexColor
}

export interface OutfitColors {
  primary: HexColor
  secondary?: HexColor
  accent?: HexColor
}

export type FashionVariant = 'gown' | 'cocktail-dress' | 'suit' | 'barong'

export interface FashionIllustration {
  src: string
  alt: string
  width: number
  height: number
}

export interface FashionLook {
  id: string
  label: string
  variant: FashionVariant
  colors: OutfitColors
  illustration: FashionIllustration
}

export interface AttireRoleColor {
  role: string
  color: AttireColor
}

export interface AttireContent {
  guidance: string
  partyHeading: string
  partyCaption: string
  guestHeading: string
  guestCaption: string
  notesHeading: string
  partyLooks: FashionLook[]
  guestLooks: FashionLook[]
  partyColors: AttireRoleColor[]
  guestColors: AttireColor[]
  restrictedColors: string
  closingNote?: string
}

export type TimelineIconName = 'bells' | 'rings' | 'glasses' | 'sparkle' | 'dinner' | 'disco'

export interface TimelineEvent {
  id: string
  time: string
  title: string
  icon: TimelineIconName
  detail?: string
}

export interface TimelineContent {
  heading: string
  provisional: boolean
  note?: string
  events: TimelineEvent[]
}

export interface GiftOption {
  id: string
  label: string
  /** Show a payment QR only after the client approves the supplied image. */
  approved?: boolean
  qrImage?: ImageAsset
}

export interface GiftContent {
  artwork: ImageAsset & { width: number; height: number }
  message: string
  optionsIntro: string
  messagePendingApproval: boolean
  options: [GiftOption, GiftOption]
}

export interface Reminder {
  id: string
  title: string
  paragraphs: string[]
  eventTime?: { label: string; display: string }
  hashtag?: string
}

export interface RemindersContent {
  heading: [string, string]
  pendingApproval: boolean
  ornament: ImageAsset & { width: number; height: number }
  items: Reminder[]
}

export interface Faq {
  question: string
  answer: string[]
}

export interface ClosingContent {
  background: ImageAsset
  heading: string
  privacyHeading: string
  privacyText: string
  countdownIntro: string
  reminder: string
  deadlineNote: string
}

export interface WelcomeContent {
  heading: string
  musicLabel: string
  paragraphs: [string, string]
}

export interface WeddingContent {
  prototypeNotice?: string
  couple: {
    first: string
    second: string
    firstFullName?: string
    secondFullName?: string
    monogram: string
  }
  date: {
    iso: string
    timeZone: string
    display: string
    day: string
    timeConfirmed: boolean
    countdownTarget?: { iso: string; note: string }
  }
  introduction: string
  welcome?: WelcomeContent
  images: { hero: ImageAsset; editorial?: ImageAsset; garden?: ImageAsset }
  entourage?: { intro?: string; groups: EntourageGroup[] }
  venues?: { intro?: string; items: Venue[]; parkingNote?: string }
  attire?: AttireContent
  timeline?: TimelineContent
  gifts?: GiftContent
  reminders?: RemindersContent
  faqs?: Faq[]
  closing?: ClosingContent
  music?: { src: string; title: string; preferredTitle?: string; preferredArtist?: string }
  footer?: string
}

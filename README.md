# Burgundy Wedding — standalone visual prototype

An original, mobile-first Vue 3 wedding invitation preview for Jamie and Emiliano Cosio. The couple, date, venue names and addresses, attire palettes, and latest entourage roster are client-provided. Event times and several other details are pending. Photography depicts fictional people. Review all pending content before relying on this build for guests.

## Run

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run format:check
npm run build
npm run preview
npm run qa:browser
```

`npm run build` produces a standalone static `dist/` suitable for a later Netlify deployment. For browser QA, start `npm run preview -- --port 4173` before `npm run qa:browser`; screenshots are saved locally. The page has RSVP reminder copy but no RSVP form, submission, backend, database, CMS, or SaaS connection. No remote repository has been configured.

## Architecture

- `src/data/wedding-content.ts`: one typed content object containing confirmed facts, provisional names, and explicitly pending copy.
- `src/types/wedding.ts`: content contract suitable for a future CMS adapter.
- `src/templates/BurgundyWedding/`: portable presentation layer. Section components receive props and do not import client content or application state.
- `src/templates/BurgundyWedding/styles/`: theme tokens and responsive composition.
- `src/templates/BurgundyWedding/composables/useScrollReveal.ts`: once-per-visit text motion. Text stays visible if the observer is unavailable and whenever reduced motion is requested.
- `src/app/App.vue` and `src/main.ts`: standalone bootstrap only.
- `src/utils/`: date countdown, HTTPS link validation, and six-digit attire-color validation.
- `public/images/prototype/`: original generated placeholder photography, separate from future client assets.
- `public/images/client/`: ignored folder reserved for approved client imagery; its contents are excluded from Git by default.
- `public/audio/`: the player uses a 128 kb/s MP3 derived from the existing WAV, with 0.55 seconds of leading quiet audio removed. It starts buffering during the envelope intro; playback still requires a guest gesture. The larger WAV source is kept in `artwork/audio/` so it is not copied into the static build. `scripts/generate-demo-audio.mjs` creates a separate short synthetic demo and does not reproduce the current 3:26 recording.

Optional content sections are rendered only when data exists. The client-supplied direct Google Maps links were checked against their venue names; each venue button and generated QR now use the same validated URL. Payment QR images are staged locally for owner verification; registry details remain pending. External links use `target="_blank"` and `rel="noopener noreferrer"`.

## 02C.4 payment QR review

- The original BDO and GCash screenshots are in ignored `artwork/payment-qr/`, outside `public/`. Exact pixel crops with white quiet zones are in `public/images/client/payment-bdo.png` and `payment-gcash.png`; these two files are allowlisted in that folder's `.gitignore` so Git-based deployments can include them. The build includes only these cropped images. No account text outside the QR images is published.
- The Gift Guide renders both images under BDO and GCash while keeping the Dubai gift message. On narrow phones the options stack so each QR can be shown larger; desktop retains two columns.
- `node scripts/payment-qr-review.mjs before|after` captures ignored screenshots and measures 320, 390, 768, and 1440px layouts. The local QR decoder can read GCash. The supplied BDO screenshot and its lossless crop did not decode with either jsQR or ZXing at source size; the owner subsequently confirmed a successful scan and intended recipient in a compatible payment app. Verify the GCash recipient in its payment app and repeat both checks shortly before the February 2027 wedding.
- Before a Git-based redeploy, include `public/images/client/payment-bdo.png` and `payment-gcash.png` in the commit. Check that both production image URLs return PNGs after deployment. The full source screenshots remain ignored. Recipient and scan verification remain required before treating either QR as a working payment destination.

## 02C.3 client feedback

- The Welcome section carries the convalidation phrase. The Attire Guide shows principal sponsors in deep mocha suits and caramel gowns using existing watercolor assets; the approved grey, lavender, and light yellow guest looks remain.
- The Entourage roster follows the latest client screenshots, with 17 paired principal sponsors. The ring bearer and flower girl are the only children; the other ceremonial roles are adults. The family memorial and escort wording remain separate.
- The suggested Dubai monetary gift message is marked pending approval. BDO and GCash have labeled **QR pending** placeholders until the owner supplies the original approved QR images. No payment destination or account details are present in the source.
- Before adding payment QR images to a public build, have the owner and client scan each original image at its displayed size and independently verify the intended recipient and payment details. Repeat that check shortly before the February 2027 wedding. Image rendering or QR decoding alone cannot establish payment validity or future availability.
- Local comparison images and browser measurements are in ignored `screenshots/02c3-before/` and `screenshots/02c3-after/`. With the production preview running, `node scripts/client-feedback-review.mjs after` checks 320–1920px widths and refreshes the after captures.

The milestone notes below describe earlier iterations; the 02C.3 summary above describes the current Entourage and Attire Guide.

## Reference analysis and design direction

The owner-provided screenshots are the primary visual reference. The Canva page was also inspected in a local browser during the venue refinement; its artwork and content were not reused. **No claim of exact fidelity to the live site is made.** The screenshots and approved brief show:

- Color: deep burgundy, champagne gold, warm ivory.
- Typography: formal display serif with a readable companion sans serif.
- Rhythm: envelope opening, portrait-led hero, photographic interludes, then information sections.
- Photography: romantic, cinematic, warm and low-key.
- Motifs: restrained gold rules, monogram, arches, stationery, and botanical line work.
- Interaction: tap-to-open envelope, optional music, venue links and QR, static FAQs, and a wedding-day countdown.
- Mobile: a narrow invitation-like vertical sequence, with generous section spacing and large titles.

Original refinement here: stronger hierarchy on desktop, clearer information cards, more breathing room, visible pending states, keyboard-first controls, reduced-motion support, and an unobtrusive persistent music button.

## 02A visual refinement

- The opening uses a burgundy folded-paper envelope, original botanical line work, a wax-style seal, and a viewport-aware top/middle/bottom composition. Both the envelope and primary button open with music; the separate quiet entry remains.
- The hero contains only the monogram, names, and date. On mobile, text sits in the photograph's dark upper area. On desktop, those three elements form a spaced, centered stack above the couple. The portrait's natural aspect ratio sets the Hero height, and a dark photographic vignette fills the sides.
- `ImageAsset` accepts optional `desktopSrc`, `mobilePosition`, `desktopPosition`, and `desktopFrameRatio` for future approved photographs. Omit `desktopFrameRatio` to show every pixel of the desktop image; set a positive width-to-height ratio only when an intentional crop is approved. The current prototype still uses its original local image.
- Section headings and supporting text reveal once on scroll with a small upward translation and stagger. The presentation layer owns the observer; sections do not depend on application state.
- Local before/after review images are in `screenshots/02a-before/` and `screenshots/02a-after/`. These screenshots are ignored by Git. The `before` folder preserves the 01 baseline; recapture the refined version while the preview server is running with `node scripts/capture-visual-review.mjs after`.

## 02A.1 hero and photo divider polish

- At desktop widths, the hero uses a tighter two-line name composition and an adjusted image crop. The mobile hero keeps its established layout.
- A short burgundy and gold ornament band separates the hero from the first editorial photograph. It is decorative and hidden from assistive technology.
- The four photo dividers carry accessible alt text and a light contrast veil. While prototype photographs remain in use, they display a small illustrative-photography label.
- Native-resolution before/after screenshots are in `screenshots/02a1-before/` and `screenshots/02a1-after/`, including 1024px, 1440px, and 1920px desktop hero views, transition clips, divider views, and full-page mobile and desktop captures. These files stay local and are ignored by Git. To refresh the after set while the preview server runs, use `node scripts/capture-visual-review.mjs after 02a1`.

## 02A.3 desktop portrait preparation

- Desktop Hero height now follows the selected photograph rather than the viewport. The ornament band begins after the complete image. The mobile Hero retains its original viewport framing.
- The current illustrative portrait source ends before the couple's full bodies are visible. A client-approved full-body desktop source is still needed; `desktopSrc` can select it without changing the mobile image.
- Desktop Hero and transition review captures are in `screenshots/02a3-before/` and `screenshots/02a3-after/`. Run `node scripts/hero-composition-review.mjs after 02a3` against the local preview to refresh the checks and images.

## 02A.4 welcome and music

- A typed `welcome` object supplies the heading, music label, and two generic preview paragraphs awaiting copy approval. `WelcomeMusicSection.vue` replaces the former ornament-only band between the Hero and first photo divider.
- The central play/pause button calls the existing floating player. Both controls read the same playback and error state, and there is still one audio element. Opening with or without music works as before.
- Welcome heading, ornament, music controls, and paragraphs use the existing scroll-reveal observer with a short stagger. Reduced-motion and no-observer modes keep content visible.
- The reference's rendered heading reports an internal Canva font identifier rather than a verifiable font name. This prototype uses the existing self-hosted **Cormorant Garamond** for its serif heading and paragraphs; its package includes the SIL Open Font License 1.1. No font was copied from the reference.
- Local review images are in `screenshots/02a4-before/` and `screenshots/02a4-after/`. Run `node scripts/capture-visual-review.mjs after 02a4` with the preview server running to refresh them.

## 02B.1 entourage program

- The Entourage is an ivory, burgundy, typography-led wedding program. Its ordered typed groups support single roles, two aligned columns, and chapters with subroles. The client-supplied party names have replaced the fictional names; spelling is provisional. Unprovided parents, principal sponsors, and coin bearer are omitted.
- The title uses self-hosted **Italiana**; roles and names use **Cormorant Garamond**, with its italic face for ceremonial descriptions. Italiana's installed Fontsource package credits Santiago Orozco and includes the SIL Open Font License 1.1. The Canva reference exposed internal font identifiers in browser inspection, so these are licensed visual matches rather than claimed exact fonts.
- The existing scroll observer reveals the title and each whole category; individual names remain static. Reduced-motion and no-observer modes keep all content visible.
- With the production preview running, `node scripts/entourage-review.mjs` verifies 320–1920px widths and saves focused, full-section, and transition screenshots to `screenshots/02b1-entourage/`.

## 02B.2 venue presentation

- The Venues section uses two open invitation-style columns on desktop and stacked compositions on mobile. Italiana provides the title; the existing Cormorant Garamond faces provide the venue details. Its two architectural line drawings are original conceptual SVG assets in `public/images/template/`, not depictions of verified client venues. Replace their configurable `illustration` references when approved venue-specific artwork arrives.
- Venue facts stay in `src/data/wedding-content.ts`. An optional `parkingNote` can be set per venue or below both venues. The client supplied direct Maps links in 02B.3; both resolved to the stated venue. The template accepts Google Maps HTTPS hosts and uses the same URL for the button and generated QR. The QR encoder is the MIT-licensed `qrcode` package, loaded only when a verified URL is present; the focused test uses Apache-2.0 `jsqr` to decode generated codes.
- `node scripts/venues-review.mjs before|after` captures section measurements and screenshots while the local production preview runs. The reference and before/after captures are kept under ignored `screenshots/02b2-*/` directories.

## 02B.3 client data and attire

- The couple, date, venue names and addresses, and supplied wedding-party names now come from the typed content object. The ceremony time remains unknown. The closing countdown uses an explicitly provisional target of midnight at the start of February 22, 2027 in Asia/Manila; it does not present that time as the ceremony time. Gift details and other unconfirmed guest guidance are marked pending.
- The Attire Guide follows the reference's centered heading and two illustrated groups. Twelve wedding-party assignments are shown in a compact legend; the separate guest palette has three more prominent swatches. The supplied hex values are dress-code data and do not change the burgundy template theme.
- The original `FashionFigure.vue` SVG prototype is retained only as a historical component and test fixture. It is no longer rendered by the website.
- The two direct client Maps links resolve to the ceremony and reception venues. Browser review decodes both QR images and compares each with its corresponding safe new-tab button.
- `node scripts/attire-review.mjs` captures 320–1920px responsive review images under ignored `screenshots/02b3b/`. The earlier SVG captures remain under `screenshots/02b3/` for comparison.
- The source palette image contradicts itself for Groomsmen: it gives a Deep Mocha swatch but says “Same as Best Man,” whose swatch is Sky Blue. Deep Mocha remains provisional. Confirm spellings such as “Nelffa Tinumpic,” “Earvin Mc Laren Cosio,” and “Enoc Allyson Cosio” before publication.

## 02B.3B complete watercolor attire collection

The approved taupe gown and deep mocha suit were reused, and six coordinated original figures complete the five Wedding Party and three Wedding Guest looks. Their 1024 × 1536 transparent source PNGs remain in `artwork/02b3a/` and `artwork/02b3b/originals/`. The live site uses 768 × 1152 transparent WebP versions in `public/images/attire/`; `node scripts/prepare-fashion-assets.mjs` reproduces these optimized files. Generation prompts, source mapping, and asset notes are documented in `artwork/02b3b/README.md`.

Each look in typed wedding content supplies a stable ID, garment variant, assigned color, image URL, alt text, and intrinsic dimensions. Future wedding content can replace an illustration without editing `AttireGuide.vue`. These garments are visual examples of the assigned colors; the client's definitive Groomsmen suit versus barong choice remains pending. The temporary `?fashion-art=watercolor` preview switch has been retired; watercolor art is now the default development and production presentation.

## 02B.3C attire balance and 02B.4 wedding program

The Attire Guide now places the Wedding Party and Wedding Guests art in two peer groups, keeps the three guest swatches with their group, and places all twelve Wedding Party color assignments in a compact full-width legend beneath both. The legend uses four columns on wide desktops and two at narrower widths; every client color, label, and hex value is unchanged.

The Wedding Program uses the existing fictional garden photograph with configurable mobile and desktop focal positions. A dark gradient, original SVG line icons, gold dotted rail, and restrained Italiana/Cormorant typography form a one-viewport composition. Six events are stored only as a **provisional sample** in typed wedding content, with a visible “Sample program — details to be confirmed” note. These times do not set the canonical wedding time or activate the countdown. Replace the six event objects and set `provisional: false` only after the client confirms the real program. The photograph remains illustrative and must be replaced with an approved client image before publication.

`node scripts/timeline-review.mjs` measures the section at 320 × 700 through 1920 × 1080, checks event order and flow into the Gift Guide, and captures focused timeline, Attire Guide, and full mobile page screenshots under ignored `screenshots/02b4/`. The current eight tested section heights equal their viewport heights; short viewports and zoom can expand naturally because there is no nested scroll or clipping rule.

## Assets and licenses

- The three photographs under `public/images/prototype/` were generated originally for this prototype with OpenAI image generation. They depict fictional people and do not use the reference site's images. Replace with approved client photography before release.
- `public/images/template/bloody-red.jpg` is the owner-supplied closing background. Its publication rights should be confirmed before release.
- All ornaments, the venue concept drawings, the retired inline fashion figures, and the floral drawing are original SVG/CSS assets or component markup. The production fashion collection is original generated watercolor artwork, not copied from the reference site.
- `public/audio/original-ambient-demo.mp3` is a smaller encoding of `artwork/audio/original-ambient-demo-source.wav`. Confirm the source recording's usage rights with its provider before client publication.
- **Italiana**, **Cormorant Garamond**, and **DM Sans** are self-hosted from Fontsource npm packages. All three packages include SIL Open Font License 1.1 text in their installed package directories; keep the font license notices when redistributing font files. No runtime font CDN is required.
- Venue QR codes encode the direct Google Maps links supplied by the owner. Client-supplied payment QR crops are staged for owner verification and must not be published until their recipients are checked in the payment apps.

## Needed for client-ready content

Supply the exact ceremony time, remaining schedule, successful payment-app scan and recipient verification for both QR images, final gift-wording approval, parking details, RSVP instructions and deadline, approved client photographs, approved venue-specific illustrations, and a legally usable recording if the preferred Bruno Mars song is to replace the current original preview. The final footer concept is a later milestone.

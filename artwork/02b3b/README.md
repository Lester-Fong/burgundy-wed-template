# 02B.3B watercolor fashion collection

The owner approved the style of the two original transparent PNG specimens in `../02b3a/`. Those files remain unchanged and are reused for the taupe gown and deep mocha suit. Six new 1024 × 1536 transparent PNG originals are stored in `originals/`. All eight figures were generated with the built-in imagegen tool; the owner-provided inspiration set the quality target, and no reference-site illustration was copied or traced.

The website serves 768 × 1152 transparent WebP derivatives from `public/images/attire/`. `node scripts/prepare-fashion-assets.mjs` reproduces them with browser canvas resampling, WebP quality 0.88, and removal of nearly invisible alpha noise. The eight delivery files total **721,194 bytes**; individual files range from **67,748 to 120,498 bytes**. Their intrinsic dimensions are stored in typed content to reserve layout space before loading. The PNG originals remain available for future approved exports.

| Look | Original | Production WebP | Assigned color | WebP bytes |
| --- | --- | --- | --- | ---: |
| Bridesmaid gown | `../02b3a/gown-taupe-watercolor.png` | `party-taupe-gown.webp` | Taupe Brown `#A67C5E` | 120,498 |
| Best Man suit | `originals/party-sky-suit.png` | `party-sky-suit.webp` | Sky Blue `#87CEEB` | 67,748 |
| Maid of Honor gown | `originals/party-sky-gown.png` | `party-sky-gown.webp` | Sky Blue `#87CEEB` | 90,650 |
| Groomsman suit study | `../02b3a/suit-mocha-watercolor.png` | `party-mocha-suit.webp` | Deep Mocha `#4C3626` | 67,876 |
| Female sponsor gown | `originals/party-caramel-gown.png` | `party-caramel-gown.webp` | Caramel `#C49A6C` | 112,348 |
| Guest suit | `originals/guest-grey-suit.png` | `guest-grey-suit.webp` | Grey `#A7A7A7` | 67,778 |
| Guest gown | `originals/guest-lavender-gown.png` | `guest-lavender-gown.webp` | Lavender `#C9B4E4` | 98,174 |
| Guest dress | `originals/guest-yellow-dress.png` | `guest-yellow-dress.webp` | Light Yellow `#F9E79F` | 96,122 |

## Generation prompt set

Each new figure was generated separately. The corresponding approved PNG was supplied as a **style reference**, with instructions to create a new person and garment rather than duplicate it. Every prompt requested full head and feet, a centered portrait canvas, transparent background, elongated natural proportions, soft realistic face, fine pencil contours, watercolor pigment, detailed folds, gentle upper-left light, formal footwear, and no scenery, text, extra people, or cartoon shapes.

- **Sky suit:** A man in a tailored `#87CEEB` formal suit, white shirt, understated tie, one hand lightly at the jacket front; realistic lapels, sleeves, trousers, and shoes. Style reference: the approved mocha suit.
- **Sky gown:** A woman in a `#87CEEB` formal long gown with sculpted boat neckline, fitted waist, pleated skirt and side drape. Style reference: the approved taupe gown.
- **Caramel gown:** A woman in a `#C49A6C` formal gown with modest square neckline, gathered sleeves, narrow waist, and layered A-line skirt; one hand at the hip. Style reference: the approved taupe gown.
- **Grey guest suit:** A man in a `#A7A7A7` formal suit, white shirt, charcoal tie, and black shoes, turned three-quarter with relaxed hands. Style reference: the approved mocha suit.
- **Lavender guest gown:** A woman in a `#C9B4E4` gown with V-neck, draped chiffon sleeves, slim flowing skirt, and subtle train. Style reference: the approved taupe gown.
- **Yellow guest dress:** A woman in a `#F9E79F` formal dress with cap sleeves, tailored bodice, full pleated midi-to-ankle skirt, clutch, and formal heels. Style reference: the approved taupe gown.

The figures demonstrate the assigned colors; they do not settle the client's final garment rules. In particular, the Deep Mocha Groomsmen swatch conflicts with the supplied “Same as Best Man” note, and suit versus barong attire is still unconfirmed. The generated women share a similar editorial facial treatment. That consistency is intentional for this collection, but the owner can request more facial variety at visual review.

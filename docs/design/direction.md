# Goodbiz Chem: design direction

Date: 2026-10-19 · Task 2 · Source of truth for tokens: `src/app/globals.css` (`@theme`).

Made with the three skills the owner asked for: **Hallmark** (structure, anti-slop rules), **ui-ux-pro-max 2.15.0** (B2B palette, type and UX checks for Next.js + Tailwind) and **emil-design-eng** (component and motion rules). Where they disagreed, the owner's brief wins, then Hallmark, then the others.

## The brief, restated

- **Audience:** procurement and technical buyers at manufacturers, in India and abroad. They arrive from search or an AI assistant, often on a phone, and they know their chemistry.
- **One job:** confirm that Goodbiz Chem supplies the product (name, HSN code, group), then send a quote request.
- **Tone:** a clean technical data sheet with a calm pastel lab palette. Utilitarian, not sales-y.
- **Owner's palette:** pastel colours on white, with green as the main colour. Pastels are for backgrounds and accents. Text and buttons use deeper greens. All text meets WCAG AA.

## Structural choices (Hallmark)

| Decision | Pick | Why |
|---|---|---|
| Genre | modern-minimal | B2B; restrained. White paper is allowed in this genre. |
| Theme route | custom | The owner named the brand colour (green) and the pastel mood. The catalog themes don't carry that. |
| Axes | light / geometric-sans / chromatic-green | Recorded for diversification. |
| Home macrostructure (Task 8) | **11 · Catalogue** | The site's value is the inventory: 19 products, findable by name or HSN code. The home page leads into a uniform, searchable product index (spec-sheet rows with mono HSN codes), not a "hero, 3 features, CTA" rhythm. The Three.js hero sits above it as a calm opener, not the point. |
| Nav | **N1b**, 4 links, no dropdowns, always solid | The brief fixes 4 real destinations plus one primary action. Kept honest and quiet: no blur, no frosting, a hairline under the bar, and an active-page underline in brand-500. |
| Footer | **Ft1 mast-headed + group ledger** | Wordmark, tagline, "SDS available on request" and a quote button on the left. On the right, the four product groups as a ledger: each row has its HSN chapter in a mono tag on that group's pastel. No social row, no "Legal" column, no AI four-column footer. |
| Enrichment | none for the shell | Task 8 adds the Three.js hero. |

Rejected from ui-ux-pro-max: its "Trust & Authority" pattern asks for certification badges, logos and stats. Goodbiz Chem has supplied none, and inventing them breaks the spec's anti-goals, so trust comes from accurate product data, HSN codes and the SDS line instead. Its suggested Plus Jakarta Sans and Inter pairings are also out: Hallmark bans Inter, and Plus Jakarta reads as generic SaaS.

## Typography (next/font/google, self-hosted)

| Role | Family | Use |
|---|---|---|
| Display `--font-display` | **Bricolage Grotesque** (variable, `opsz` axis), 600 to 700, tracking -0.02em | Headings and the wordmark. It has character (ink traps, optical sizes) without being playful. It keeps the site from looking like every Inter/Geist template. |
| Body `--font-body` | **IBM Plex Sans** 400, 500, 600 | An engineering sans with a technical, documentation feel. It suits product data and reads well at 16px. |
| Outlier `--font-mono` | **IBM Plex Mono** 400, 500 | Only for codes: HSN codes, CAS numbers and HSN chapter tags. Use tabular numerals. Never for prose. |

Rules: body 16px with 1.6 line height; measure 45 to 75 characters; headings always roman (no italics), balanced wrapping, `overflow-wrap: anywhere`. The hero h1 is at most `clamp(2.5rem, 5vw + 1rem, 4.5rem)`.

## Colour tokens and contrast

Ratios are WCAG 2.1 relative-luminance contrast, computed from the hex values below.

### Neutrals

| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#FFFFFF` | Page background (owner: "on white") |
| `--color-surface` | `#F4F9F6` | Pastel green-tinted surface (footer, panels) |
| `--color-line` | `#D9E6DE` | Hairlines and dividers (decorative, 1.29:1) |
| `--color-line-strong` | `#7F948A` | Form-field borders (3.23:1, meets the 3:1 rule for UI parts). Added in Task 6 |
| `--color-ink` | `#0E2A1E` | Primary text: a deep green-black, never `#000` |
| `--color-ink-muted` | `#4A6156` | Secondary text |

### Brand greens

| Token | Hex | Role |
|---|---|---|
| `--color-brand-50` | `#F0F8F3` | Ghost button hover fill |
| `--color-brand-100` | `#DCF0E3` | Secondary button fill |
| `--color-brand-200` | `#BCE2CB` | Secondary hover fill, selection, the atom in the logo |
| `--color-brand-300` | `#8FCDA9` | Secondary hover border (decorative) |
| `--color-brand-400` | `#57B083` | Reserved for illustration and the 3D hero |
| `--color-brand-500` | `#2E9263` | Active-nav underline (non-text, 3.88:1 on white) |
| `--color-brand-600` | `#1E7A50` | Focus ring, small icons |
| `--color-brand-700` | `#176140` | Primary button fill, links, logo tile |
| `--color-brand-800` | `#134E34` | Primary hover, secondary button text, active nav text |
| `--color-brand-900` | `#0E3A27` | Deepest green, for text on pastel when it's needed |

### Form error colours (Task 6)

Only for validation and send-failure messages, never decoration.

| Token | Hex | Role |
|---|---|---|
| `--color-danger-50` | `#FDF1EF` | Background of the "not sent" alert |
| `--color-danger-700` | `#B42318` | Error text and invalid-field borders: 6.57:1 on white, 5.95:1 on danger-50 |

### Pastel accents (backgrounds only, never text)

Each product group has one pastel, used as a tag background in the footer ledger and later in the product finder.

| Token | Hex | Group |
|---|---|---|
| `--color-accent-sky` | `#E4F0F8` | Solvents |
| `--color-accent-lilac` | `#EEEAF7` | Amines |
| `--color-accent-butter` | `#F8F2D8` | Inorganics |
| `--color-accent-mint` | `#E2F4EA` | Surfactants |

### Contrast ratios (AA: 4.5:1 for text, 3:1 for large text and UI parts)

| Foreground on background | Ratio | Used for | Result |
|---|---|---|---|
| ink `#0E2A1E` on bg `#FFFFFF` | 15.34 | Body text, headings | AAA |
| ink on surface `#F4F9F6` | 14.41 | Footer text | AAA |
| ink on brand-100 `#DCF0E3` | 12.87 | Text on mint panels | AAA |
| ink on accent-sky `#E4F0F8` | 13.24 | HSN tags | AAA |
| ink on accent-lilac `#EEEAF7` | 12.97 | HSN tags | AAA |
| ink on accent-butter `#F8F2D8` | 13.65 | HSN tags | AAA |
| ink on accent-mint `#E2F4EA` | 13.42 | HSN tags | AAA |
| ink-muted `#4A6156` on bg | 6.70 | Secondary text | AA |
| ink-muted on surface | 6.29 | Footer secondary text | AA |
| ink-muted on brand-50 `#F0F8F3` | 6.20 | Secondary text on a tint | AA |
| ink-muted on the pastel accents | 5.66 to 5.96 | Captions on pastel | AA |
| white on brand-700 `#176140` | 7.45 | Primary button | AAA |
| white on brand-800 `#134E34` | 9.69 | Primary button, hover | AAA |
| brand-700 on bg | 7.45 | Links, ghost button | AAA |
| brand-700 on surface | 6.99 | Links in the footer | AA |
| brand-700 on brand-50 | 6.89 | Ghost button, hover | AA |
| brand-800 `#134E34` on brand-100 | 8.13 | Secondary button | AAA |
| brand-800 on brand-200 `#BCE2CB` | 6.87 | Secondary button, hover | AA |
| brand-600 `#1E7A50` on bg | 5.31 | Focus ring (needs 3:1) | Pass |
| brand-600 on surface | 4.99 | Focus ring in the footer | Pass |
| brand-500 `#2E9263` on bg | 3.88 | Active-nav underline (non-text, needs 3:1) | Pass |

Never use brand-300 to brand-500, or any pastel, for text.

## Shape, space and layout

- Radii: `--radius-sm` 6px (tags, focus), `--radius-md` 10px (buttons), `--radius-lg` 16px (cards and panels), `--radius-pill` (rare). Buttons are softly squared rather than pills, which is more "spec sheet" than "SaaS".
- Container: 1200px max; gutters of 16px on phones, 24px on tablets and 32px on desktop. `overflow-x: clip` on html and body.
- Touch targets are at least 44px everywhere (`h-11` buttons, 44×44 menu button, 56px mobile menu rows, 48px footer group rows).
- Below 360px the header shows the logo mark only, so the logo, the quote button and the menu button fit at 320px.

## Logo

An SVG lockup in `src/components/Logo.tsx`, with the mark repeated in `src/app/icon.svg`. The mark is a deep-green (brand-700) rounded tile holding an open white ring that reads as a "G", with its crossbar, and a pastel atom (brand-200) sitting in the ring's gap: a letter and a molecule in one shape. The wordmark is "Goodbiz" in Bricolage 700 ink with "Chem" in Bricolage 500 brand-700. The root `<svg>` has `role="img"` and `aria-label="Goodbiz Chem"`. The text uses `textLength` so the lockup never clips if a fallback font is used.

## Motion (emil-design-eng + Hallmark)

- Easing: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for anything entering; `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement. Never the browser's default `ease`, and never a bounce.
- Buttons: `scale(0.97)` on `:active`, 160ms (`--duration-press`). Colour changes on hover only under `@media (hover: hover)`, so taps never leave a stuck hover state.
- Mobile menu: opens with a 180ms (`--duration-menu`) opacity fade and a 6px drop via `@starting-style`. It closes instantly, because closing is often keyboard-driven (Escape), and keyboard actions are never animated.
- Focus rings are never animated (2px brand-600 outline, 2px offset).
- Animate only `transform` and `opacity`, and name the properties (no `transition: all`). No scroll-reveal on every section, no parallax, no infinite loops apart from the Task 8 hero scene, which pauses off-screen.
- `prefers-reduced-motion: reduce` sets transition and animation durations to zero.

## Home page and 3D hero (Task 8)

- **Section order (Catalogue):** hero (inventory header) → who we are → product range (`ProductFinder`, the full 19-row index) → how ordering and export work (four ordinal steps) → FAQ → closing quote panel. No feature grid, no stats band, no testimonials. Task 9 adds latest posts before the closing panel.
- **Hero copy:** the h1 is an inventory header with a real count ("19 industrial chemicals, listed by HSN code"), not a slogan. Under the buttons, a one-line ledger of the four groups with their product counts, computed from the catalogue data.
- **Hero concept:** a single ball-and-stick molecule (a six-membered ring in a chair shape with a branched side chain) that turns slowly, about 70 seconds a turn, with a slight rocking tilt. It sits in a 4:3 `brand-50` panel beside the text on desktop and below it on phones. Atoms are `brand-400`/`brand-500` with one `brand-600` heteroatom; light terminal atoms are `brand-200`/`brand-300`; bonds are `brand-300`. Matte standard material, hemisphere light plus one key light, no shadows, no post-processing, transparent canvas so the panel colour shows through.
- **Why this:** it reads as "chemistry" at a glance without naming or depicting any specific product, so it claims nothing. It is calm enough to sit beside the h1 without competing with it.
- **Cost:** two instanced meshes (atoms, bonds), so two draw calls; 18 atoms, 18 bonds. `three` is dynamically imported, so it is not in the initial bundle.
- **Loading:** the server renders only `public/hero-fallback.webp`, a frame captured from the scene at its starting pose. The scene mounts only when WebGL works, reduced motion is off, the panel is in view and the browser is idle. Its canvas fades in over the still (300ms, `--ease-out`, opacity only); the still steps out after the fade. The scene pauses off-screen and in hidden tabs, caps the pixel ratio at 1.5 (1 when `hardwareConcurrency <= 4`), and disposes every GPU resource on unmount. Turning reduced motion on mid-visit removes it.
- **Motion elsewhere on the home page:** none beyond the existing button press and FAQ icon. No scroll reveals.

## Interaction and accessibility

- The mobile menu is a disclosure: a "Menu" button with `aria-expanded` and `aria-controls`, a `<nav aria-label="Site">` panel and a scrim. While open, Tab cycles between the button and the menu links; Escape closes the menu and returns focus to the button. It also closes when a link is clicked, when the route changes, when the scrim is tapped, or when the window grows to desktop width. Page scroll is locked while it's open.
- The header is sticky with a solid white background and a hairline border. The quote CTA is always visible, at every width.
- Contact details render only when they are filled in `src/config/site.ts`. Today nothing renders.

## Honest content rules (carried from the spec)

No certifications, years, volumes, countries served, purity or compliance claims. The footer says only what's true: the tagline, the product groups with their HSN chapters (from the spec's code table) and "SDS available on request".

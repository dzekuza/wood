# Craft Wood Furniture — Design System

> A warm, geometric, dark/light system for the CWF brand. Built around the cross-weave mark, the Mark Bold display face and the Walnut · Oak · Linen palette.

---

## 1. Design principles

| Principle | What it means in practice |
|---|---|
| **Warmth first** | Linen surfaces, oak gold accents, natural imagery. Never sterile white. Backgrounds default to `--surface` (#F3EFEA) not pure `#fff`. |
| **Geometric precision** | The cross-weave mark mirrors timber joinery. Tight tracking on Mark Bold (-3 to -4.5%), 24px bento radii, 8px button radii — structured, never rigid. |
| **Dark / light duality** | Charcoal panels anchor the brand (hero, craft, newsletter, footer). Linen sections breathe. Alternate to create vertical rhythm. |
| **One typeface for emotion, one for clarity** | Mark Bold = anything you'd say out loud. Plus Jakarta Sans = anything you'd read silently. Never mix roles. |
| **Real materials over icons** | Photography of wood, hands, joinery > illustrated icons. Tabler icons are functional UI only (cart, heart, ruler). |

---

## 2. Color tokens

All colors live as CSS custom properties on `:root` and should be referenced by token, never by hex inline.

```css
:root{
  --primary:    #4A2F1F;  /* Dark Walnut — CTAs, headings, primary text on light */
  --accent:     #C9A27A;  /* Warm Oak — icons, borders, hover states, mark */
  --accent-deep:#7A5A3A;  /* Deeper oak — eyebrows, secondary text on light */
  --surface:    #F3EFEA;  /* Linen — page bg, card fills */
  --sand:       #E8DFD1;  /* Sand — secondary surfaces, icon tiles */
  --dark:       #2A2A2A;  /* Charcoal — dark sections, nav, footer-adjacent */
  --ink:        #1C1C1C;  /* Ink — true footer, marquee strip */
  --line:       rgba(74,47,31,.12);  /* hairlines on light */
  --line-dark:  rgba(201,162,122,.18);/* hairlines on dark */
}
```

### Pairing rules

| On surface | Primary text | Secondary text | Accent | Hairline |
|---|---|---|---|---|
| `--surface` / `--sand` / `#fff` | `--primary` | `rgba(74,47,31,.65)` | `--accent-deep` | `--line` |
| `--dark` / `--ink` / `--primary` | `#f3efea` | `rgba(243,239,234,.65)` | `--accent` | `--line-dark` |

- Never put `--accent` (oak gold) on `--surface` for body text — contrast fails. Use `--accent-deep` instead.
- Never put `--primary` (walnut) on `--dark` — they collapse. Switch to `--accent` for CTAs in dark sections.
- Use opacity (`.55`, `.65`, `.72`) over additional gray tokens. The palette is deliberately small.

---

## 3. Typography

Three families, strict roles: one for true headings, one for prices/stats/pull-quotes, one for everything read.

```css
@font-face { font-family:'Mark'; font-weight:700; src:url('mark-bold.ttf'); }
@font-face { font-family:'Outfit'; font-weight:500; src:url('outfit-medium.ttf'); }
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
```

### Roles

| Family | Use for |
|---|---|
| **Outfit Medium** | Real headings only — `h1`/`h2`/`h3` and section titles (hero title, `.shead` title, FAQ/newsletter/process/testimonials section heads). One flat size across all of them: 56px desktop (36px mobile). |
| **Mark Bold** | Bento cell titles, prices, stat numbers, pull-quotes, repeated card names (product/category card titles). Anything *spoken* that isn't a structural heading. |
| **Plus Jakarta Sans** | Body, lede, subheads (H4/H5), nav, buttons, captions, eyebrows. Anything *read*. |

> ✋ Never use Mark Bold for buttons, navigation, body or anything ≤ 18px. The face is drawn for display only.
> ✋ Headings don't get a responsive type scale anymore — every real heading is 56px on desktop, 36px on mobile, regardless of hierarchy (h1 vs h2 vs a section title all match). Don't reach for a bigger/smaller size for "more important" headings; use weight, color, or layout for hierarchy instead.

### Scale

| Role | Class | Family · weight | Size | Tracking | Line-height |
|---|---|---|---|---|---|
| Heading (h1/h2/h3, section titles) | — | Outfit · 500 | 56px desktop / 36px mobile | -3% | 1.15 |
| Bento title | `.cell h3` | Mark · 700 | `clamp(28px,2.6vw,36px)` | -3.5% | .96 |
| Pull-quote | `.tcard q` | Mark · 700 | 22px | -3% | 1.2 |
| Price | `.pprice` | Mark · 700 | 24px | -3% | 1 |
| Stat num | `.craft-stats .num` | Mark · 700 | 44px | -4.5% | 1 |
| H4/H5 (subhead) | — | Jakarta · 600 | 16px | -.5% | 1.2 |
| Lede | `.lede` | Jakarta · 400 | 17px | -.5% | 1.6 |
| Body | (default) | Jakarta · 400 | 15px | 0 | 1.7 |
| Small | — | Jakarta · 400 | 13–14px | 0 | 1.55 |
| Eyebrow | `.eyebrow` | Jakarta · 600 | 11px | +18% UPPER | 1.4 |
| Label | `.label` | Jakarta · 600 | 11px | +14% UPPER | 1.4 |

### Rules

- Tighter tracking the larger the type. Mark at display sizes needs -4 to -4.5%. Body Jakarta stays at 0 to -0.3%.
- Line-height ladder: headings 1.15 → bento/pull-quote/price .96–1.2 → body 1.6–1.7 → micro 1.4–1.5.
- Italic is reserved for `<em>` inside hero headlines, where it switches color to `--accent` (oak) — used as an emphasis device, never a stylistic flourish.
- Numerals: use Mark Bold for prices and stat numbers (it has the warmth). Use Jakarta tabular nums for tables and dense data.

---

## 4. Spacing & radii

### Spacing scale (multiples of 4)

`4 · 8 · 12 · 14 · 18 · 24 · 32 · 48 · 64 · 96`

Section vertical rhythm: `96px` on desktop, `64px` on mobile. Inter-card gap: `14–18px`. Inter-section padding: `48–64px` inside boxed components (features, newsletter).

### Radius scale

| Token | Value | Used on |
|---|---|---|
| sm | 4–6px | Tags |
| md | 8px | Buttons, inputs |
| lg | 12–14px | Floaters, hero badge, small cards |
| xl | 18–24px | Product cards, step cards, testimonial cards, bento, features, newsletter |
| pill | 99px | Chips, counts, pill buttons (newsletter submit) |

> Pick one per surface class. Don't mix 18px and 24px corners in the same section.

### Container

```css
.wrap{max-width:1320px;margin:0 auto;padding:0 32px;}
@media (max-width:780px){.wrap{padding:0 20px;}}
```

Every full-width section content lives in `.wrap`. The hero is the **only** full-bleed exception, and its inner padding uses `max(32px, calc((100vw - 1320px)/2 + 32px))` so the headline still aligns to the wrap edge.

---

## 5. Components

### Buttons

```html
<button class="btn btn-primary">Shop the collection</button>
<button class="btn btn-ghost">Watch the workshop</button>
<button class="btn btn-dark">Add to cart</button>
<button class="btn btn-line">Learn more</button>
```

| Variant | Bg | Fg | Use |
|---|---|---|---|
| `btn-primary` | `--accent` | `--primary` | Primary CTA on dark backgrounds |
| `btn-dark` | `--primary` | `#f3efea` | Primary CTA on light backgrounds |
| `btn-line` | transparent | `--primary` | Secondary CTA on light |
| `btn-ghost` | transparent | `#f3efea` | Secondary CTA on dark |

All buttons: `padding:14px 22px; border-radius:8px; font-size:14px; font-weight:600; letter-spacing:.01em;`. Active state: `transform:translateY(1px)`. Hover: lighten bg or color-shift border.

### Eyebrow + section head

Every section opens with the same anatomy:

```html
<div class="shead">
  <div>
    <div class="eyebrow">Collections</div>
    <h2 class="h2 title">A piece for every room, built once.</h2>
  </div>
  <div class="right"><a href="#">Browse all <i class="ti ti-arrow-right"></i></a></div>
</div>
```

- Eyebrow color: `--accent-deep` on light, `--accent` on dark, preceded by a 24px `1px` accent bar.
- Title max-width 740px, lives directly under eyebrow with 14px gap.
- Right-side link is optional, 13px Jakarta 600, accent underline, gap grows on hover.

### Product card (`.pcard`)

- `aspect-ratio:1/1` image with optional `.pbadge` top-left and `.pheart` top-right.
- Padding: `16px 18px 18px`.
- Anatomy: tags row (`.ptag · .ptag`) → name (`.pname`) → desc (`.pdesc`) → row of price + add button (`.padd` rotates 90° on hover).

### Step / process card (`.step`)

- Sand-filled rounded icon tile (48px, 12px radius), step number eyebrow above, 24px Mark heading, 14px Jakarta body.

### Bento (`.bento .cell`)

- 3-col grid, large featured cell spans 2 rows.
- Mix surfaces: `.cell` default light sand; `.cell.dark` charcoal; `.cell.primary` walnut.
- Image gets a 30–55% bottom darkening gradient so the white title stays legible regardless of photo content.

### Testimonial (`.tcard`)

- Stars → Mark Bold 22px quote → divider → small avatar + name + role.
- Quote uses `<q>` with `quotes:none` and reset pseudo-elements — visual quote glyph comes from layout, not punctuation.

### Newsletter strip (`.news`)

- 24px radius, charcoal bg, big `bg-mark` watermark at 6% opacity behind copy.
- Form is a single pill input + submit. Pill radius `99px`, internal 6px padding, accent submit button.

---

## 6. Imagery

- **Real photography**, warm-toned, natural light. Wood grain visible. Hands working.
- All placeholders use a monospace `.ph-label` chip on a striped diagonal sand background, indicating *what should go there* (e.g. `LIVING ROOM`, `JOINER PLANING OAK`). Never hand-draw furniture in SVG.
- Aspect ratios: hero 1:1.1, product 1:1, craft 5:6, bento variable.
- Always apply a bottom gradient overlay (`rgba(0,0,0,.55)` on dark cells, `rgba(74,47,31,.35)` on light) when text sits on top.

---

## 7. Motion

Restrained. The wood doesn't move; the interface shouldn't either.

| Element | Trigger | Effect | Duration |
|---|---|---|---|
| Nav links | hover | color → `--accent` | 150ms |
| Buttons | hover | bg lighten / color invert | 150ms |
| Buttons | active | `translateY(1px)` | — |
| Product cards | hover | `translateY(-3px)` + soft shadow | 200ms |
| Bento cells | hover | `translateY(-3px)` | 250ms |
| Add-to-cart `.padd` | hover | `rotate(90deg)` + color flip | 150ms |
| "Browse all" link | hover | `gap` grows 6→10px | 200ms |
| Marquee strip | continuous | `translateX(-50%)` linear | 38s |

No parallax. No scroll-triggered fades. Page loads instantly.

---

## 8. Iconography

- **Tabler icons** at 18–24px, stroke 1.5–2px.
- Accent color (`--accent`) on dark backgrounds and inside icon tiles. `--primary` on light when sitting on a sand tile.
- Reserved set: `armchair`, `hammer`, `tree`, `heart`, `shopping-cart`, `star`, `ruler`, `package`, `certificate`, `palette`, `map-pin`, `phone`, `arrow-right`.

---

## 9. Layout patterns

### Section rhythm (top → bottom)

1. **Dark** — Nav + hero (charcoal)
2. **Ink** — Marquee strip
3. **Light** — Collections (bento)
4. **Light** — Featured products
5. **Dark** — Craft / workshop story
6. **Light** — Process steps
7. **Boxed dark** — Features bar (inside light wrap)
8. **Light** — Testimonials
9. **Boxed dark** — Newsletter (inside light wrap)
10. **Ink** — Footer

Never two consecutive dark sections at full-bleed. Use the "boxed dark" pattern (24px radius dark card on light bg) to break up otherwise heavy stretches.

### Grids

| Section | Cols (desktop) | Cols (mobile) | Gap |
|---|---|---|---|
| Bento | 3 | 1–2 | 14px |
| Products | 4 | 2 | 18px |
| Process | 4 | 2 → 1 | 18px |
| Features | 4 | 2 | 32px |
| Testimonials | 3 | 1 | 18px |
| Footer | 4 (1.4·1·1·1) | 2 | 48px |

---

## 10. Voice & copy

- **Tone**: artisan, grounded, never precious. Talk about wood, hands, joints, hours.
- **Sentence length**: short. Comma splices welcome when they evoke craft rhythm.
- **Forbidden**: "luxury", "premium", "elevated", "curated", "experience" as a noun.
- **Encouraged**: "built", "joined", "finished", "by hand", "to last", named woods (oak, walnut, ash).
- **Numbers**: spelled out under 10 in body, numerals in stats and prices.
- **Buttons**: verbs, 1–3 words. "Shop", "Browse", "Visit the workshop". Not "Click here", not "Discover".

---

## 11. Accessibility floor

- Body text ≥ 15px. Captions ≥ 11px only for uppercase tracked labels.
- All accent-on-dark and primary-on-light pairs pass WCAG AA at body sizes.
- Hit targets ≥ 36×36px (cart button, heart button, add button).
- Focus rings: `outline:2px solid var(--accent); outline-offset:2px;` — never `outline:none` without a replacement.
- Every interactive `<a>` and `<button>` has a hover **and** a focus state.

---

## 12. File structure

```
/
├─ Landing Page.html        # canonical page, all styles inline in <style>
├─ mark-font.css            # @font-face for Mark Bold
├─ mark-bold.ttf            # the font
├─ DESIGN.md                # this file
└─ images/                  # photography (drop in to replace placeholders)
```

When extracting to a multi-page site, lift the `<style>` block to `tokens.css` (the `:root` vars) + `components.css` (everything else) and keep this doc as the source of truth.

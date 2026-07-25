# Landing Page Scroll Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scroll-triggered reveal / slide-in / stagger animations to every section, card, and heading on the CWF landing page (`app/routes/_index.tsx`) using Motion (`motion/react`).

**Architecture:** Two new reusable primitives (`Reveal`, `StaggerGroup`/`StaggerItem`) built on the existing `useIsInView` hook, driven by a shared token file (`app/lib/motion.ts`). Each of the landing page's 9 section components gets wrapped with these primitives — no new state, no new dependencies.

**Tech Stack:** Motion (`motion@^12.42.2`, already installed), React 19, existing `~/hooks/use-is-in-view` hook.

## Global Constraints

- Motion only — do not introduce GSAP for this work (spec: "Library choice").
- Easing: `EASE_OUT = [0.23, 1, 0.32, 1]` (strong custom ease-out) for every entrance animation. Never `ease-in`.
- Duration: `DURATION = 0.5` (500ms) as the default for section/card reveals.
- Slide distance: `DISTANCE = 20` (px).
- Stagger: `STAGGER = 0.07` (70ms/item).
- Animate only `transform` and `opacity` — never `top`/`left`/`width`/`height`/`margin`.
- Scale reveals start at `scale(0.96)`, never `scale(0)`.
- Where a component renders in the first viewport during page load (Hero), use the full `transform: 'translateY(...)'` string form, not Motion's `x`/`y` shorthand, for hardware acceleration.
- Respect `prefers-reduced-motion` — Motion's `useInView`/`animate` already does this by default; verify, don't assume.
- No test runner is configured in this project (no Vitest/Jest/Playwright script in `package.json`). Verification for every task is: `npm run typecheck` (must not introduce new errors beyond the 4 pre-existing ones in `PaginatedResourceSection.tsx`/`SearchForm.tsx`) + manual visual check via `npx shopify hydrogen dev --port 3001 --disable-version-check` in a browser.

---

### Task 1: Motion tokens

**Files:**
- Create: `app/lib/motion.ts`

**Interfaces:**
- Produces: `EASE_OUT: number[]`, `DURATION: number`, `DISTANCE: number`, `STAGGER: number` — consumed by every task below.

- [ ] **Step 1: Create the tokens file**

```ts
// app/lib/motion.ts
export const EASE_OUT = [0.23, 1, 0.32, 1];
export const DURATION = 0.5;
export const DISTANCE = 20;
export const STAGGER = 0.07;
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add app/lib/motion.ts
git commit -m "feat: add shared motion tokens for landing page animations"
```

---

### Task 2: `Reveal` primitive

**Files:**
- Create: `app/components/animate-ui/Reveal.tsx`

**Interfaces:**
- Consumes: `EASE_OUT`, `DURATION`, `DISTANCE` from `~/lib/motion` (Task 1); `useIsInView` from `~/hooks/use-is-in-view` (existing).
- Produces: `Reveal` component — `<Reveal delay={0.1} y={20} once className="...">{children}</Reveal>`. Renders a `motion.div` (all standard `motion.div` props pass through via `...props`, including `className`).

- [ ] **Step 1: Create the component**

```tsx
// app/components/animate-ui/Reveal.tsx
import {motion, type HTMLMotionProps} from 'motion/react';
import {useIsInView} from '~/hooks/use-is-in-view';
import {DISTANCE, DURATION, EASE_OUT} from '~/lib/motion';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  y?: number;
  once?: boolean;
}

function Reveal({delay = 0, y = DISTANCE, once = true, children, ref: externalRef, ...props}: RevealProps) {
  const {ref, isInView} = useIsInView<HTMLDivElement>(externalRef ?? null, {inViewOnce: once});

  return (
    <motion.div
      ref={ref}
      initial={{opacity: 0, transform: `translateY(${y}px)`}}
      animate={isInView ? {opacity: 1, transform: 'translateY(0px)'} : undefined}
      transition={{duration: DURATION, delay, ease: EASE_OUT}}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export {Reveal, type RevealProps};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 3: Manual smoke check**

Temporarily wrap the `<h1>` in `HeroSection` (`app/routes/_index.tsx` line ~157) with `<Reveal>` and load `http://localhost:3001/` in a browser to confirm it fades/slides in on mount, then revert this temporary edit (Task 4 does the real Hero wiring).

- [ ] **Step 4: Commit**

```bash
git add app/components/animate-ui/Reveal.tsx
git commit -m "feat: add Reveal scroll-in animation primitive"
```

---

### Task 3: `StaggerGroup` / `StaggerItem` primitives

**Files:**
- Create: `app/components/animate-ui/StaggerGroup.tsx`

**Interfaces:**
- Consumes: `DISTANCE`, `DURATION`, `EASE_OUT`, `STAGGER` from `~/lib/motion` (Task 1); `useIsInView` (existing).
- Produces: `StaggerGroup` (wraps a list container, triggers cascade) and `StaggerItem` (wraps each child) — used together: `<StaggerGroup><StaggerItem>...</StaggerItem><StaggerItem>...</StaggerItem></StaggerGroup>`.

- [ ] **Step 1: Create the component**

```tsx
// app/components/animate-ui/StaggerGroup.tsx
import {motion, type HTMLMotionProps, type Variants} from 'motion/react';
import {useIsInView} from '~/hooks/use-is-in-view';
import {DISTANCE, DURATION, EASE_OUT, STAGGER} from '~/lib/motion';

const containerVariants: Variants = {
  hidden: {},
  visible: {transition: {staggerChildren: STAGGER}},
};

const itemVariants: Variants = {
  hidden: {opacity: 0, transform: `translateY(${DISTANCE}px)`},
  visible: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: {duration: DURATION, ease: EASE_OUT},
  },
};

interface StaggerGroupProps extends HTMLMotionProps<'div'> {
  once?: boolean;
}

function StaggerGroup({once = true, children, ref: externalRef, ...props}: StaggerGroupProps) {
  const {ref, isInView} = useIsInView<HTMLDivElement>(externalRef ?? null, {inViewOnce: once});

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function StaggerItem({children, ...props}: Omit<HTMLMotionProps<'div'>, 'ref'>) {
  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}

export {StaggerGroup, StaggerItem};
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/animate-ui/StaggerGroup.tsx
git commit -m "feat: add StaggerGroup/StaggerItem cascade animation primitives"
```

---

### Task 4: Animate `HeroSection`

**Files:**
- Modify: `app/routes/_index.tsx:148-183` (the `HeroSection` function)

**Interfaces:**
- Consumes: `Reveal` (Task 2). Hero is above the fold, so it animates on mount, not on scroll — use `once` default and no `useIsInView` gating needed; `Reveal` already handles this since the element starts in view.

- [ ] **Step 1: Import `Reveal`**

Add to the top of `app/routes/_index.tsx`, alongside the other `~/components/animate-ui/*` imports (after line 14):

```tsx
import {Reveal} from '~/components/animate-ui/Reveal';
```

- [ ] **Step 2: Wrap the hero head content**

Replace:

```tsx
        <div className="hero-head">
          <h1>
            Built by hand.
            <br />
            Made to <em>last a lifetime.</em>
          </h1>
          <div className="hero-cta">
            <Link to="/collections/all" className="btn btn-primary btn-pill">
              Shop the collection
            </Link>
            <Link to="/about" className="btn btn-line btn-pill">
              Our story
            </Link>
          </div>
        </div>
```

With:

```tsx
        <div className="hero-head">
          <Reveal>
            <h1>
              Built by hand.
              <br />
              Made to <em>last a lifetime.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.08} className="hero-cta">
            <Link to="/collections/all" className="btn btn-primary btn-pill">
              Shop the collection
            </Link>
            <Link to="/about" className="btn btn-line btn-pill">
              Our story
            </Link>
          </Reveal>
        </div>
```

- [ ] **Step 3: Wrap the showcase column**

Replace:

```tsx
        <div className="hero-showcase">
          <HeroShowcaseCard collection={doorStops} />
          <HeroShowcaseCard collection={shelves} />
          <div className="hero-showcase-wide">
            <HeroShowcaseRow collection={mantelBeams} />
            <HeroShowcaseRow collection={coatRacks} />
          </div>
        </div>
```

With:

```tsx
        <Reveal delay={0.16} className="hero-showcase">
          <HeroShowcaseCard collection={doorStops} />
          <HeroShowcaseCard collection={shelves} />
          <div className="hero-showcase-wide">
            <HeroShowcaseRow collection={mantelBeams} />
            <HeroShowcaseRow collection={coatRacks} />
          </div>
        </Reveal>
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 5: Visual check**

Run `npx shopify hydrogen dev --port 3001 --disable-version-check`, load `http://localhost:3001/`. Confirm: headline fades/slides up first, CTA buttons ~80ms after, showcase column ~160ms after, all sliding up 20px with no layout shift.

- [ ] **Step 6: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate hero section entrance"
```

---

### Task 5: Animate `SaleShowcaseSection` (heading + carousel cards)

**Files:**
- Modify: `app/routes/_index.tsx` — `SaleShowcaseSection` (~line 249) and `SaleShowcaseCarousel` (~line 279)

**Interfaces:**
- Consumes: `Reveal` (Task 2), `StaggerGroup`/`StaggerItem` (Task 3).

- [ ] **Step 1: Wrap the section title in `Reveal`**

Replace:

```tsx
        <h2 className="sale-showcase-title">On sale this month.</h2>
```

With:

```tsx
        <Reveal>
          <h2 className="sale-showcase-title">On sale this month.</h2>
        </Reveal>
```

- [ ] **Step 2: Wrap the carousel track in `StaggerGroup`/`StaggerItem`**

In `SaleShowcaseCarousel`, replace:

```tsx
      <div className="sale-carousel-track" ref={trackRef} onScroll={handleScroll}>
        {items.map((product) => (
          <SaleProductCard key={product.id} product={product} isSale={isSale} />
        ))}
      </div>
```

With:

```tsx
      <StaggerGroup className="sale-carousel-track" onScroll={handleScroll}>
        {items.map((product) => (
          <StaggerItem key={product.id}>
            <SaleProductCard product={product} isSale={isSale} />
          </StaggerItem>
        ))}
      </StaggerGroup>
```

Note: `trackRef` (a plain `useRef<HTMLDivElement>`) is used elsewhere in `SaleShowcaseCarousel` (`measure()`, `scrollByPage()`) to read/scroll the track element. Since `StaggerGroup` owns its own internal ref for in-view detection, forward `trackRef` in too by adding a `ref` prop passthrough: update `StaggerGroup` usage to `<StaggerGroup ref={trackRef} className="sale-carousel-track" onScroll={handleScroll}>`. `StaggerGroup`'s internal `useIsInView` call already merges an external ref via `React.useImperativeHandle` inside the hook, so passing `ref={trackRef}` composes correctly with its own internal ref — this is the same merge pattern the hook already supports (see `app/hooks/use-is-in-view.tsx`).

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 4: Visual check**

Reload `http://localhost:3001/`, scroll to the "On sale this month." section. Confirm heading reveals first, then cards cascade in left-to-right ~70ms apart. Confirm carousel arrows/scroll still work (drag/scroll the track, click prev/next).

- [ ] **Step 5: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate sale showcase heading and carousel cards"
```

---

### Task 6: Animate `WorkshopStepsSection`

**Files:**
- Modify: `app/routes/_index.tsx` — `WorkshopStepsSection` (~line 464)

**Interfaces:**
- Consumes: `Reveal`, `StaggerGroup`/`StaggerItem`.

- [ ] **Step 1: Wrap title and cards**

Replace:

```tsx
        <h2 className="workshop-title">
          Every piece passes through
          <br />
          four pairs of hands.
        </h2>
        <div className="workshop-grid">
          <div className="workshop-photo">
            <img src="/images/bento-1.jpg" alt="Craftsman shaping timber in the workshop" />
          </div>
          <div className="workshop-cards">
            {WORKSHOP_STEPS.map((step) => (
              <AnimateIcon key={step.title} animateOnHover asChild>
                <div className="workshop-card">
                  <step.Icon className="ic" size={64} />
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </div>
              </AnimateIcon>
            ))}
          </div>
        </div>
```

With:

```tsx
        <Reveal>
          <h2 className="workshop-title">
            Every piece passes through
            <br />
            four pairs of hands.
          </h2>
        </Reveal>
        <div className="workshop-grid">
          <Reveal delay={0.1} className="workshop-photo">
            <img src="/images/bento-1.jpg" alt="Craftsman shaping timber in the workshop" />
          </Reveal>
          <StaggerGroup className="workshop-cards">
            {WORKSHOP_STEPS.map((step) => (
              <StaggerItem key={step.title}>
                <AnimateIcon animateOnHover asChild>
                  <div className="workshop-card">
                    <step.Icon className="ic" size={64} />
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                </AnimateIcon>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 3: Visual check**

Scroll to the "Every piece passes through four pairs of hands." section. Confirm title reveals, photo reveals slightly after, then the 4 step cards cascade in. Confirm hover-animated icons (`AnimateIcon`/`animateOnHover`) still animate on hover as before.

- [ ] **Step 4: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate workshop steps section"
```

---

### Task 7: Animate `SaleSpotlightSection`

**Files:**
- Modify: `app/routes/_index.tsx` — `SaleSpotlightSection` (~line 497) and `SaleSpotlightCarousel` (~line 536)

**Interfaces:**
- Consumes: `Reveal`, `StaggerGroup`/`StaggerItem`.

- [ ] **Step 1: Wrap title and photo**

Replace:

```tsx
        <h2 className="spotlight-title">
          Fresh off the bench.
          <br />
          Ready to bring home.
        </h2>
        <div className="spotlight-grid">
          <div className="spotlight-photo">
            <img src="/images/bento-2.jpg" alt="A finished piece styled in a home" />
          </div>
```

With:

```tsx
        <Reveal>
          <h2 className="spotlight-title">
            Fresh off the bench.
            <br />
            Ready to bring home.
          </h2>
        </Reveal>
        <div className="spotlight-grid">
          <Reveal delay={0.1} className="spotlight-photo">
            <img src="/images/bento-2.jpg" alt="A finished piece styled in a home" />
          </Reveal>
```

- [ ] **Step 2: Stagger the spotlight cards**

In `SaleSpotlightCarousel`, replace:

```tsx
      <div className="spotlight-cards">
        {current.map((product) => (
          <SaleProductCard key={product.id} product={product} isSale={isSale} />
        ))}
      </div>
```

With:

```tsx
      <StaggerGroup className="spotlight-cards">
        {current.map((product) => (
          <StaggerItem key={product.id}>
            <SaleProductCard product={product} isSale={isSale} />
          </StaggerItem>
        ))}
      </StaggerGroup>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 4: Visual check**

Scroll to "Fresh off the bench." Confirm title/photo reveal, then the 2 spotlight cards stagger in. Click pagination arrows and confirm the newly-paged-in cards still render immediately (no broken state) — stagger only applies on the group's first scroll-into-view, not on every page change, which is expected since `once` defaults to `true`.

- [ ] **Step 5: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate sale spotlight section"
```

---

### Task 8: Animate `CraftLightSection`

**Files:**
- Modify: `app/routes/_index.tsx` — `CraftLightSection` (~line 600)

**Interfaces:**
- Consumes: `Reveal`. Text slides from the left (negative `y` isn't applicable here — this is a horizontal slide, so pass an explicit `initial`/`animate` override via the `x`-style transform string rather than reusing `y`). Add a small local variant inline since `Reveal` only supports vertical (`y`) slides per its Task 2 interface.

- [ ] **Step 1: Wrap the copy column (slides from left) and visual column (slides from right)**

Replace:

```tsx
        <div className="craft-light-top">
          <div className="craft-light-copy">
```

With:

```tsx
        <div className="craft-light-top">
          <motion.div
            ref={craftCopyRef}
            className="craft-light-copy"
            initial={{opacity: 0, transform: 'translateX(-20px)'}}
            animate={craftCopyInView ? {opacity: 1, transform: 'translateX(0px)'} : undefined}
            transition={{duration: DURATION, ease: EASE_OUT}}
          >
```

And replace the closing `</div>` of `craft-light-copy` (the one directly before `<div className="craft-light-visual">`) with `</motion.div>`.

Then replace:

```tsx
          <div className="craft-light-visual">
```

With:

```tsx
          <motion.div
            ref={craftVisualRef}
            className="craft-light-visual"
            initial={{opacity: 0, transform: 'translateX(20px)'}}
            animate={craftVisualInView ? {opacity: 1, transform: 'translateX(0px)'} : undefined}
            transition={{duration: DURATION, ease: EASE_OUT}}
          >
```

And its closing `</div>` (before the two chevron-arrow buttons' sibling closes) with `</motion.div>`.

- [ ] **Step 2: Add the required hooks/imports and stats stagger**

At the top of `CraftLightSection`, right after the existing `useState` declarations, add (note: the inner refs must be declared via top-level `useRef` calls, not created inline inside the `useIsInView` call, since a fresh ref object on every render would break `useImperativeHandle`'s attach inside the hook):

```tsx
  const craftCopyLocalRef = useRef<HTMLDivElement>(null);
  const craftVisualLocalRef = useRef<HTMLDivElement>(null);
  const {ref: craftCopyRef, isInView: craftCopyInView} = useIsInView<HTMLDivElement>(
    craftCopyLocalRef,
    {inViewOnce: true},
  );
  const {ref: craftVisualRef, isInView: craftVisualInView} = useIsInView<HTMLDivElement>(
    craftVisualLocalRef,
    {inViewOnce: true},
  );
```

Add imports at the top of `app/routes/_index.tsx`:

```tsx
import {motion} from 'motion/react';
import {useIsInView} from '~/hooks/use-is-in-view';
import {DURATION, EASE_OUT} from '~/lib/motion';
```

(`useRef` is already imported on line 3.)

Then wrap the stats row using `StaggerGroup`/`StaggerItem` — replace:

```tsx
        <div className="craft-light-stats">
          {CRAFT_LIGHT_STATS.map((stat) => (
            <div key={stat.cap} className="craft-light-stat">
              <div className="num">{stat.num}</div>
              <div className="cap">{stat.cap}</div>
            </div>
          ))}
        </div>
```

With:

```tsx
        <StaggerGroup className="craft-light-stats">
          {CRAFT_LIGHT_STATS.map((stat) => (
            <StaggerItem key={stat.cap} className="craft-light-stat">
              <div className="num">{stat.num}</div>
              <div className="cap">{stat.cap}</div>
            </StaggerItem>
          ))}
        </StaggerGroup>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 4: Visual check**

Scroll to "Four pairs of hands. One bench at a time." Confirm the copy column slides in from the left and the image/carousel column slides in from the right simultaneously, then the 4 stats cascade in below. Confirm the image carousel's prev/next arrows and the lightbox (click image) still work.

- [ ] **Step 5: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate craft light section with opposite-side reveal"
```

---

### Task 9: Animate `GallerySection`

**Files:**
- Modify: `app/routes/_index.tsx` — `GallerySection` (~line 681)

**Interfaces:**
- Consumes: `StaggerGroup`/`StaggerItem`. Uses a scale variant instead of the default slide — pass `initial`/`animate`/`variants` overrides directly via props since `StaggerItem` accepts standard `motion.div` props and its own `variants` prop takes precedence when explicitly passed.

- [ ] **Step 1: Define a scale-in variant local to this section**

Add near the top of `GallerySection`, before the `return`:

```tsx
  const galleryItemVariants: Variants = {
    hidden: {opacity: 0, transform: 'scale(0.96)'},
    visible: {
      opacity: 1,
      transform: 'scale(1)',
      transition: {duration: DURATION, ease: EASE_OUT},
    },
  };
```

Add `Variants` to the `motion/react` import added in Task 8 (`import {motion, type Variants} from 'motion/react';`).

- [ ] **Step 2: Wrap the grid images**

Replace:

```tsx
        <div className="gallery-top">
          <div className="gallery-large">
            <img
              src={GALLERY_IMAGES[0].src}
              alt={GALLERY_IMAGES[0].alt}
              onClick={() => setLightboxIndex(0)}
            />
          </div>
          <div className="gallery-quad">
            {GALLERY_IMAGES.slice(1, 5).map((img, i) => (
              <div key={img.src} className="gallery-quad-item">
                <img src={img.src} alt={img.alt} onClick={() => setLightboxIndex(i + 1)} />
              </div>
            ))}
          </div>
        </div>
        <div className="gallery-bottom">
          {GALLERY_IMAGES.slice(5).map((img, i) => (
            <div key={img.src} className="gallery-bottom-item">
              <img src={img.src} alt={img.alt} onClick={() => setLightboxIndex(i + 5)} />
            </div>
          ))}
        </div>
```

With:

```tsx
        <StaggerGroup className="gallery-top">
          <StaggerItem className="gallery-large" variants={galleryItemVariants}>
            <img
              src={GALLERY_IMAGES[0].src}
              alt={GALLERY_IMAGES[0].alt}
              onClick={() => setLightboxIndex(0)}
            />
          </StaggerItem>
          <div className="gallery-quad">
            {GALLERY_IMAGES.slice(1, 5).map((img, i) => (
              <StaggerItem key={img.src} className="gallery-quad-item" variants={galleryItemVariants}>
                <img src={img.src} alt={img.alt} onClick={() => setLightboxIndex(i + 1)} />
              </StaggerItem>
            ))}
          </div>
        </StaggerGroup>
        <StaggerGroup className="gallery-bottom">
          {GALLERY_IMAGES.slice(5).map((img, i) => (
            <StaggerItem key={img.src} className="gallery-bottom-item" variants={galleryItemVariants}>
              <img src={img.src} alt={img.alt} onClick={() => setLightboxIndex(i + 5)} />
            </StaggerItem>
          ))}
        </StaggerGroup>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 4: Visual check**

Scroll to the gallery bento grid. Confirm images fade + scale up from 0.96→1 in a cascade (no slide), and clicking any image still opens the `Lightbox`.

- [ ] **Step 5: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate gallery section with scale-in stagger"
```

---

### Task 10: Animate `ArticlesSection` and `NewsletterSection`

**Files:**
- Modify: `app/routes/_index.tsx` — `ArticlesSection` (~line 736), `NewsletterSection` (~line 785)

**Interfaces:**
- Consumes: `Reveal`.

- [ ] **Step 1: Wrap the articles heading**

Replace:

```tsx
        <div className="shead">
          <div>
            <div className="eyebrow">From the Journal</div>
            <h2 className="title">Thoughts from the bench</h2>
          </div>
          <Link to="/blogs/journal" className="btn btn-line">
            All articles <i className="ti ti-arrow-right" />
          </Link>
        </div>
```

With:

```tsx
        <Reveal className="shead">
          <div>
            <div className="eyebrow">From the Journal</div>
            <h2 className="title">Thoughts from the bench</h2>
          </div>
          <Link to="/blogs/journal" className="btn btn-line">
            All articles <i className="ti ti-arrow-right" />
          </Link>
        </Reveal>
```

- [ ] **Step 2: Wrap the newsletter content block**

Replace:

```tsx
          <div className="news-content">
            <div className="eyebrow">The Journal</div>
            <h2 className="title">
              A letter from the bench, <em>once a month.</em>
            </h2>
            <p>
              Notes on timber, the slow business of joinery, and quiet word when a new collection is opening for orders. No marketing, ever.
            </p>
          </div>
```

With:

```tsx
          <Reveal className="news-content">
            <div className="eyebrow">The Journal</div>
            <h2 className="title">
              A letter from the bench, <em>once a month.</em>
            </h2>
            <p>
              Notes on timber, the slow business of joinery, and quiet word when a new collection is opening for orders. No marketing, ever.
            </p>
          </Reveal>
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: No new errors.

- [ ] **Step 4: Visual check**

Scroll to "Thoughts from the bench" and then to the newsletter block at the bottom. Confirm both reveal on scroll. Confirm the newsletter form (email input, subscribe button, `useFetcher` submit) still works — submit a test email and confirm the status message still appears.

- [ ] **Step 5: Commit**

```bash
git add app/routes/_index.tsx
git commit -m "feat: animate articles and newsletter section headings"
```

---

### Task 11: Reduced-motion verification and final regression pass

**Files:**
- None (verification only).

- [ ] **Step 1: Full typecheck**

Run: `npm run typecheck`
Expected: Same error count as the pre-existing baseline (4 errors in `PaginatedResourceSection.tsx`/`SearchForm.tsx`), no new errors from any file touched in Tasks 1-10.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: No new lint errors introduced by the new files or edits.

- [ ] **Step 3: Reduced-motion check**

In Chrome DevTools, open the Rendering tab → "Emulate CSS media feature prefers-reduced-motion" → set to `reduce`. Reload `http://localhost:3001/` and scroll through every section. Confirm: content still becomes visible (opacity still resolves to 1) but slide/scale movement and stagger delays are suppressed or negligible — Motion's default reduced-motion handling should already satisfy this; if any section still visibly slides, note it for a follow-up fix (do not silently ship it).

- [ ] **Step 4: Full scroll-through regression check**

With motion preference back to normal, reload and scroll from top to bottom of `http://localhost:3001/` once more. Confirm every section listed in the Scope (Hero, Sale Showcase, Workshop Steps, Sale Spotlight, Craft Light, Gallery, Articles, Newsletter) animates, no layout jank/shift occurs, and all pre-existing interactive elements (carousels, lightbox, newsletter form, nav) still function.

- [ ] **Step 5: Final commit (if any fixes were needed in Steps 1-4)**

```bash
git add -A
git commit -m "fix: address regressions found in landing page animation pass"
```

If no fixes were needed, skip this step — Task 10's commit is the last one.

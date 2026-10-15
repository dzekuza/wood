---
tags: [frontend, wip]
updated: 2026-10-15
---

# HTML Semantics & Accessibility

Semantic, accessible, SEO-correct markup is a hard rule, not a polish pass.

## Rules

- Native elements over `div`s: `button`, `a`, `nav`, `main`, `section`, `article`,
  `header`, `footer`, `dl`, `table`.
- Exactly one `<h1>` per page; a clean heading outline with no skipped levels.
  Chrome that renders on every page counts too: the drawer titles in `Aside`
  are `h2`, the search drawer's section labels are `h3`, and the shop
  sidebar's section labels (`CollectionFilters`, `CollectionCategoryNav`) are
  `h2`. Their look comes from class/selector rules, not the tag, so pick the
  level the outline needs and restyle if necessary.
- Named landmarks (`aria-label` on repeated `nav`/`section`).
- Real `<button>` for actions, real `<a href>` for navigation — never a clickable `div`.
- `alt` on every meaningful image; `alt=""` on decorative ones.
- Visible focus states; keyboard reachable in DOM order.
- Structured data as JSON-LD, not microdata.
- Respect `prefers-reduced-motion`.

## Checklist before shipping a page

- [ ] One `<h1>`, ordered headings
- [ ] Landmarks present and labelled
- [ ] All interactive elements keyboard-operable with visible focus
- [ ] Images have `alt`
- [ ] Colour contrast ≥ 4.5:1 for body text
- [ ] Form inputs have associated `<label>`s

## Related

[[component-conventions]] · [[seo-metadata]]

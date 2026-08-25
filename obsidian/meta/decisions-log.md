---
tags: [meta, decision]
updated: 2026-08-25
---

# Decisions Log (ADRs)

Architecture Decision Records. Each entry captures a choice, its context, and its
consequences. Use [[templates/adr-note]] for new entries. Newest first.

---

## ADR-0001 — Documentation lives in an in-repo Obsidian vault

- **Status:** Accepted
- **Date:** 2026-08-25

**Context.** Project knowledge (why a pattern exists, what not to touch, how to add
a feature) was scattered across chat history, READMEs, and people's heads. AI agents
re-derived it every session and got it wrong.

**Decision.** All project documentation lives in `obsidian/`, a linked Obsidian vault
committed to the repo. Root `AGENTS.md` / `CLAUDE.md` / `.cursorrules` are thin shims
pointing into it. Claude Code hooks inject the pointer at session start, remind on
every prompt, and block once at Stop when code changed without a doc update.

**Consequences.** Documentation is versioned with the code and reviewed in the same
PR. Every code change carries a doc obligation. Agents get consistent context without
re-reading the whole codebase.

---

## ADR-0002 — New Shopify collections require explicit confirmation before creation

- **Status:** Accepted
- **Date:** 2026-08-25

**Context.** Closing a Figma-vs-live gap in "Our Categories" required creating 2 new
collections directly in the live Shopify store (`Solid Oak Fireplace Surrounds`,
`Solid Oak Cube Blocks`) via the Admin API and publishing them to the storefront
sales channel. Unlike a local code edit, this is a live, customer-visible change to
shared store data — new nav entries, new indexable pages, real SEO/UX consequences —
and isn't trivially reversible the way reverting a commit is.

**Decision.** Before an agent creates, publishes, or materially restructures live
Shopify store data (collections, products, discounts, etc.) to satisfy a design or
content request, it asks the user to confirm first — even when the underlying
products/assets already exist and the change is well-justified. Routine code edits in
this repo do not require this; only writes that land directly on the connected
Shopify store do.

**Consequences.** One extra confirmation round-trip for store-data changes. In
exchange, the store owner always approves what becomes publicly visible before it
goes live, rather than discovering it after the fact.

---

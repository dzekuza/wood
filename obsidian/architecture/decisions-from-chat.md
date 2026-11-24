---
tags: [architecture, decisions]
updated: 2026-11-18
---

# Decisions from chat

Decisions, constraints and agreements from the Craftwood WhatsApp groups and CRM tasks that shape the architecture.

> [!warning] Not refreshed this run
> The 2026-11-18 automated run was told to skip WhatsApp and CRM reading. Nothing below was read from chats today. The one entry is taken from the read-only CRM mirror `TASKS.md` (scanned 2026-11-16). Formal decisions already recorded by the project live in [[decisions-log]] (ADRs 0014 to 0027); they are not copied here.

| Date       | Decision / constraint                                                                                                                                                                                                                  | Source                               | Affects                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------- |
| 2026-11-16 | Availability (In stock / Out of stock) filter on category pages is **blocked pending a client answer**; code currently hides the facet. `(from CRM task 617639c8, 2026-11-16, unverified against chat)`                                | `TASKS.md` mirror                    | [[codebase-map#collections              | collections]], [[deepening-candidates]] #3 |
| 2026-11-16 | Google Search Console domain verification (DNS TXT) is waiting on client DNS; two HTML verification files are served meanwhile. `(from CRM task 906325bd, 2026-11-16, unverified)`                                                     | `TASKS.md` mirror                    | `public/google*.html`, [[integrations]] |
| 2026-11-16 | Merchant Center "Misrepresentation" suspension: on-site claims must match written policies; one price across page, button and JSON-LD. `(from CRM task 0f854a06, 2026-11-16, unverified)`; code side recorded in ADR-0020 and ADR-0021 | `TASKS.md` mirror, [[decisions-log]] | [[codebase-map#product-page             | product-page]], [[codebase-map#seo         | seo]] |

TODO: unknown. Full chat review for the last 30 days still to be run.

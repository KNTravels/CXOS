# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`doc/` is a static, offline-first reference-documentation website for **CXOS (Customer Experience Operating System)** — a six-stage architecture (Data Sources → Ingestion Layer → Transformation & Processing → Unified Data Foundation → Intelligence & Services → Destinations & Activation) sourced from `doc/Application dessign and teck stack.jpeg`. Vanilla HTML/CSS/JS, no build step, no framework, no package.json.

`code/` is currently empty — reserved for a future application implementation. It has no relationship to `doc/` today.

## Collaboration note

This is a real multi-contributor GitHub repo (`KNTravels/CXOS`), not a solo/local project —
people work on feature branches (e.g. `naman-0802`, `jayant-0802`) merged via PRs into `main`.
**Always run `git status` and `git branch` before starting work**, and re-run
`tools/docgen/check-links.js` after pulling someone else's changes, since another contributor
may have added or reorganized detail pages you don't have generator data for locally. A
`deploy-pages`-style GitHub Actions workflow already publishes `doc/` — don't assume this is a
throwaway/local-only site.

## Site structure

```
doc/
├── index.html                 Overview: hero, architecture diagram, 6 module cards, Full
│                               Application Service Map, microservices diagram, end-to-end
│                               flow, cross-cutting horizontals, principles, legend
├── css/style.css               Shared styles (light/dark aware)
├── js/main.js                  Nav-tree collapsible toggles, active-link highlighting,
│                                lightbox, Service Map detail modal
├── img/cxos-architecture.jpeg  Original conceptual architecture diagram (index.html)
├── img/cxos-microservices-architecture.svg   Hand-authored microservices flow diagram (index.html)
├── img/lld-*.svg                Three LLD diagrams (sequence, ERD, deployment) — see LLD page below
└── pages/
    ├── brd.html                            Business Requirements Document (top-level, not a module)
    ├── lld.html                             Low-Level Design (top-level, not a module) — see below
    ├── data-sources.html                  \_
    ├── ingestion-layer.html                |  6 hand-written module pages.
    ├── transformation-processing.html      |  Each has a sticky side-nav, a module-intro
    ├── unified-data-foundation.html        |  block, and one <section id="submodule-anchor">
    ├── intelligence-services.html          |  per submodule. All 6 modules render each
    ├── destinations-activation.html       _/   submodule's items as a `.feature-grid` of
    │                                            `.feature-card` tiles (icon + accent bar +
    │                                            title + one-line description, linking to the
    │                                            detail page) — see "Submodule item cards" below.
    │
    ├── data-sources/*.html                 Generated detail pages, one per bullet
    ├── ingestion-layer/*.html              under each module's submodules. Each bullet
    ├── transformation-processing/*.html    on the parent module page links to one of
    ├── unified-data-foundation/*.html      these via <a href="data-sources/slug.html">.
    ├── intelligence-services/*.html
    └── destinations-activation/*.html
```

**There is no header nav anymore** (removed 2026-08-02, see "All Modules collapsible tree" below).
All navigation — Overview, BRD, LLD, and the 6 modules with their submodules nested underneath —
lives in the collapsible tree inside every page's `<aside class="side-nav">`.

## The generator (`tools/docgen/`)

Every file under `pages/<module>/*.html` (the "detail pages") is **generated**, not
hand-written — do not hand-edit them directly; edit the corresponding data file and regenerate.

```
tools/docgen/
├── genlib.js    Page template + nav template + the 6-stage HLD pipeline renderer
├── run.js       CLI: node run.js <module-file-slug> <path-to-data.js> [docRoot]
├── check-links.js   Validates every internal href/src across all pages (no server needed)
└── data/
    ├── data-sources-1.js            Customer Touchpoints (7 items)
    ├── data-sources-2.js            Business Systems + Files & Integrations (8 items)
    ├── ingestion-layer.js           All 5 submodules (15 items)
    ├── transformation-processing.js All 3 submodules (14 items)
    ├── unified-data-foundation.js   All 3 submodules (16 items)
    ├── intelligence-services.js     All 4 submodules (17 items)
    └── destinations-activation.js   All 4 submodules (15 items)
```

To regenerate a module after editing its data file:

```bash
cd tools/docgen
node run.js <module-file-slug> ./data/<file>.js
node check-links.js ../../doc      # always re-validate after
```

`docRoot` defaults to `../../doc` relative to `genlib.js`, so it works regardless of checkout
path — no need to pass it unless writing somewhere else.

### Submodule item cards (`.feature-grid` / `.feature-card`)

Module pages (hand-written, not generated) render each submodule's items as a card grid rather
than a plain bullet list, modeled on a Microsoft/Azure marketing-feature-grid pattern the user
supplied as a reference. Markup per item:

```html
<div class="feature-grid">
  <a class="feature-card" href="data-sources/web-mobile-apps.html">
    <div class="feature-icon">&#128187;</div>
    <h4 class="feature-card-title">Web / Mobile Apps</h4>
    <p>Highest-volume source of behavioral events across web and native apps.</p>
  </a>
  <!-- one .feature-card per item in the submodule -->
</div>
```

- `.feature-icon` — a single emoji in a light rounded-square box (uses `var(--brand-light)`, not
  the per-module accent, so icon tint stays consistent site-wide).
- `.feature-card-title` — bold title with a `::before` vertical accent bar colored via the
  section's `--card-accent`; text turns accent-colored on hover.
- The `<p>` — a **short, punchy one-liner** (~8-14 words), not the detail page's full `tagline`.
  Write a fresh condensed phrase per item; don't just truncate the tagline mid-sentence.
- Submodules with only one item (e.g. Streaming Ingestion → Redpanda) still use a one-item
  `.feature-grid` for visual consistency, not a bare link.
- CSS lives in `doc/css/style.css` under "Feature grid (submodule item cards)". The older
  `.feature-list` (plain bulleted `<li><a>`) CSS is still used for non-submodule bullet lists
  (Business Context, Integration Points, NFRs on detail pages, and other prose lists) — it's not
  dead, just no longer used for submodule item grids on any of the 6 module pages.

### "All Modules" collapsible tree side menu — the site's only nav now (2026-08-02)

The header dropdown nav (`<nav class="main-nav">`, `.nav-list`, `.dropdown`, `.nav-toggle`
hamburger) **has been removed from every page — HTML, CSS, and JS.** All cross-page navigation now
lives in a collapsible module tree inside every page's `<aside class="side-nav">`. This went
through several iterations before landing here (flat link list → tree with only the 6 modules
collapsible → Overview/BRD nested but pre-expanded → **current: everything uniform and closed by
default**) — don't resurrect any earlier intermediate form.

**What's on the page now — one uniform tree, identical structure everywhere:**
- `<div class="label">All Modules</div>` + `<ul class="nav-tree">` containing **9 entries, every
  one a `<li class="nav-tree-module">`**: Overview, BRD, LLD, then the 6 numbered modules. There
  are no plain `<li><a>` rows left in this list at all (Overview/BRD/LLD used to be plain links on
  every page except their own — the user pointed out via screenshot that this read as "missing"
  arrows and asked for consistency, so now all 9 always render as a toggle+sublist, everywhere,
  including on their own page).
- Each entry's `.nav-tree-row` has **two independent controls**: a `.nav-tree-link` (navigates to
  that page) and a separate `.nav-tree-toggle` button (expands/collapses its `.nav-tree-sub` list
  in place, no navigation). Clicking the label and clicking the caret do different things — don't
  merge them into one control.
- **Every toggle ships closed (`aria-expanded="false"`, no `.open` class) by default, on every
  page, including the page's own entry.** An earlier version pre-expanded the current page's own
  module so its content was visible without a click ("no flash of collapsed content") — the user
  explicitly asked for all-closed-until-clicked instead ("initially make all the menu closed...
  once clicked that menu will list all sub menu"), so that pre-expansion was removed everywhere.
  The current page's **link** still gets `.active` styling (bold/brand-colored) so you can tell
  where you are without expanding anything — only the *expansion* state changed, not the
  "which one is current" indicator.
- On **detail pages** (leaf pages), the current submodule anchor *within* its (collapsed) sublist
  still carries `class="active"` too — invisible until expanded, but correct once you open it.
- **There is no separate "On this page" block anywhere anymore.** Overview's 8 sections, BRD's 13
  sections, and LLD's 10 sections are each that entry's own `.nav-tree-sub` — same mechanism as a
  module's submodules, not a second list. This was the point of making Overview/BRD/LLD full tree
  entries: one mechanism for "this top-level thing has sub-sections," used uniformly by all 9.

**Three distinct relative-path schemes, by page depth — get this wrong and links break:**
- Detail pages (`pages/<module>/<slug>.html`, two levels under `doc/`): `../index.html` for
  Overview, `../<module>.html` (or bare `#anchor` for none — detail pages never self-reference)
  for modules.
- Module pages and `brd.html` (`pages/<file>.html`, one level under `doc/`): `../index.html` for
  Overview, **bare** `<module>.html` / `brd.html` (no `../`, same directory) for module links, and
  bare `#anchor` for the *active* module's own submodules specifically (any other module's
  submodules still need `<module>.html#anchor`).
- `index.html` (`doc/` root): `pages/<file>.html` for BRD/modules (no `../`), plain `#anchor` for
  its own on-page sections.

**Active-state classes are static (set per-page at generation/hand-edit time), separate from the
scroll-based JS highlighting** in `main.js`'s `updateActiveSideLink()` — that function only
touches `.side-nav a[href^='#']` (bare-anchor links) via scroll position, so it never conflicts
with the page-to-page `.nav-tree-link.active`/`.nav-tree-sub li a.active` classes, and the two
coexist in the same `<aside>` without stepping on each other.

**If a 7th module or a new hand-written top-level page is ever added**, update **all three**
places this tree is defined — there's no single source of truth across page types:
`MODULE_ANCHORS`/`sideModulesNavHtml()` in `genlib.js` (92 detail pages, regenerate after), the
hand-inserted tree block in each of the 6 module pages + `brd.html` + `lld.html`, and `index.html`'s
copy — each with its own path scheme per the list above. (`lld.html` was added 2026-08-02 as a
4th top-level page, right after BRD in every one of these copies — see "Low-Level Design (LLD)
page" below for its own content.) `CSS` for the tree (`.nav-tree*` classes) lives
right after `.side-nav li a.active` in `style.css`; the JS toggle handler
(`.nav-tree-toggle` click → flip `aria-expanded` + toggle `.open` on `btn.closest(".nav-tree-row")
.nextElementSibling`) is in `main.js`'s `DOMContentLoaded` handler.

**The `.caret` indicator is drawn with CSS borders, not the `&#8250;` (›) character sitting in the
markup** (`.nav-tree-toggle .caret { font-size: 0; ... }` hides that glyph; a `width`/`height` box
with only `border-right`/`border-bottom` set, rotated via `transform`, draws the actual visual
chevron — `rotate(45deg)` points it down when collapsed, `rotate(225deg)` flips it to point up
when `aria-expanded="true"`). This was changed from a plain rotating `›` character (2026-08-02,
user asked for "a small up/down arrow kind of" indicator instead) **without touching any of the
100+ HTML files** — the `<span class="caret">&#8250;</span>` markup already existed everywhere
from when the tree was first built, so the fix is CSS-only: the character is still technically in
the DOM (harmless — it's invisible at `font-size: 0`) and every page picks up the new chevron
automatically. If you ever touch this again, prefer the same trick (redefine what an existing
class draws) over another site-wide markup edit unless the HTML itself genuinely needs to change.

**`Overview` and `BRD` are now `.nav-tree-module` entries too, not plain links** — an earlier
version treated them as plain `<li><a class="nav-tree-link">` rows with a *separate* "On this
page" `<div class="label">`+`<ul>` block floating below all 6 modules; the user flagged (again,
with a screenshot) that this made the on-page section list look visually disconnected from
Overview/BRD instead of nested under them like every module's submodules are. Fixed by converting
both into `.nav-tree-module` rows — same link+toggle+`.nav-tree-sub` structure as the 6 modules —
with their own page's sections as the sublist, pre-expanded (`aria-expanded="true"` + `.open`)
since you're always "on" Overview when viewing `index.html` and "on" BRD when viewing `brd.html`.
The separate "On this page" block was then deleted from both files — it's fully subsumed by the
nested sublist now. **Detail pages and the 6 module pages don't need this same fix**: detail pages
never had a second on-page list to begin with, and module pages already fold their own submodule
list into their own tree entry (this was true since the collapsible tree was introduced) — only
`index.html`'s Overview and `brd.html`'s BRD had a page-with-its-own-sections-plus-a-place-in-the-
module-list situation, which is why they were the odd ones out.

**On `index.html` specifically, the sidebar starts at the very top of the page content, not partway
down.** An earlier version kept `.hero`, `.intro-story`, and `.badge-strip` full-width *above* the
`.module-page` grid (so the sidebar only appeared once you scrolled past them) — the user flagged
this with a screenshot showing the sidebar starting well below the fold and asked for it "from the
top left" instead. Fixed by moving `.hero`/`.intro-story`/`.badge-strip` **inside** the grid's
content `<div>` (right after `<aside>` closes, before the `#architecture` section) instead of
before `<div class="module-page">` — so now `<main class="page"> → <div class="module-page">
→ <aside>...` is the very first thing after the header on every page, `index.html` included, no
exception. None of `.hero`/`.intro-story`/`.badge-strip`'s CSS uses fixed/viewport widths (hero
uses `clamp()` for its `<h1>`, the badge grid is `repeat(auto-fit, minmax(170px, 1fr))`), so they
reflow naturally into the narrower content column — don't add special-casing to make them
full-width again, that would reintroduce the exact layout this fix removed.

**Header, post-removal:** `<header class="site-header">` on every page is just the brand logo in
the HTML source (`<a class="brand">...CXOS...</a>`) — the old `<nav>`/dropdown markup and its
`.nav-toggle` button were fully removed, not just hidden. Corresponding dead CSS (`nav.main-nav`,
`.nav-list`, `.nav-list > li`, `.dropdown`, `.nav-caret`) and dead JS (tap-to-open dropdown,
active-nav-by-page-path highlighting) were removed too — don't re-add stubs for markup that no
longer exists. **A `.nav-toggle` button exists again** (see "Mobile off-canvas sidebar drawer"
below), but it's a *different* control serving a *different* purpose — it toggles the sidebar
drawer open/closed, not a header dropdown — and critically, **it's not in any HTML file**: it's
created by `initSidebarDrawer()` in `main.js` and inserted into the DOM at runtime, right after
`.brand`. If you're looking for it in a page's source and can't find it, that's why — don't add it
to the HTML templates, that would create a duplicate.

### Mobile off-canvas sidebar drawer (2026-08-02)

The sidebar (`.side-nav`) only sits inline/stacked above content on desktop and tablet widths.
Under 860px it's an **off-canvas drawer**: hidden by default (`transform: translateX(-100%)`),
slides in over a dim backdrop when the hamburger button is tapped, and **auto-closes when any
real link inside it is tapped** — this replaced an earlier version where the sidebar was just
`position: static` and permanently stacked inline on mobile with no way to hide it; the user
found that confusing ("not going back to the left after selecting a menu item") since there was
no drawer at all to close.

- **Both the hamburger button and the backdrop `<div>` are created by JS**
  (`initSidebarDrawer()` in `main.js`, called first thing inside the `DOMContentLoaded` handler),
  **not present in any HTML file** — this was a deliberate choice to avoid hand-editing the header
  across 100+ pages a second time. If you ever need to reference either element from CSS/JS, they
  won't be in the page source; they only exist after `main.js` runs.
- `toggle.click` → `openDrawer()`/`closeDrawer()` (adds/removes `.open` on both `.side-nav` and
  `.sidenav-backdrop`, flips `aria-expanded`). Backdrop click and Escape both close it too.
- **Closing on link-click only binds to `<a>` tags inside `.side-nav`**, deliberately excluding
  `.nav-tree-toggle` — those are `<button>`s that expand/collapse a module's submodule list
  in-place, and tapping one should let you keep browsing the tree, not kick you out of the drawer.
  If you ever add a new clickable control inside the sidebar, decide explicitly whether it should
  close the drawer (a real navigation) or not (an in-place UI toggle) rather than assuming.
- CSS lives right after the `.nav-tree-sub` rules in `style.css`: `.nav-toggle` and
  `.sidenav-backdrop` both have `display: none` base rules (so they're inert on desktop even
  though the JS creates them unconditionally on every page) with the real drawer styling only
  inside `@media (max-width: 860px)`.
- This CSS also carries a comment calling out that `.side-nav`'s override must be declared *after*
  the unconditional base `.side-nav` rule earlier in the file — same equal-specificity/source-order
  gotcha that broke the original `position: static` mobile override before it was rewritten as
  this drawer; if you ever reorder `style.css`'s sections, watch for this again.

If you hand-edit `genlib.js`'s `renderItem()` template again, keep the indentation-nesting in mind
even though it's cosmetic-only: the body sections are one level deeper (inside `<div>` inside
`.module-page`) than the pre-sidebar version of this template, but browsers don't care about HTML
whitespace, so don't spend time re-indenting `li()`-generated `<li>` blocks or
`servicesConsumedBlock` to match — only fix indentation if you're touching that literal block
anyway.

### Platform Connectors section (`.doc-table`, hand-written, one per module page)

Every one of the 6 module pages ends with a `<section id="platform-connectors">` (just before
the closing "Real World Example" box) — a static, hand-written table, **not** generated from a
docgen data file. It lists the named `Cxos.Connectors.*` / `Cxos.*.Client` packages relevant to
that module's own domain, reusing the `.doc-table-wrap` / `.doc-table` CSS already built for
`brd.html` (the `td.reqid` class is repurposed here to bold/accent-color the package-name
column). **Two columns only, always in this order: Connector Package, Consumer.** A third
"Required Services" column existed briefly (2026-08-02) — including a fully exhaustive
`.service-list` breakdown trialed on `data-sources.html` — but the user found that level of detail
unnecessary for this table and asked for the column removed entirely across all 6 pages;
**don't re-add it.** If per-connector service dependencies are ever needed again, that's what
`brd.html`'s DDD-layered Infrastructure rows are for (see "Microservices catalog" below) — don't
duplicate that detail back into this table. Each module page also has a matching
`<li><a href="#platform-connectors">` entry appended to its own side-nav (`aside.side-nav`), and
(since the header dropdown nav was removed entirely, see "All Modules collapsible tree" above)
also to every other page's copy of that module's submodule list in the tree.

The `Cxos.Connectors.<System>` naming convention (e.g. `Cxos.Connectors.Salesforce`) originates
from `data-sources-2.js`'s Business Systems items and `ingestion-layer.js`'s Connectors submodule
— those same connector packages are bidirectional (an inbound extract connector doing Reverse ETL
write-back is the *same* package, not a second one), so Intelligence & Services' and Destinations
& Activation's tables reference the identical package names rather than inventing new ones for
the same system. `Cxos.Activation.Client` is the outbound counterpart to `Cxos.Ingestion.Client`,
used for connectors that only ever write out (SendGrid, Twilio, ad platforms) with no inbound
side. Rows that aren't literally a CXOS-built package (e.g. "Snowflake external tables", "dbt-spark
adapter") are still valid entries — the column is "what this module connects through," not a
strict NuGet-package list — keep those honestly labeled rather than inventing a fake package name
for a third-party-native integration.

### Microservices catalog (`brd.html` only — DDD + CQRS + polyglot persistence)

Each of BR-1 through BR-6 in `brd.html` has one or more `<div class="handbook-block">` sub-blocks
titled "Microservices" (placed directly after that BR's requirements table, inside the same
`<section id="br-...">`) cataloging the actual deployable .NET Core services for that stage, with
proper namespaces and how they interact. This is intentionally **BRD-only for now** — the
plan is to add a lighter "how to consume this service" section at the module/submodule level
later; don't preemptively add it there.

**Domain classification (DDD strategic design)** — stated as a `<p class="tech">` line above each
table, not a column:
- **Core Domain** (the platform's actual differentiators): Customer Profile (BR-5) and Activation
  (BR-6) — these two alone get the full 4-layer DDD treatment *and* are called out as "Core."
- **Supporting Subdomain** (necessary, built in-house, not the differentiator): Ingestion (BR-2),
  Event Processing + Schema Governance (BR-3, two separate bounded contexts), Data Foundation &amp;
  Governance (BR-4), Analytics &amp; AI Insights + Operational Services (BR-5, two more contexts
  alongside Customer Profile).
- **Generic Subdomain** (solved problem, reusable pattern): every `Cxos.Connectors.*` service —
  BR-1's inbound connectors and BR-6's outbound connectors (SendGrid, Twilio, ad platforms, batch
  export). **These deliberately do NOT get the 4-layer DDD breakdown** — a connector has no
  bespoke business rules, just source&harr;contract translation, so under DDD it's legitimately
  Infrastructure-layer-only. Say this explicitly in the intro `<p class="tech">` line so it doesn't
  read as an inconsistency. Table columns for these: `Microservice | Namespace | C/Q | Interacts With`.

**DDD layering (Core/Supporting contexts only)** — each bounded context becomes 4 table rows,
namespaced `Cxos.<Context>.<Layer>`, table columns `Layer | Namespace | C/Q | Interacts With`:
- **Domain** — entities/value objects/business rules only, no I/O, C/Q = `&mdash;`
- **Application** — orchestrates use cases, calls other bounded contexts' `.Api` layer
- **Infrastructure** — the actual external adapters: Azure services, **and the specific database
  chosen for that context's access pattern** (see polyglot persistence below)
- **Api** — the one deployed, callable entry point other bounded contexts actually talk to

**Polyglot persistence — do not default every service to the same database.** Pick per
bounded context based on actual access pattern, and say why in the Infrastructure row:
Azure Cosmos DB Core/SQL API for flexible-schema per-customer documents (Customer Profile) ·
Cosmos DB Gremlin API specifically for graph traversal (Identity Graph) · Cosmos DB Table API for
high-throughput simple key-value with TTL (stream checkpoints, alert history, activation dispatch
records) · Azure Database for PostgreSQL for genuinely relational/ACID/joined data (schema
registry, workflow state machine, usage/billing ledger) · Azure Cache for Redis for hot-path
caching and ephemeral counters (enrichment lookups, query-result cache, frequency caps) · Azure
Data Explorer (Kusto) for time-series/high-cardinality telemetry (anomaly scoring history, data
quality scorecards) · Azure Data Lake Storage Gen2 (Iceberg) for the lakehouse itself. A service
that's deliberately stateless (Ingestion's own Infrastructure layer) should say so explicitly
rather than getting a database assigned for the sake of it.

**CQRS** — a `C/Q` column on every table, using the existing `.priority` badge classes for color:
`<span class="priority must">Command</span>` (red) for writes/mutations, `<span class="priority
could">Query</span>` (blue) for reads, `<span class="priority should">Both</span>` (yellow) for
genuinely mixed, and plain `&mdash;` for the Domain layer (no I/O to classify). This repurposes the
BRD's existing must/should/could requirement-priority styling for a different axis — a deliberate
reuse of the color system, not a requirements priority.

**Required Services column — tried and removed (2026-08-02), don't re-add:** the Platform
Connectors table briefly had a third `Required Services` column, trialed first as an abbreviated
inline-`&middot;`-separated list on all 6 pages, then expanded to a fully exhaustive
`<ul class="service-list">` breakdown on `data-sources.html` specifically (every Azure service +
NuGet package a connector touches end-to-end). The user reviewed the exhaustive version and asked
for the column removed entirely — too much detail for this table — so it's back to **two columns
only: Connector Package, Consumer**, across all 6 pages. The `.service-list` CSS rule was removed
from `style.css` since nothing references it anymore. If service-level detail is wanted again in
the future, it belongs in `brd.html`'s DDD-layered Infrastructure rows (see "Microservices
catalog" below), not back in this table — don't reintroduce a third column here without being
asked. (Separately, the detail-page-level `servicesConsumed` field described under "Data file
schema" below is a *different* feature — a per-item "Services Consumed" section on 5 Business
Systems detail sub-pages — and was not part of what got removed; leave it as-is.)

### "Full Application Service Map" (index.html only, between "The Six Verticals" and "End-to-End Flow")

"The Six Modules" was renamed to **"The Six Verticals"** and "Cross-Cutting Foundation" to
**"The Five Horizontals"** (2026-08-02, homepage only — the module pages, nav, breadcrumbs, and
every internal `module-*`/`.module-page` class name, `MODULES` object in `genlib.js`, and
"6 module pages" terminology throughout this file are all **unchanged**; this was a copy/label
change on `index.html`'s two headings, not a systemic rename). If you add a 7th cross-cutting
capability to the `.foundation-grid`, update "Five" in the heading; same for "Six" if a vertical
is ever added or removed.

A visual, homepage-level summary of the same microservices catalog defined in `brd.html` —
added 2026-08-02 at the user's request for something "fancy" with DB icons, distinct from the
plain tables used everywhere else on the site. Three parts, in this order:

1. **`.db-legend`** — 5 badges, one per database technology actually used anywhere in the
   catalog (Cosmos DB, PostgreSQL, Redis, Azure Data Explorer/Kusto, ADLS Gen2/Iceberg), each with
   an emoji icon in a `color-mix()`-tinted box and a one-line "why this one" description. This is
   the visual anchor for the polyglot-persistence story — **keep this list in sync with
   `brd.html`'s Infrastructure rows**; if a new DB technology is ever introduced there, add it here
   too, with a new consistent hex in the same `--db-color` inline-custom-property pattern.
2. **`.service-db-grid`** — one `.service-db-card` per **Core/Supporting** bounded context from
   `brd.html` (8 cards: Ingestion, Event Processing, Schema Governance, Data Foundation &amp;
   Governance, Customer Profile, Analytics &amp; AI Insights, Operational Services, Activation).
   Each card: stage number + Core/Supporting tag, C/Q badge (reusing `.priority` must/could/should),
   the `.Api`-layer namespace, and a `.db-row` of `.db-pill`s — one pill per database that
   context's Infrastructure layer actually uses in the BRD (some cards intentionally show 2-3
   pills to make the polyglot point visible, e.g. Operational Services spans Postgres + Cosmos DB
   + Data Explorer). **Generic Subdomain connectors are deliberately excluded from this grid** —
   they're stateless (see below) — so this card count stays at 8, not 8 + every connector.
3. **`.connectors-strip`** — a single `.tag-row` listing all 12 unique `Cxos.Connectors.*` names
   (8 inbound from BR-1 + 4 outbound-only from BR-6; the write-path Salesforce/Zendesk/HubSpot
   reuse is not double-counted) under a "stateless, no dedicated database" label, so the "full
   application" is still represented completely without needing a database pill for services that
   don't have one.

CSS lives in `style.css` right before "Foundation / principles (home)". Uses `color-mix(in srgb,
var(--db-color) X%, var(--surface))` for both icon-box and pill backgrounds — this is why no
separate dark-mode override was needed: it blends against `--surface`, which already flips
correctly in dark mode via the existing `@media (prefers-color-scheme: dark)` block, so the tint
adapts automatically. If you ever need to support browsers without `color-mix()`, add a fallback,
but don't remove the `color-mix()` version — it's what keeps this section low-maintenance across
light/dark without duplicating every hex twice.

**`id="service-map"`** is on the section itself — every cross-page link to the Service Map (all 92
detail pages' "Services Consumed" bullets, the diagram caption below, `SERVICE_DETAILS` modal
content) points to `../../index.html#service-map` (or `#service-map` from `index.html` itself).
Don't remove or rename this id without updating every one of those references.

### Microservices architecture diagram (`doc/img/cxos-microservices-architecture.svg`)

A hand-authored SVG (not a photo/screenshot like `cxos-architecture.jpeg`) added 2026-08-02,
placed in its own `<section>` directly after "Full Application Service Map" on `index.html`,
reusing the same `.diagram-frame` + click-to-zoom lightbox pattern as the original architecture
diagram. It shows all 15 `Cxos.*.Api`/connector boxes (10 main-flow: inbound connectors →
Ingestion → Event Processing ⟷ Schema Governance → Data Foundation & Governance → {Customer
Profile, Analytics & AI Insights ⟷ Operational Services} → Activation → outbound connectors; plus
5 horizontal-band boxes for Observability/Security/Developer Platform/Multi-Tenancy/Administration
underneath everything) with arrows styled per the **same line-style legend already established in
the "Legend" section further down `index.html`**: solid = real-time/command flow, dashed =
batch/query flow, dotted = signals/cross-cutting. Core Domain boxes (Customer Profile, Activation)
get a thicker border; Supporting Subdomain boxes with dashed borders (Schema Governance,
Operational Services) sit off the main horizontal spine as satellite services.

**Why hand-authored SVG, not a generated image:** this environment has no raster image-generation
tool, but SVG is just XML that can be authored directly and displays identically via `<img
src="...svg">` — same as the jpeg. **If you regenerate or edit this file, validate it's
well-formed XML before committing** (a stray named HTML entity like `&mdash;` is invalid in strict
XML/SVG and will fail to render — only `&amp; &lt; &gt; &apos; &quot;` and numeric refs like
`&#8212;` are valid; literal UTF-8 characters like em dashes are also fine directly in the text).
There's no bundled XML validator in this repo — a quick stack-based tag-balance + entity check via
a throwaway Node script is sufficient (see how this file was originally validated: entity names
were extracted via regex and checked against the 5 XML-predefined ones).

**`main.js`'s lightbox was updated to support multiple diagrams per page** —
`document.querySelectorAll(".diagram-frame img")` + `forEach`, not the original
`querySelector` (singular), since `index.html` now has two `.diagram-frame` sections. If a third
diagram is ever added anywhere, it'll automatically pick up click-to-zoom via the same lightbox
element — no further JS changes needed.

This diagram is intentionally not exhaustive about every edge (e.g. Operational Services' signal
sources are represented by one illustrative dotted line + a caption, not 4 crossing lines from
every service) — same "conceptual, not literal" philosophy as the original `cxos-architecture.jpeg`.
For exact per-service detail, the diagram's caption links to the Service Map's click-to-open modals
and to the BRD.

**Horizontal counterpart** (2026-08-02): "The Five Horizontals" section (formerly "Cross-Cutting
Foundation") has its own `<div class="handbook-block"><h3>Service Map</h3>...</div>` right after
its `.foundation-grid`, reusing the identical `.service-db-grid`/`.service-db-card`/`.db-pill`
markup — 5 cards (`Cxos.Observability.Api`, `Cxos.Security.Api`, `Cxos.DevPlatform.Api`,
`Cxos.Tenancy.Api`, `Cxos.Admin.Api`), none of which exist yet in `brd.html`'s BR-1..BR-6 catalog
since horizontals aren't one of the six verticals. All 5 use `--card-accent:#3454d1` (the same
brand-blue already used for `brd.html`'s cross-cutting sections — Document Control, NFR,
Assumptions, Success Metrics — rather than any of the six per-vertical accent colors), since a
horizontal doesn't belong to one stage. `Cxos.Security.Api` intentionally has **no `.db-pill`** —
it delegates to Azure Key Vault/Azure AD rather than owning a database, shown as a plain `.tag`
note instead ("No CXOS-owned database — delegates to...") so the absence of a pill reads as a
deliberate architectural choice, not a missing entry. If these 5 horizontal services are ever
formalized with a full DDD breakdown, add them to `brd.html` as their own subsection (they don't
fit under any single BR-1..BR-6) and keep this card grid's namespaces in sync with that.

**Clickable, with a detail modal (2026-08-02):** every one of the 13 `.service-db-card`s (8
vertical + 5 horizontal) is clickable — `data-service="<slug>"` + `role="button"` + `tabindex="0"`
on the card, opening `#serviceModalBackdrop` (markup at the bottom of `index.html`, next to the
existing `.lightbox`) populated from a `SERVICE_DETAILS` JS object in `js/main.js`. Each entry has
four sections rendered into the modal: **Overview** (1-2 sentences), **Databases** (reuses the
same `.db-pill` markup as the card, or a plain `.tag` note for the no-database case —
`security`'s entry has `dbs: []` + `dbNote` instead, don't give it a fake pill), **DDD Layers**
(all 4 — Domain/Application/Infrastructure/Api — even for the 5 horizontal entries, which don't
exist in `brd.html`'s catalog; written fresh but in the same structure so the modal template stays
uniform across all 13), and **Service Integration** (3-4 bullets, reusing `brd.html`'s
"Interacts With" language for the 8 verticals so the two don't drift apart, hand-written but
consistent for the 5 horizontals).

- `initServiceModal()` in `main.js` is guarded (`if (!backdrop) return`) since `main.js` loads on
  every page but the modal markup only exists on `index.html` — don't remove that guard.
- **`SERVICE_DETAILS` keys must exactly match every card's `data-service` value** — if you add a
  14th card (a new vertical or horizontal service), add both the `data-service` attribute and a
  matching object entry, or the click handler silently no-ops (`if (!data) return`). After editing
  either side, cross-check with a quick script that extracts every `data-service="..."` from
  `index.html` and every top-level key from the `SERVICE_DETAILS` object in `main.js` and diffs
  the two lists — don't rely on visual inspection for this, it's easy to typo a slug.
- Close behavior: click the &#10005; button, click the backdrop (not the modal itself — checked
  via `e.target === backdrop`), or Escape. Focus moves to the close button on open and returns to
  the triggering card on close, for basic keyboard-nav hygiene — keep both when editing.
- The modal reuses `.db-pill`, `.priority`, and `.feature-list` (for the integration bullets) —
  don't introduce parallel one-off styles for content that already has a site-wide class.

### Low-Level Design (LLD) page (`pages/lld.html`) — added 2026-08-02, right after BRD

A 4th top-level page, alongside Overview/BRD/the 6 modules — the implementation-grade companion
to the BRD (business requirements) and the module pages (conceptual architecture): concrete
sequence flows, database schemas, REST API contracts, and deployment topology. Structurally it's
built exactly like `brd.html` — same header (brand only, no nav), same `.module-page` grid, same
"All Modules" tree in the sidebar with its own page sections nested under a `.nav-tree-module`
entry for "LLD" (pre-expanded, matching how BRD and Overview nest their own sections) — copy
`brd.html`'s skeleton if you need a reference for the pattern rather than starting from scratch.

**Ten sections**, in order: Purpose & Scope · Sequence Diagram (event flow) · Component Design
(`Cxos.Ingestion.Api` internal layering, worked through as the one representative example so the
pattern is clear for every other `Cxos.*.Api`) · Core Data Model (ERD) · Database Schema Detail
(one concrete schema artifact per store in the polyglot design — PostgreSQL DDL, Cosmos DB
document JSON, Cosmos DB Gremlin traversal, Redis key patterns, Iceberg table DDL) · API Contracts
(request/response JSON for the three calls shown in the sequence diagram) · Deployment
Architecture · Error Handling & Resiliency (a `.doc-table` of failure scenario → strategy →
owning service) · Security Design Detail · Observability Design.

**Three hand-authored SVG diagrams** in `doc/img/`, using the exact same `.diagram-frame` +
click-to-zoom pattern as `index.html`'s two diagrams (the lightbox JS already generically supports
any number of `.diagram-frame img` elements per page — see the note above, nothing further needed
to wire these up):
- `lld-sequence-event-flow.svg` — a classic UML-style sequence diagram, 7 lifelines (Customer →
  Web/Mobile App → Cxos.Ingestion.Api → Azure Event Hubs → Cxos.Processing.Api →
  Cxos.Profile.Api → Cxos.Activation.Api, plus an "external" SendGrid box with no lifeline of its
  own), numbered messages (solid = call, dashed = response), and dashed note boxes for
  internal/passive steps (e.g. "dedupe · stitch identity · enrich") rather than true self-loop
  arrows, which are fiddly to hand-draw correctly in raw SVG — notes are genuine UML convention,
  not a shortcut.
- `lld-entity-relationship.svg` — 8 entities (Tenant, CustomerProfile, IdentityGraph, Event,
  EventSchema, PropensityScore, ActivationDispatch, UsageRecord), box color = owning database
  (reuses the exact same hex values as the homepage's DB legend — `#336791` Postgres, `#12a4a4`
  Cosmos DB, `#2e9e5b` ADLS Gen2 — **keep these in sync if the DB legend colors ever change**),
  relationship lines with cardinality labels.
- `lld-deployment-topology.svg` — Azure infra grouped into trust/network zones (Client, Edge/
  Ingress, Compute–AKS, Compute–Azure Container Apps, Messaging, Data, and a cross-cutting
  Security & Ops band at the bottom) — same "band underneath everything" visual language as the
  Horizontals band in the microservices architecture diagram.

**All three were hand-authored the same way as `cxos-microservices-architecture.svg`** — this
environment has no raster image-generation tool, so SVG (plain XML, buildable directly) is the
only way to produce supporting diagrams. **Same validation requirement applies**: strict XML only
recognizes `&amp; &lt; &gt; &apos; &quot;` as named entities — `&middot;` is *not* valid (all three
LLD diagrams originally used it and had to be swept for `&#183;` after the fact); check any new
diagram with a throwaway Node script before considering it done, not just visually. If you extend
one of these diagrams, keep the numbered-step / entity-box / zone-box conventions already
established rather than inventing a new visual language per diagram.

### "How to Consume" blocks (all 22 submodule sections, hand-written on the 6 module pages)

Every submodule `<section>` across all 6 module pages (the same 22 sections that hold a
`.feature-grid`) ends with a `<div class="handbook-block"><h3>How to Consume</h3>...</div>` block,
placed right after the `.feature-grid` and before the section's closing `</section>` tag. This is
the **lighter, consumption-focused counterpart** to `brd.html`'s full DDD microservices catalog —
deliberately *not* a repeat of the Domain/Application/Infrastructure layers (those are internal
implementation detail irrelevant to "how do I call this"). Structure:

```html
<div class="handbook-block">
  <h3>How to Consume</h3>
  <p class="tech"><code>Cxos.Profile.Api</code> &middot; <span class="priority could">Query</span></p>
  <pre class="code-block">GET /v1/profile/cust_004821
...</pre>
</div>
```

- The `<p class="tech">` line names the **Api-layer namespace only** (from `brd.html`'s catalog —
  don't invent a different namespace here, reuse the canonical one) plus its C/Q tag using the
  same `.priority must/could/should` badge convention established in the BRD.
- The `<pre class="code-block">` is one small, concrete, realistic example — an HTTP
  request/response, an event payload, a config snippet, or (for internal-only stages like
  Ingestion's edge pipeline or Streaming Ingestion's Event Hubs consumer group) an explanation of
  *why* there's no direct caller-facing call and what to look at instead. Escape angle brackets as
  `&lt;`/`&gt;` in placeholder text (e.g. `Bearer &lt;token&gt;`) — unescaped `<placeholder>` text
  gets parsed as a real (broken) HTML tag inside `<pre>`; this is a pre-existing minor issue in a
  few older generated detail pages (e.g. `intelligence-services/profile-api.html`'s artifactCode) —
  don't propagate it into new hand-written content, but no need to go fix the old ones as part of
  unrelated work.
- Submodules that map to a Generic Subdomain connector family (e.g. Data Sources' Business
  Systems, Destinations & Activation's Reverse ETL) reference the same `Cxos.Connectors.*` names as
  `brd.html`'s BR-1/BR-6 tables, not a new invented service.
- This pattern is now considered **done** across all 22 submodules — if a new submodule is ever
  added, give it one of these blocks too, sourcing the namespace/C-Q from `brd.html`'s catalog
  (add it there first if the bounded context doesn't exist yet).

### Data file schema (one entry per detail page)

Each module's data file exports an array of `{ anchor, name, items: [...] }` submodule groups
(`anchor`/`name` must match the `id`/heading on the parent module page's `<section>`). Each
item:

| Field | Purpose |
|---|---|
| `slug` | Output filename (`slug.html`) |
| `name` | Page `<h1>` and nav-list text |
| `tagline` | One-sentence description under the h1 |
| `hldCaption` | One-line summary above the HLD diagram |
| `hld` | **Full 6-node array** — see "HLD diagrams" below. **Do not use the old `hldSelf` shortcut** (removed from practice — see Lessons Learned) |
| `business` | 3 bullets: Business Context |
| `technical` | One paragraph: Technical Overview (HTML string, `<code>` tags OK) |
| `chipsLabel`, `chips` | Small pill list under Technical Overview (event names / entities / capabilities) |
| `artifactTitle`, `artifactCode` | A code block (JSON payload / config / snippet) — title varies per item type |
| `integration` | 3-5 bullets: Integration Points |
| `nfr` | 4 bullets: Non-Functional Considerations (always cover Scale/Latency/Reliability/Security) |
| `example` | One paragraph: Enterprise Example, with a concrete business outcome/number |
| `servicesConsumed` | **Required on every item now (2026-08-02, all 92/92 populated).** Renders as a "Services Consumed" section (`genlib.js`, between Integration Points and NFR). **Final format is deliberately light — exactly 2 bullets, not exhaustive:** (1) `Owning microservice — <code>Cxos.X.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)` — the `Cxos.*.Api` namespace comes from `brd.html`'s DDD catalog / the homepage Service Map, never invented per-item; (2) a `Database — ...` line naming the database(s) that owning service's Infrastructure layer uses (or `No dedicated database — stateless connector (see Platform Connectors above)` for the Generic Subdomain connector items). **This format was tried at exhaustive detail first, then deliberately simplified** — an earlier version listed every Azure service/NuGet package per item (mirroring what the module-level Platform Connectors table also tried and had removed, see below) but that's redundant with the `integration` array immediately above it in the same page and doesn't scale cleanly to 92 items; don't revert to the exhaustive form. |

### HLD diagrams — always write full 6 nodes, never the generic-pipeline shortcut

**Lesson learned (do not repeat):** `genlib.js` has a `buildHld()` fallback that auto-fills 5
of 6 nodes with generic pipeline text (`.NET Core Ingestion API`, `Data Lakehouse`, etc.) when
an item only specifies `hldSelf` for its own stage. This was used for a batch of pages once and
the user flagged it as visibly broken — a real HLD should show the *actual* specific flow for
that item, not a templated filler. **Every item's `hld` field must be a fully-specified array of
6 `{ label, name, detail }` objects**, exactly one with `origin: true` (the node highlighted with
a colored border — usually, but not always, index 0). Derive all 6 nodes from what the item's
own Technical Overview/Integration Points actually say, referencing the *adjacent* real
components (what hands data to this item, what this item hands off to), not placeholder text.
`buildHld`/`hldSelf` remain in `genlib.js` for backward compatibility only — do not use them for
new content.

### Accent colors (must match across module page, detail pages, and index.html card)

| Module | Hex |
|---|---|
| Data Sources | `#6a4fc2` |
| Ingestion Layer | `#2b7fd6` |
| Transformation & Processing | `#0f9b8e` |
| Unified Data Foundation | `#2e9e5b` |
| Intelligence & Services | `#d9822b` |
| Destinations & Activation | `#c23b6d` |

## Reference tech stack used throughout the content

All "Technical Overview" / "Integration Points" content is written against one consistent,
concrete implementation choice (not the generic Bytewax/Redpanda/DataFusion language from the
original architecture diagram, which was superseded per user direction mid-project):

- **.NET Core microservices** per stage (Ingestion API, Stream/Batch Workers, Analytics/AI API, Activation API), each packaged as a **Docker** container and hosted on **AKS** / **Azure Container Apps**. Call out "Docker container" explicitly in prose at least once per page's Technical Overview — don't just say "on AKS" and leave the packaging implicit.
- **NuGet-package-driven SDK sharing**: every touchpoint/connector/service calls the same shared `Cxos.Ingestion.Client` NuGet package (published to an internal Azure Artifacts feed) — this is the running thread that ties every page's Integration Points together. Don't invent a different shared-SDK story per page.
- **dbt (data build tool)** is the transformation framework for anything that used to be described as a hand-rolled ".NET Core Batch Worker doing SQL" — batch modeling, rollups/aggregations, backfills, and (via dbt Python models) ML feature prep are all **dbt models**, version-controlled and tested (`dbt test`), orchestrated by a thin .NET Core scheduler (Azure Container Apps Jobs / Azure Data Factory) that just invokes the dbt CLI. dbt's `ref()`/`source()` graph is also what feeds the Metadata Layer's Lineage capability — don't describe lineage and dbt's DAG as two separate things.
- **Snowflake** is a first-class consumer of the lakehouse: because everything is stored as open Iceberg tables (see Zero-Copy Architecture / Open Table Format), Snowflake can attach directly via its Iceberg external-table support, and dbt models can target Snowflake as well as the lakehouse via dbt's adapter. Mention Snowflake alongside Spark/Trino wherever "any Iceberg-compatible engine" comes up, and as an explicit option under Query & Analytics Engine / Batch/File Exports.
- **ADFS (Active Directory Federation Services)** covers enterprise/internal identity federation — hybrid on-prem AD environments (agents, internal staff, B2B partner SSO) — as the counterpart to **Azure AD B2C**, which is customer-facing. Use ADFS specifically for internal/employee/agent auth scenarios (Access Control, Call Center, internal tooling); keep Azure AD B2C for end-customer auth. Don't conflate the two.
- **Azure services** mapped per stage: Azure API Management (gateway) · Azure Event Hubs (Kafka-compatible backbone; Redpanda pages describe it as an alternative/compatible broker) · Azure Service Bus (topic/queue messaging for command-style traffic — activation triggers, agent handoff, journey/workflow orchestration; distinct from Event Hubs' high-throughput event streaming role) · Azure IoT Hub (device ingress) · Azure Functions (webhook receivers, batch/timer jobs) · Azure Blob Storage (batch/file landing, and the underlying storage ADLS Gen2 is built on) · Azure Data Lake Storage Gen2 (lakehouse storage) · Azure Purview (catalog/lineage/dictionary/policy) · Azure Database for PostgreSQL (operational/analytics stores) · Azure OpenAI Service / Azure Machine Learning (AI & Insights) · Azure Key Vault (secrets) · Azure Cache for Redis (hot-path caching) · Azure AD / Entra ID + Azure AD B2C (customer auth) · **ADFS** (internal/enterprise federation) · **Application Insights** (per-request distributed tracing, exception telemetry, and dependency tracking — wired into every .NET Core microservice via its SDK; propagates a correlation ID across service calls) · Azure Monitor (infra-level metrics dashboards, alert rules, log queries — the aggregate/ops view, distinct from Application Insights' per-request app-level view; they're complementary, not interchangeable — don't use one where the other fits).

Every new detail page should reuse these same names/services rather than introducing new ones,
so cross-links between pages (e.g., "→ see Ingestion Layer's Queue & Retry") stay coherent.

## Status (update this section as work continues)

**Done** (92 generated detail pages + 6 module pages + `index.html` + `pages/brd.html` +
`pages/lld.html` = 101 pages total, all link-validated):
- Data Sources — all 3 submodules (15 items)
- Ingestion Layer — all 5 submodules (15 items)
- Transformation & Processing — all 3 submodules (14 items)
- Unified Data Foundation — all 3 submodules (16 items)
- Intelligence & Services — all 4 submodules (Identity & Profile Service, Query & Analytics
  Engine, AI & Insights, Operational Services), 17 items — resumed and completed 2026-08-02
- Destinations & Activation — all 4 submodules (Real-time Activation, Batch/File Exports, APIs &
  Webhooks, Reverse ETL/CDP Sync), 15 items — resumed and completed 2026-08-02
- `pages/brd.html` — Business Requirements Document: purpose, objectives, scope, stakeholders,
  BR-1 through BR-6 (one requirements table per module, each colored with that module's own
  accent), NFRs, assumptions, success metrics. BR-5/BR-6 no longer carry the "Planned" badge —
  their tables, the Scope section's "(Stage 5/6 — planned)" notes, and the Assumptions section's
  phased-delivery note were all updated when those two modules shipped. Uses `.doc-table` /
  `.doc-meta-table` / `.priority` (must/should/could) CSS components. **BRD is a top-level entry
  in the "All Modules" tree** on every page (see that section above) — same for **LLD**, added
  right after it (2026-08-02). Adding a new top-level page means updating all 4 tree locations
  (`genlib.js` + 6 module pages + BRD + LLD's own copy + `index.html`), same as both do.
- `pages/lld.html` — Low-Level Design: sequence diagram (event flow), component/class-layer
  design for `Cxos.Ingestion.Api`, core data model (ERD), per-store database schema DDL, REST API
  contracts, deployment topology, error handling, security, and observability design. Three
  hand-authored SVG diagrams in `doc/img/lld-*.svg` (sequence, ERD, deployment) — see "Low-Level
  Design (LLD) page" section above for detail on each and how to extend them.
- `index.html`'s intro copy and all 6 module cards reflect all six stages being fully specified
  (no "next"/"planned" language remaining for Intelligence & Services or Destinations &
  Activation).
- **Mobile responsiveness pass (2026-08-02, two rounds):** round 1 fixed a latent bug where
  `.side-nav`'s `position: static` mobile override was silently ignored (equal-specificity,
  source-order bug — see "Mobile off-canvas sidebar drawer" above for the details, since round 2
  replaced `position: static` with a proper drawer and the same gotcha applies to that rule too),
  bumped touch targets for `.nav-tree-toggle` and side-nav links to ~40-44px on mobile, made the
  Service Map detail modal a full-width bottom sheet under 600px, and removed a fully duplicated
  `.hld-diagram`/`.code-block` CSS block (the second copy, later in the file and therefore the one
  actually governing behavior, already had `-webkit-overflow-scrolling: touch`; the dead first copy
  lacked it and was deleted, not the other way round). **Round 2** replaced the inline/stacked
  mobile sidebar with a proper off-canvas drawer (hamburger toggle, slide-in, backdrop,
  auto-close-on-link-tap) after the user found the stacked version confusing with nothing to
  close — see "Mobile off-canvas sidebar drawer" above for full detail.

All six stages of the architecture are now fully specified end to end. Future work here is
either refining existing content or building out `code/` (currently empty, no relationship to
`doc/` yet).

## Verifying changes

There's no dev server needed — open any `.html` file directly (`file://`) in a browser. After
any edit that touches links, anchors, or `<img>`/`<script>` paths, run
`node tools/docgen/check-links.js doc` — it resolves every relative `href`/`src` on disk and
flags anything broken, without needing a running server.

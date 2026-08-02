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
├── index.html                 Overview: hero, architecture diagram, 6 module cards,
│                               end-to-end flow, cross-cutting foundation, principles
├── css/style.css               Shared styles (light/dark aware)
├── js/main.js                  Nav dropdowns/mobile menu, active-link highlighting, lightbox
├── img/cxos-architecture.jpeg  The source diagram (do not delete — index.html embeds it)
└── pages/
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

Header nav = the 6 modules; each has a dropdown of its submodule anchors. Module pages are
3 clicks from home; detail pages are 4 (module → submodule anchor → detail page).

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
`<li><a href="#platform-connectors">` entry appended to its own side-nav (`aside.side-nav`) — this
section is intentionally **not** added to the header dropdown nav (`genlib.js`'s `navHtml()`),
since that would require regenerating all 92 detail pages just to add one more anchor.

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
| `servicesConsumed` | **Optional.** Bullets: every Azure/platform service + NuGet package the item touches end-to-end (Key Vault, compute host, Event Hubs/Functions, ADLS Gen2, Application Insights, plus the source-side API) — exhaustive, not the abbreviated 3-4 items already in `integration`. Renders as a new "Services Consumed" section (`genlib.js`, between Integration Points and NFR) only when present; omitting it renders nothing, so it's safe to leave unset on items not yet migrated. **Staged rollout (2026-08-02):** only populated on Data Sources' 5 Business Systems items (`crm-salesforce`, `commerce-shopify`, `support-zendesk`, `marketing-hubspot`, `erp-billing`) so far, paired with the same exhaustive list already on that module's page-level Platform Connectors table. Extend to other items' data files the same way — source the list from that item's own `technical`/`integration` content, don't invent services not already established there — after review.

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

**Done** (92 generated detail pages + 6 module pages + `index.html` + `pages/brd.html` = 100 pages total, all link-validated):
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
  `.doc-meta-table` / `.priority` (must/should/could) CSS components. **BRD is a top-level nav
  item** (added in `genlib.js`'s `navHtml()`, so it's already on all 92 generated pages — if you
  ever hand-edit a module page's header nav, remember to add the `<li data-page="brd.html">`
  entry there too, or it'll silently drop off just that page.
- `index.html`'s intro copy and all 6 module cards reflect all six stages being fully specified
  (no "next"/"planned" language remaining for Intelligence & Services or Destinations &
  Activation).

All six stages of the architecture are now fully specified end to end. Future work here is
either refining existing content or building out `code/` (currently empty, no relationship to
`doc/` yet).

## Verifying changes

There's no dev server needed — open any `.html` file directly (`file://`) in a browser. After
any edit that touches links, anchors, or `<img>`/`<script>` paths, run
`node tools/docgen/check-links.js doc` — it resolves every relative `href`/`src` on disk and
flags anything broken, without needing a running server.

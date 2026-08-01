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
    ├── intelligence-services.html          |  per submodule. The 4 built modules render each
    ├── destinations-activation.html       _/   submodule's items as a `.feature-grid` of
    │                                            `.feature-card` tiles (icon + accent bar +
    │                                            title + one-line description, linking to the
    │                                            detail page) — see "Submodule item cards" below.
    │                                            The 2 paused modules still use the older plain
    │                                            `<ul class="feature-list">` bullet links; restyle
    │                                            them to feature-grid once their content is built.
    │
    ├── data-sources/*.html                 Generated detail pages, one per bullet
    ├── ingestion-layer/*.html              under each module's submodules. Each bullet
    ├── transformation-processing/*.html    on the parent module page links to one of
    └── unified-data-foundation/*.html      these via <a href="data-sources/slug.html">.
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
    └── unified-data-foundation.js   All 3 submodules (16 items)
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
  `.feature-list` (plain bulleted `<li><a>`) CSS is kept for the 2 not-yet-restyled modules —
  don't remove it until Intelligence & Services / Destinations & Activation are migrated too.

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

**Done** (60 generated detail pages + 6 module pages + `index.html` = 67 pages total, all link-validated):
- Data Sources — all 3 submodules (15 items)
- Ingestion Layer — all 5 submodules (15 items)
- Transformation & Processing — all 3 submodules (14 items)
- Unified Data Foundation — all 3 submodules (16 items)

**Not started** (explicitly paused by user on 2026-08-02 pending review of the above):
- Intelligence & Services — 4 submodules (Identity & Profile Service, Query & Analytics Engine,
  AI & Insights, Operational Services), ~17 items
- Destinations & Activation — 4 submodules (Real-time Activation, Batch/File Exports, APIs &
  Webhooks, Reverse ETL/CDP Sync), ~15 items

When resuming: write a new `tools/docgen/data/<module-file-slug>.js` following the schema
above (use an existing data file as the template), run it through `run.js`, add `<a>` links to
the corresponding bullets on the parent module page (`pages/<module-file-slug>.html`), then run
`check-links.js` before considering the module done.

## Verifying changes

There's no dev server needed — open any `.html` file directly (`file://`) in a browser. After
any edit that touches links, anchors, or `<img>`/`<script>` paths, run
`node tools/docgen/check-links.js doc` — it resolves every relative `href`/`src` on disk and
flags anything broken, without needing a running server.

module.exports = [
  {
    anchor: 'stream-processing', name: 'Stream Processing',
    items: [
      {
        slug: 'event-deduplication', name: 'Event Deduplication',
        tagline: 'Removes duplicate events caused by retries, multi-path delivery, or at-least-once semantics — so one customer action is never counted twice.',
        hldCaption: 'Deduplication runs first in the Stream Worker, before any other processing.',
        hld: [
          { label: 'Data Source', name: 'Queue &amp; Retry', detail: 'Hands off at-least-once delivered events' },
          { label: 'Ingestion', name: 'Azure Event Hubs', detail: 'Source stream the Stream Worker consumes' },
          { label: 'Processing', name: 'Event Deduplication', detail: '.NET Core Stream Worker — idempotency check via event_id', origin: true },
          { label: 'Foundation', name: 'Sessionization', detail: 'Runs next on de-duplicated events' },
          { label: 'Intelligence', name: 'Azure Cache for Redis', detail: 'Dedup window storage' },
          { label: 'Activation', name: 'Every Downstream Consumer', detail: 'Guaranteed effectively-once processing' },
        ],
        business: [
          'Duplicate events silently inflate metrics (double-counted revenue, inflated engagement) — this is the control that keeps numbers trustworthy',
          'Lets every upstream SDK/connector retry aggressively for reliability without worrying about double-processing downstream',
          'Owned by Platform Engineering',
        ],
        technical: 'Every event carries a unique <code>event_id</code> assigned at the edge. The Stream Worker checks each incoming event_id against a short-lived deduplication window maintained in Azure Cache for Redis (typically 24-48 hours, covering realistic retry windows) before processing it further. A duplicate is logged and dropped, not reprocessed — this is what makes the Queue &amp; Retry layer\'s at-least-once delivery guarantee safe to build on.',
        chipsLabel: 'Dedup Window', chips: ['24-48 hour Redis TTL', 'event_id as dedup key', 'At-least-once &rarr; effectively-once'],
        artifactTitle: 'Dedup Check',
        artifactCode: `var seen = await _redis.StringGetAsync($"dedup:{evt.EventId}");
if (seen.HasValue) { _metrics.Increment("dedup.dropped"); return; }
await _redis.StringSetAsync($"dedup:{evt.EventId}", 1, TimeSpan.FromHours(48));`,
        integration: [
          'Azure Cache for Redis — dedup window storage',
          '.NET Core Stream Worker — where the check runs, first step after consuming from Event Hubs',
          'Queue &amp; Retry layer — the reason this control exists (at-least-once delivery upstream)',
          'Azure Monitor — dedup-rate metric, a useful early signal of upstream retry storms',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          'Scale: Redis lookups are sub-millisecond even at high event throughput',
          'Latency: adds negligible per-event latency',
          'Reliability: dedup window is sized generously beyond the longest realistic retry delay',
          'Security/Privacy: dedup keys are event IDs only, no payload content is cached',
        ],
        example: "A mobile client loses connectivity mid-send and retries the same add_to_cart event three times once back online. Deduplication ensures the customer's cart analytics show one addition, not three — keeping conversion-funnel math accurate.",
      },
      {
        slug: 'sessionization', name: 'Sessionization',
        tagline: "Groups a customer's raw events into logical sessions — the unit most analytics, personalization, and journey logic actually operate on.",
        hldCaption: 'Sessionization turns a raw event stream into the unit analytics actually uses.',
        hld: [
          { label: 'Data Source', name: 'Event Deduplication', detail: 'Hands off de-duplicated events' },
          { label: 'Ingestion', name: 'Azure Event Hubs', detail: 'Source stream, partitioned by customer' },
          { label: 'Processing', name: 'Sessionization', detail: '.NET Core Stream Worker — inactivity-timeout session windows', origin: true },
          { label: 'Foundation', name: 'Identity Resolution', detail: 'Runs next, using session-scoped identity' },
          { label: 'Intelligence', name: 'Analytics API', detail: 'Consumes session_start/session_end' },
          { label: 'Activation', name: 'Journey &amp; Funnel Logic', detail: 'Session is the unit most activation rules use' },
        ],
        business: [
          'Almost every meaningful metric (bounce rate, session duration, funnel conversion) is defined at the session level, not the raw event level',
          'Removes the burden from every downstream team to reimplement session-boundary logic themselves',
          'Owned by Platform Engineering, in consultation with Analytics',
        ],
        technical: 'The Stream Worker groups events sharing the same identity (user_id or anonymous_id) and channel into a session using a configurable inactivity timeout (default 30 minutes) — a standard sliding-window session model. A <code>session_start</code> derived event is emitted on the first event of a new session and <code>session_end</code> when the timeout fires, both written back onto Azure Event Hubs so downstream consumers (including the Analytics API) can react to session boundaries directly.',
        chipsLabel: 'Session Rules', chips: ['30-minute inactivity timeout', 'Per-channel session scoping', 'session_start / session_end derived events'],
        artifactTitle: 'Derived Session Event',
        artifactCode: `{
  "event": "session_end",
  "session_id": "sess_77af",
  "user_id": "cust_004821",
  "started_at": "2026-08-01T10:15:02Z",
  "ended_at": "2026-08-01T10:41:19Z",
  "event_count": 14
}`,
        integration: [
          '.NET Core Stream Worker — where sessionization runs, stateful windowing over Azure Event Hubs',
          'Azure Cache for Redis — holds in-flight session state until the inactivity timeout fires',
          'Analytics API — consumes session_start/session_end as first-class events',
          "Identity & Profile Service — sessions roll up into the customer's broader activity timeline",
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          "Scale: session state is sharded by customer ID, scaling horizontally with the Stream Worker's partition count",
          'Latency: session_end fires within the configured timeout window, not instantly — an inherent tradeoff of inactivity-based sessionization',
          'Reliability: session state survives a worker restart via checkpointed Redis state, not in-memory only',
          'Security/Privacy: session identifiers are opaque and rotate per session — never a persistent customer identifier on their own',
        ],
        example: 'A customer browses for 20 minutes, leaves the tab open unattended for an hour, then returns and completes a purchase. Sessionization correctly treats this as two separate sessions, so the Analytics API attributes the purchase to a fresh, high-intent return session rather than diluting a single artificially long one.',
      },
      {
        slug: 'identity-resolution', name: 'Identity Resolution (Stitching)',
        tagline: "Links events from different devices, sessions, and channels back to the same real customer — the mechanism that makes 'unified profile' actually true.",
        hldCaption: 'Identity Resolution is what makes cross-channel personalization possible.',
        hld: [
          { label: 'Data Source', name: 'Sessionization', detail: 'Hands off session-scoped events' },
          { label: 'Ingestion', name: 'Identity &amp; Profile Service', detail: 'Owns the identity graph queried here' },
          { label: 'Processing', name: 'Identity Resolution', detail: '.NET Core Stream Worker — identity graph stitching', origin: true },
          { label: 'Foundation', name: 'Data Quality Checks', detail: 'Runs next, validating the stitched event' },
          { label: 'Intelligence', name: 'Azure Database for PostgreSQL', detail: 'Identity graph storage' },
          { label: 'Activation', name: 'Unified Customer Profile', detail: 'What makes cross-channel personalization possible' },
        ],
        business: [
          'Without stitching, the same customer looks like several different anonymous strangers across web, mobile, and in-store — the core promise of the platform depends on this working',
          'Directly determines the accuracy of every downstream personalization, LTV, and segmentation calculation',
          'Owned by the Identity & Profile Service team',
        ],
        technical: "Stitching runs as a Stream Worker step that resolves an incoming event's anonymous_id or device identifier against the identity graph maintained by the Identity &amp; Profile Service (backed by Azure Database for PostgreSQL). A deterministic match (e.g., login, loyalty scan, email click) creates or strengthens an edge between an anonymous ID and a known user_id; a probabilistic match (shared device/IP heuristics) is scored but flagged with lower confidence and never silently treated as certain.",
        chipsLabel: 'Match Types', chips: ['Deterministic (login, loyalty ID, email)', 'Probabilistic (device/IP heuristics, scored)'],
        artifactTitle: 'Identity Graph Edge',
        artifactCode: `{
  "anonymous_id": "a1b2c3d4",
  "user_id": "cust_004821",
  "match_type": "deterministic",
  "match_source": "login",
  "confidence": 1.0,
  "linked_at": "2026-08-01T10:20:01Z"
}`,
        integration: [
          'Identity &amp; Profile Service (.NET Core API) — owns the identity graph',
          'Azure Database for PostgreSQL — identity graph storage',
          '.NET Core Stream Worker — calls the Identity API inline during processing to resolve/attach identity',
          'Every downstream consumer (Analytics, AI &amp; Insights, Activation) — reads the resolved user_id, not raw anonymous IDs',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          'Scale: identity graph lookups are cached for active sessions to avoid a database round-trip per event',
          'Latency: adds a small, cache-mitigated latency cost per event in exchange for correctness',
          'Reliability: an identity-service outage degrades to anonymous-only processing rather than blocking the pipeline',
          'Security/Privacy: probabilistic matches are never used for regulated purposes (e.g., legal consent decisions) — only deterministic matches carry that weight',
        ],
        example: 'A customer browses on mobile, then completes checkout on desktop while logged in. Deterministic stitching via the login event links both anonymous IDs to the same user_id, so the Analytics API correctly attributes the purchase to the mobile browsing session that originally drove it — instead of showing two unrelated visitors.',
      },
      {
        slug: 'data-quality-checks', name: 'Data Quality Checks',
        tagline: 'Continuous, automated checks on event data as it streams through — catching quality regressions before they reach a dashboard or model.',
        hldCaption: 'Data Quality Checks run in parallel with processing, watching for regressions.',
        hld: [
          { label: 'Data Source', name: 'Azure Event Hubs', detail: 'Parallel consumer on the same stream' },
          { label: 'Ingestion', name: 'Event Schema &amp; Registry', detail: 'Source of check constraints' },
          { label: 'Processing', name: 'Data Quality Checks', detail: '.NET Core Stream Worker — rule-based + statistical checks', origin: true },
          { label: 'Foundation', name: 'Data-Quality Dashboard', detail: 'Built on the Analytics API' },
          { label: 'Intelligence', name: 'Azure Monitor', detail: 'Alerting when a check breaches threshold' },
          { label: 'Activation', name: 'Owning Domain Team', detail: 'Notified directly on regression' },
        ],
        business: [
          'Silent data quality regressions (a broken tracking call, a schema drift) erode trust in the platform faster than almost any other failure mode',
          'Lets teams catch their own integration bugs within minutes instead of discovering them in a monthly business review',
          'Owned by Platform Engineering, with checks configurable per event type by the owning domain team',
        ],
        technical: "Data Quality Checks run as a parallel consumer on the same Event Hubs stream, applying both rule-based checks (null rates, value-range checks, referential checks like 'does this product_id exist in the catalog') and statistical checks (volume anomaly detection comparing current throughput to a rolling baseline). Failures don't block the pipeline — they raise an Azure Monitor alert and populate a data-quality dashboard the owning team can act on.",
        chipsLabel: 'Check Types', chips: ['Null/completeness rate', 'Value-range validation', 'Referential checks', 'Volume anomaly detection'],
        artifactTitle: 'Data Quality Alert',
        artifactCode: `{
  "check": "null_rate",
  "field": "properties.product_id",
  "event_type": "product_viewed",
  "threshold": 0.02,
  "observed": 0.18,
  "status": "breached",
  "window": "last_15_minutes"
}`,
        integration: [
          'Parallel consumer on Azure Event Hubs, independent of the main processing path',
          'Azure Monitor — alerting when a check breaches its threshold',
          'Data-quality dashboard (built on the Analytics API) — visibility for domain teams',
          "Event Schema & Registry — check rules are partly derived from the registered schema's constraints",
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          'Scale: runs as a lightweight parallel stream, sized independently of the primary processing path',
          'Latency: checks operate on rolling windows (typically 15 minutes), trading a small detection delay for statistical stability',
          "Reliability: a data-quality check failure never blocks or slows the primary pipeline — it's purely observational",
          'Security/Privacy: checks operate on field presence/shape/statistics, not on raw PII values',
        ],
        example: "A marketing team's tag-manager update accidentally stops populating product_id on 18% of product_viewed events. The null-rate check breaches its 2% threshold within 15 minutes and alerts the team directly, instead of the gap being discovered a month later when a report looks strange.",
      },
      {
        slug: 'real-time-enrichment', name: 'Real-time Enrichment',
        tagline: "Adds computed, business-meaningful context to an event as it streams — beyond the raw geo/device enrichment done at the edge.",
        hldCaption: 'Real-time Enrichment joins events against fast lookup sources in-stream.',
        hld: [
          { label: 'Data Source', name: 'Identity Resolution', detail: 'Hands off an identity-resolved event' },
          { label: 'Ingestion', name: 'Product Catalog / Profile Caches', detail: 'Fast lookup sources' },
          { label: 'Processing', name: 'Real-time Enrichment', detail: '.NET Core Stream Worker — profile and catalog lookups', origin: true },
          { label: 'Foundation', name: 'Derived Event Generation', detail: 'Runs next, using enriched context' },
          { label: 'Intelligence', name: 'Azure Cache for Redis', detail: 'Low-latency lookup cache' },
          { label: 'Activation', name: 'In-session Personalization', detail: 'The use case this enables' },
        ],
        business: [
          'Lets downstream consumers get rich context (customer tier, product category, current cart value) without each one re-querying multiple systems',
          "Powers real-time use cases (in-session personalization) that can't wait for a batch join",
          'Owned by Platform Engineering, with enrichment sources owned by the relevant domain teams',
        ],
        technical: 'Real-time Enrichment joins each event, in-stream, against fast lookup sources: the Identity &amp; Profile Service (customer tier, LTV band), a product catalog cache (category, price tier), and current session state (running cart value). These lookups are backed by Azure Cache for Redis to keep per-event latency low, with the underlying Data Lakehouse tables as the periodically refreshed source of truth for the cache.',
        chipsLabel: 'Enrichment Sources', chips: ['Customer profile (tier, LTV band)', 'Product catalog (category, price)', 'Session state (cart value)'],
        artifactTitle: 'Enriched Event Excerpt',
        artifactCode: `"enrichment": {
  "customer_tier": "gold",
  "product_category": "audio",
  "session_cart_value": 6998
}`,
        integration: [
          'Azure Cache for Redis — low-latency lookup cache for profile/catalog/session data',
          'Identity &amp; Profile Service — source of customer-tier/LTV enrichment',
          'Product catalog service — source of category/price enrichment',
          '.NET Core Stream Worker — where the joins are performed inline',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          'Scale: cache-backed lookups keep enrichment cost roughly constant regardless of event volume',
          'Latency: adds low-single-digit milliseconds per lookup; enrichment failures degrade gracefully (event proceeds with partial enrichment)',
          "Reliability: cache staleness is bounded by a refresh interval appropriate to each source's rate of change",
          'Security/Privacy: only non-sensitive, business-purpose fields are added — enrichment is scoped, not an unrestricted profile dump',
        ],
        example: 'A gold-tier customer adds a fourth item to their cart. Real-time enrichment attaches their tier and running cart value to the event inline, letting the Activation API trigger a tier-appropriate free-shipping nudge within the same session — a use case that would be impossible if enrichment only happened in a nightly batch job.',
      },
      {
        slug: 'derived-event-generation', name: 'Derived Event Generation',
        tagline: "Synthesizes new, higher-level events from patterns in the raw stream — turning 'what happened' into 'what it means'.",
        hldCaption: 'Derived Event Generation computes business-meaningful moments once, for everyone.',
        hld: [
          { label: 'Data Source', name: 'Real-time Enrichment', detail: 'Hands off an enriched event' },
          { label: 'Ingestion', name: 'Azure Cache for Redis', detail: 'Holds in-flight windowed state per customer' },
          { label: 'Processing', name: 'Derived Event Generation', detail: '.NET Core Stream Worker — pattern-based synthetic events', origin: true },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Derived events are stored like any other event' },
          { label: 'Intelligence', name: 'Azure Event Hubs', detail: 'Derived events are republished here' },
          { label: 'Activation', name: 'Activation API', detail: 'Cart-abandonment recovery and similar triggers' },
        ],
        business: [
          "Business logic like 'cart abandoned' or 'browsing spree' isn't a single raw event — it's a pattern the platform computes once, so every team doesn't reinvent it",
          "Standardizes business-meaningful moments across the company instead of each team defining its own version of 'abandonment'",
          'Owned by Platform Engineering, with derivation rules defined in partnership with the business teams that consume them',
        ],
        technical: 'The Stream Worker maintains short-lived windowed state per customer to detect patterns and emit derived events: e.g., <code>cart_abandoned</code> fires when an add_to_cart event has no matching order_paid within a configurable window (default 60 minutes); <code>browsing_spree</code> fires after N product views within M minutes. Derived events are published back onto Azure Event Hubs with the same schema as any other event, so they flow through the rest of the pipeline identically.',
        chipsLabel: 'Example Derived Events', chips: ['cart_abandoned', 'browsing_spree', 'repeat_visitor', 'price_drop_relevant'],
        artifactTitle: 'Derived Event',
        artifactCode: `{
  "event": "cart_abandoned",
  "event_id": "derived-3c8e...",
  "user_id": "cust_004821",
  "derived_from": ["evt_add_to_cart_991"],
  "properties": { "cart_value": 6998, "minutes_since_add": 62 }
}`,
        integration: [
          '.NET Core Stream Worker — windowed pattern detection and derivation logic',
          'Azure Cache for Redis — holds in-flight windowed state per customer',
          'Azure Event Hubs — derived events are republished here, same as primary events',
          'Activation API — the most common consumer of derived events (e.g., cart-abandonment recovery)',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          "Scale: windowed state is sharded by customer ID and scales with the Stream Worker's partition count",
          'Latency: derived events fire as soon as their defining window/condition is met, typically within minutes',
          "Reliability: derivation rules are versioned; a rule change doesn't retroactively alter already-emitted derived events",
          'Security/Privacy: derived events carry the same classification and consent handling as the raw events they\'re computed from',
        ],
        example: 'A customer adds an item to cart and closes the tab. 62 minutes later, having seen no order_paid event, the Stream Worker emits cart_abandoned — which the Activation API picks up to trigger a recovery email, entirely without the marketing team having to build their own abandonment-detection logic.',
      },
    ],
  },
  {
    anchor: 'batch-processing', name: 'Batch Processing',
    items: [
      {
        slug: 'rollups-aggregations', name: 'Rollups &amp; Aggregations',
        tagline: 'Pre-computed summaries (daily active users, revenue by category, cohort retention) that make dashboards and reports fast without scanning raw events every time.',
        hldCaption: 'Rollups turn billions of raw events into dashboard-ready summaries.',
        hld: [
          { label: 'Data Source', name: 'Data Lakehouse (curated zone)', detail: 'Read source' },
          { label: 'Ingestion', name: 'dbt Core', detail: 'SQL-based transformation framework' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'dbt incremental models, orchestrated by a Dockerized .NET Core scheduler', origin: true },
          { label: 'Foundation', name: 'Data Lakehouse (analytics-marts zone)', detail: 'Or Snowflake, via dbt\'s adapter' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Primary consumer of rollup tables' },
          { label: 'Activation', name: 'Executive &amp; Team Dashboards', detail: 'Fast, affordable reporting' },
        ],
        business: [
          "Raw event-level queries don't scale to interactive dashboards at billions of rows — rollups are what makes reporting fast and affordable",
          "Standardizes how metrics like 'daily active users' are defined and computed, so different teams don't get different numbers for the same metric",
          'Owned by Data Engineering / Analytics Engineering',
        ],
        technical: 'Rollups are defined as dbt models (SQL, materialized as incremental Iceberg tables) rather than hand-rolled batch jobs. A thin .NET Core scheduler, packaged as a Docker container on Azure Container Apps Jobs, triggers <code>dbt run --select tag:rollups</code> on a schedule; dbt\'s incremental materialization processes only the current day/week partition, and <code>dbt test</code> runs automatically afterward (row-count and not-null checks) so a broken aggregation never silently reaches the marts zone. Teams standardized on a cloud warehouse can point the same dbt project at Snowflake via its adapter instead of the lakehouse, without rewriting the SQL.',
        chipsLabel: 'Example Rollups', chips: ['Daily active users', 'Revenue by category', 'Cohort retention', 'Channel-level funnel conversion'],
        artifactTitle: 'dbt Model — Rollup',
        artifactCode: `-- models/marts/revenue_by_category_daily.sql
{{ config(materialized='incremental', unique_key=['event_date','category']) }}

select
  event_date,
  product_category as category,
  sum(amount) as revenue
from {{ ref('stg_order_events') }}
{% if is_incremental() %}
where event_date >= (select max(event_date) from {{ this }})
{% endif %}
group by 1, 2`,
        integration: [
          'dbt Core — SQL-based transformation and testing framework, version-controlled alongside application code',
          'Dockerized .NET Core scheduler (Azure Container Apps Jobs) — triggers <code>dbt run</code> / <code>dbt test</code> on a schedule',
          "Data Lakehouse analytics-marts zone, or Snowflake via dbt's adapter — write destination",
          'Query &amp; Analytics Engine — the primary consumer of rollup tables for dashboards',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          "Scale: dbt's incremental materialization processes only the current day/week partition rather than the full historical table, keeping runtime predictable as data grows",
          'Latency: rollups are typically available a few hours after the day/week closes — not real-time by design',
          'Reliability: idempotent, date-partitioned writes make reruns and backfills safe',
          "Security/Privacy: rollups aggregate away individual-level PII by construction — inherently more privacy-safe than raw event access",
        ],
        example: 'The weekly executive dashboard reads from a pre-computed revenue-by-category dbt model instead of scanning a billion-row raw event table on every page load. When a currency-conversion bug briefly corrupts the aggregation, a <code>dbt test</code> assertion (revenue must be non-negative) fails the run automatically — preventing the bad numbers from ever reaching the dashboard.',
      },
      {
        slug: 'data-modeling', name: 'Data Modeling',
        tagline: 'Transforms raw, event-shaped data into the dimensional/entity models that analytics tools and business users actually think in — customers, orders, products.',
        hldCaption: 'Data Modeling bridges raw events and business-friendly entities.',
        hld: [
          { label: 'Data Source', name: 'Data Lakehouse (curated zone)', detail: 'Source event data' },
          { label: 'Ingestion', name: 'dbt Core', detail: 'Staging &rarr; intermediate &rarr; marts model layers' },
          { label: 'Processing', name: 'Data Modeling', detail: 'dbt models, version-controlled and code-reviewed', origin: true },
          { label: 'Foundation', name: 'Data Lakehouse (analytics-marts zone)', detail: 'Or Snowflake, via dbt\'s adapter' },
          { label: 'Intelligence', name: "Semantic Layer", detail: "Maps business terms onto these models" },
          { label: 'Activation', name: 'BI Tools &amp; Business Users', detail: 'Think in customers, orders, products' },
        ],
        business: [
          "Business users and BI tools don't think in raw events — they think in customers, orders, and products; modeling bridges that gap",
          'Establishes a single, governed definition of core business entities instead of every analyst building their own',
          'Owned by Analytics Engineering, in partnership with each business domain',
        ],
        technical: 'Dimensional models are dbt models following the staging &rarr; intermediate &rarr; marts layering convention: staging models do light cleanup 1:1 with a source table, intermediate models join and reshape, and marts models are the final fact/dimension tables the Query &amp; Analytics Engine\'s semantic layer maps business-friendly names onto. dbt\'s <code>ref()</code> and <code>source()</code> functions build the model dependency graph automatically — this graph is what the Metadata Layer\'s Lineage capability surfaces, so lineage is a byproduct of writing the models correctly, not separate documentation work. Models materialize as Iceberg tables in the lakehouse by default, or in Snowflake for teams standardized on that warehouse, via dbt\'s adapter.',
        chipsLabel: 'Model Types', chips: ['Fact tables (orders, sessions)', 'Dimension tables (customer, product)', 'Slowly changing dimensions (SCD Type 2)'],
        artifactTitle: 'dbt Model — Dimension',
        artifactCode: `-- models/marts/dim_customer.sql
{{ config(materialized='table') }}

select
  customer_key,
  tier,
  signup_date,
  current_timestamp() as valid_from
from {{ ref('stg_customer_profile') }}`,
        integration: [
          'dbt Core — staging/intermediate/marts model layers, version-controlled alongside application code',
          "dbt docs — auto-generates the dependency graph that feeds the Metadata Layer's Lineage",
          "Data Lakehouse analytics-marts zone, or Snowflake via dbt's adapter — model materialization target",
          "Query & Analytics Engine's semantic layer — maps business terms onto marts models",
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          'Scale: dbt chooses incremental or full-refresh materialization per model based on data volume and change rate, keeping build times manageable as history grows',
          "Latency: models typically refresh on an hourly-to-daily cadence, matching the rollups' cadence",
          'Reliability: model changes go through the same pull-request review as an API contract change, since BI tools depend on stability',
          'Security/Privacy: PII fields in dimension tables are classified and access-controlled the same as any other sensitive data in the lakehouse',
        ],
        example: "When Finance asks 'what was gold-tier customer revenue last quarter', the answer comes from a join between the dim_customer and fct_orders dbt models — reviewed via pull request like any other code change — not a bespoke, unreviewed query against raw events.",
      },
      {
        slug: 'backfills', name: 'Backfills',
        tagline: 'Reprocesses historical data when a new source is onboarded, a bug is fixed, or a business rule changes — without waiting for months of new data to accumulate.',
        hldCaption: 'Backfills bring history in line with the current logic, safely.',
        hld: [
          { label: 'Data Source', name: 'Data Lakehouse (raw zone)', detail: 'Source of truth for reprocessing' },
          { label: 'Ingestion', name: 'dbt Core', detail: 'Same model SQL used for backfill and production runs' },
          { label: 'Processing', name: 'Backfills', detail: 'dbt run with a historical date-range variable', origin: true },
          { label: 'Foundation', name: 'Iceberg Time Travel / Versioning', detail: 'Enables safe, validated cutover' },
          { label: 'Intelligence', name: 'Same Transformation Logic', detail: 'Reused, not reimplemented, for consistency' },
          { label: 'Activation', name: 'Corrected Historical Reporting', detail: 'Brings history in line with current logic' },
        ],
        business: [
          'Makes a newly onboarded data source immediately useful with full history, instead of starting from a blank slate',
          'Lets a bug fix or business-logic change apply retroactively, keeping historical reporting consistent with current definitions',
          'Owned by Data Engineering, requested by whichever team needs the correction or onboarding',
        ],
        technical: 'Backfills use dbt\'s variable-driven date-range pattern: <code>dbt run --select model_name --vars \'{"start_date": ..., "end_date": ...}\'</code> reprocesses a historical window using the exact same model SQL as production — there\'s no separate backfill codebase that can drift out of sync with the real pipeline. The job runs as a Docker container on Azure Container Apps Jobs, writing to a new Iceberg snapshot; because the lakehouse\'s Iceberg tables support time travel, the previous snapshot remains queryable and the \'current\' pointer only switches over once <code>dbt test</code> confirms the backfilled output against a validation target.',
        chipsLabel: 'Common Triggers', chips: ['New source onboarding', 'Bug fix in derivation logic', 'Business rule change', 'Schema evolution'],
        artifactTitle: 'dbt Backfill Command',
        artifactCode: `dbt run --select identity_stitched_events \\
  --vars '{"start_date": "2026-01-01", "end_date": "2026-07-31"}' \\
  --target validation`,
        integration: [
          'dbt Core — the same model SQL used for backfill and production runs, parameterized by date range',
          'Iceberg time travel / versioning — enables safe, validated cutover before the new snapshot becomes current',
          'Docker container on Azure Container Apps Jobs — long-running backfill execution',
          'dbt test — runs against the validation target before the backfilled data is promoted',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          'Scale: large backfills (months to years of history) are chunked by date range and run as parallel dbt invocations',
          'Latency: backfills are explicitly not real-time — they\'re scheduled, monitored, long-running jobs',
          'Reliability: table versioning allows validation before cutover and instant rollback if a backfill produces unexpected results',
          'Security/Privacy: backfills follow the same access-control and audit-logging requirements as any other write to the lakehouse',
        ],
        example: 'A fix to the identity-stitching confidence threshold is deployed. Rather than accepting seven months of under-stitched historical profiles, <code>dbt run</code> reprocesses that window with the corrected model against a validation target, <code>dbt test</code> confirms the output, and the snapshot is promoted — bringing historical data in line with the corrected logic without a multi-month wait or a second codebase to maintain.',
      },
      {
        slug: 'ml-feature-prep', name: 'Machine Learning Feature Prep',
        tagline: 'Builds and maintains the feature tables ML models train on and score against — the bridge between raw data and the AI &amp; Insights layer.',
        hldCaption: 'Feature Prep is where most of the real work behind "AI-powered" personalization happens.',
        hld: [
          { label: 'Data Source', name: 'Data Lakehouse (curated zone)', detail: 'Source event data' },
          { label: 'Ingestion', name: 'dbt Python Models', detail: 'pandas/scikit-learn feature transforms' },
          { label: 'Processing', name: 'ML Feature Prep', detail: 'dbt models (SQL + Python) — feature engineering', origin: true },
          { label: 'Foundation', name: 'Feature Store Table', detail: 'Data Lakehouse — computed features' },
          { label: 'Intelligence', name: 'AI &amp; Insights API', detail: 'Reads features at inference time' },
          { label: 'Activation', name: 'Azure Machine Learning', detail: 'Training jobs read point-in-time snapshots' },
        ],
        business: [
          "Model quality is bounded by feature quality — this is where most of the real work in 'AI-powered' personalization actually happens",
          "Reusable feature tables mean a new model doesn't start from raw events every time — it builds on a shared, governed feature set",
          'Owned by Data Science / ML Engineering, using Data Engineering\'s batch infrastructure',
        ],
        technical: 'Most feature tables are ordinary SQL dbt models (recency/frequency/monetary aggregates); features that need array or ML-library logic (e.g., a category-affinity vector) use dbt\'s Python model support, running pandas/scikit-learn inside the same orchestrated pipeline instead of a separate bespoke feature-pipeline codebase. Every feature model gets the same version control, <code>dbt test</code> data-quality checks, and automatic lineage as any other transformation. The .NET Core scheduler, packaged as a Docker container on Azure Container Apps Jobs, triggers the feature-tagged model selection on a schedule; the AI &amp; Insights API reads the latest feature vector at inference time, and Azure Machine Learning training jobs read historical feature snapshots for point-in-time-correct training data.',
        chipsLabel: 'Example Features', chips: ['recency_days', 'purchase_frequency_90d', 'category_affinity_vector', 'engagement_score'],
        artifactTitle: 'dbt Python Model — Feature',
        artifactCode: `# models/features/customer_engagement_score.py
def model(dbt, session):
    df = dbt.ref("stg_customer_events").to_pandas()
    df["engagement_score"] = (
        df["session_count_30d"] * 0.4 + df["purchase_count_30d"] * 0.6
    )
    return df[["customer_key", "engagement_score"]]`,
        integration: [
          'dbt Core (SQL models) + dbt Python models — feature engineering, version-controlled and tested',
          'Feature store table (Data Lakehouse) — where computed features are written',
          'AI &amp; Insights API — reads features at inference time',
          'Azure Machine Learning — training jobs read point-in-time feature snapshots',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; ADLS Gen2 (Iceberg) + Cosmos DB Table API (stream checkpoints)',
        ],
        nfr: [
          "Scale: dbt's incremental materialization updates only changed customers' feature rows rather than a full recompute each run",
          'Latency: features typically refresh daily; models needing fresher signals combine batch features with the real-time enrichment layer',
          "Reliability: point-in-time correctness is enforced so training data never leaks future information into a feature computed 'as of' an earlier date",
          'Security/Privacy: feature tables are subject to the same governance classification as the raw data they are derived from',
        ],
        example: "The propensity-to-convert model used by AI & Insights trains on a point-in-time-correct dbt feature snapshot rather than today's live data — the same <code>dbt test</code> suite that validates the feature model in production also catches a future-leaking join before it ever reaches a training run.",
      },
    ],
  },
  {
    anchor: 'event-schema-registry', name: 'Event Schema &amp; Registry',
    items: [
      {
        slug: 'schema-management', name: 'Schema Management',
        tagline: "The authoritative definition of every event type's shape — what fields exist, their types, and what they mean.",
        hldCaption: 'Schema Management is the single source of truth every other control depends on.',
        hld: [
          { label: 'Data Source', name: 'Domain Teams', detail: 'Register and own event type definitions' },
          { label: 'Ingestion', name: 'Schema Registry API', detail: '.NET Core microservice' },
          { label: 'Processing', name: 'Schema Management', detail: 'Authoritative JSON Schema definitions', origin: true },
          { label: 'Foundation', name: 'Azure Database for PostgreSQL', detail: 'Schema definition storage' },
          { label: 'Intelligence', name: 'Validation Layer (Ingestion)', detail: 'Enforces the registered schema' },
          { label: 'Activation', name: 'Developer Portal', detail: 'Self-service schema lookup' },
        ],
        business: [
          'Without a managed schema, every team\'s understanding of "what fields does this event have" drifts, and integrations silently break',
          'Enables self-service: a team can look up an event\'s schema instead of asking Platform Engineering',
          'Owned by Platform Engineering, with each event type\'s business fields owned by the domain team that emits it',
        ],
        technical: "The Schema Registry is a .NET Core microservice storing JSON Schema definitions for every registered event type, versioned and queryable via a REST API. It's the same schema Validation enforces at ingestion time — a single source of truth rather than two systems that could drift apart. New event types or field additions go through a lightweight registration API call, checked automatically for backward compatibility before being accepted.",
        chipsLabel: 'Registry Capabilities', chips: ['Schema lookup API', 'Version history', 'Compatibility checking', 'Field-level documentation'],
        artifactTitle: 'Schema Registration',
        artifactCode: `POST /v1/schemas/product_viewed
{
  "version": "3",
  "fields": {
    "product_id": { "type": "string", "required": true },
    "price": { "type": "number", "required": true }
  }
}`,
        integration: [
          'Schema Registry API (.NET Core) — the source of truth',
          'Validation layer (Ingestion) — enforces the registered schema at ingestion time',
          'Azure Database for PostgreSQL — schema definition storage',
          'Developer portal — self-service schema lookup for engineering teams',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.SchemaGovernance.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (relational, ACID)',
        ],
        nfr: [
          'Scale: schema lookups are cached aggressively since schemas change far less often than events flow',
          'Latency: not on the hot path for event processing — validation caches the current schema rather than calling the registry per event',
          'Reliability: registry unavailability doesn\'t block ingestion; the last-fetched schema is used until the registry recovers',
          'Security/Privacy: schema definitions are metadata, not customer data, but field classification (PII tags) is set here and propagates downstream',
        ],
        example: "A new team integrating with CXOS looks up the order_paid event's current schema through the developer portal instead of asking another team or reverse-engineering it from example payloads — cutting integration ramp-up time significantly.",
      },
      {
        slug: 'versioning', name: 'Versioning',
        tagline: "Lets an event schema evolve over time without breaking every consumer that was built against an earlier version.",
        hldCaption: 'Versioning is what makes schema evolution safe rather than risky.',
        hld: [
          { label: 'Data Source', name: 'Schema Management', detail: 'Base schema a version builds on' },
          { label: 'Ingestion', name: 'Proposed Schema Change', detail: 'Submitted via the registration API' },
          { label: 'Processing', name: 'Versioning', detail: 'Registry-tracked schema version history', origin: true },
          { label: 'Foundation', name: 'Compatibility Checker', detail: 'Validates new versions before acceptance' },
          { label: 'Intelligence', name: 'Consumers (Analytics, AI, Activation)', detail: 'Declare which version they are built against' },
          { label: 'Activation', name: 'Safe, Non-breaking Evolution', detail: 'What versioning ultimately enables' },
        ],
        business: [
          'The business changes constantly — new fields, new event types — and versioning lets the platform evolve without a coordinated, risky big-bang migration',
          "Protects existing dashboards, models, and integrations from breaking when someone else's team needs a schema change",
          'Owned by Platform Engineering',
        ],
        technical: "Every schema change creates a new version rather than mutating the existing one; events declare which schema version they were produced against, and consumers can request a specific version or 'latest'. The registry retains full version history so a consumer built against v2 keeps working even after v3 is published, until it's explicitly migrated — schema changes are additive-by-default, with breaking changes requiring an explicit major-version bump and a migration plan.",
        chipsLabel: 'Versioning Rules', chips: ['Semantic versioning (major.minor)', 'Additive changes = minor', 'Breaking changes = major + migration plan'],
        artifactTitle: 'Version History Entry',
        artifactCode: `{
  "event_type": "order_paid",
  "versions": [
    { "version": "1", "status": "deprecated", "sunset_date": "2025-12-01" },
    { "version": "2", "status": "active" },
    { "version": "3", "status": "active", "changes": ["added tax_amount field"] }
  ]
}`,
        integration: [
          'Schema Registry — version history storage and API',
          "Event Schema & Registry's compatibility checker — validates new versions before acceptance",
          'Consumers (Analytics API, AI &amp; Insights, Activation API) — declare which schema version they are built against',
          'Developer portal — surfaces deprecation timelines to integration owners',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.SchemaGovernance.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (relational, ACID)',
        ],
        nfr: [
          'Scale: version history storage grows slowly relative to event volume — a non-issue operationally',
          'Latency: not applicable — versioning is a design-time concern, not a runtime performance factor',
          'Reliability: deprecated versions remain functional through their sunset date, giving consumers a real migration window',
          'Security/Privacy: version history itself has no privacy implications — it is schema metadata only',
        ],
        example: 'The Commerce team needs to add a tax_amount field to order_paid. Because it\'s an additive change, it ships as v3 without breaking any of the dozen existing consumers still reading v2 — they migrate to the new field on their own schedule instead of on a forced deadline.',
      },
      {
        slug: 'compatibility', name: 'Compatibility',
        tagline: "Automated checks that a proposed schema change won't silently break an existing consumer before it's ever allowed to ship.",
        hldCaption: 'Compatibility checking turns schema risk into an automated CI gate.',
        hld: [
          { label: 'Data Source', name: 'Versioning', detail: 'New version proposal to check' },
          { label: 'Ingestion', name: 'Schema Diff Engine', detail: 'Compares proposed vs. current schema' },
          { label: 'Processing', name: 'Compatibility Checking', detail: 'Automated schema diff validation', origin: true },
          { label: 'Foundation', name: 'CI/CD Pipeline', detail: 'Runs as a merge gate' },
          { label: 'Intelligence', name: 'Governance Rules', detail: 'Runs alongside this check' },
          { label: 'Activation', name: 'Prevented Breaking Changes', detail: 'The outcome this control delivers' },
        ],
        business: [
          'Turns "did this schema change break anything" from a question discovered in production into one answered automatically before merge',
          'Gives teams confidence to evolve their event schemas without fear of an invisible downstream breakage',
          'Owned by Platform Engineering',
        ],
        technical: 'When a schema change is submitted to the Registry, an automated compatibility checker diffs the proposed schema against the current version using standard rules (removing a required field, narrowing a type, or removing an enum value are breaking; adding an optional field is not) and against the Registry\'s knowledge of active consumers where declared. Breaking changes are rejected unless explicitly submitted as a new major version with a documented migration path.',
        chipsLabel: 'Breaking Change Examples', chips: ['Removing a required field', 'Narrowing a field type', 'Removing an enum value', 'Renaming a field'],
        artifactTitle: 'Compatibility Check Result',
        artifactCode: `{
  "proposed_version": "4",
  "compatible_with": "3",
  "result": "breaking",
  "reason": "field 'currency' changed from optional to required"
}`,
        integration: [
          'Schema Registry API — hosts the compatibility checker',
          'CI/CD pipeline — schema changes run through this check before deployment, same as a code review gate',
          'Versioning system — breaking changes are automatically routed to major-version handling',
          'Developer portal — surfaces check results to the engineer proposing the change',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.SchemaGovernance.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (relational, ACID)',
        ],
        nfr: [
          'Scale: compatibility checks are fast, schema-diff operations — no meaningful performance concern',
          'Latency: runs synchronously in CI, adding seconds to a schema-change pull request, not minutes',
          'Reliability: the checker itself is tested against a suite of known-breaking and known-safe change patterns',
          'Security/Privacy: no data-privacy implications — this is a structural, not content, check',
        ],
        example: 'An engineer accidentally proposes narrowing the discount_percent field from a float to an integer. The compatibility checker flags this as breaking during the pull request, before it ever reaches production and silently truncates every discount value downstream.',
      },
      {
        slug: 'governance-rules', name: 'Governance Rules',
        tagline: "The policy layer on top of the schema registry — who can register what, how PII fields must be tagged, and what naming conventions apply.",
        hldCaption: 'Governance Rules make downstream privacy controls actually enforceable.',
        hld: [
          { label: 'Data Source', name: 'Compatibility Checking', detail: 'Runs alongside this policy check' },
          { label: 'Ingestion', name: 'Schema Registration Request', detail: 'Subject to governance review' },
          { label: 'Processing', name: 'Governance Rules', detail: 'Schema policy enforcement', origin: true },
          { label: 'Foundation', name: "Classification Taxonomy", detail: "Governance & Security's source of valid PII tags" },
          { label: 'Intelligence', name: 'Audit Logs', detail: 'Every rejection is logged' },
          { label: 'Activation', name: 'Enforceable Downstream Privacy Controls', detail: 'Consent enforcement depends on correct tagging here' },
        ],
        business: [
          "Prevents schema sprawl (ten slightly different ways to represent 'order total') that makes cross-team analytics painful",
          'Ensures every PII field is correctly classified at the source, which is what makes downstream privacy controls (consent enforcement, access control) actually reliable',
          'Owned jointly by Platform Engineering and Data Governance',
        ],
        technical: 'Governance Rules are policy checks the Schema Registry runs on every registration or change: naming-convention enforcement (snake_case, consistent event-name verbs), mandatory classification tags on any field that could contain PII, and required ownership metadata (which team owns this event type). Registrations that violate policy are rejected with a specific, actionable error rather than silently accepted.',
        chipsLabel: 'Enforced Rules', chips: ['Naming conventions', 'Mandatory PII classification tags', 'Required team ownership metadata', 'Deprecation notice period'],
        artifactTitle: 'Governance Policy Check',
        artifactCode: `{
  "field": "properties.customer_email",
  "issue": "missing PII classification tag",
  "required_action": "add classification: 'pii.email'",
  "status": "rejected"
}`,
        integration: [
          'Schema Registry — where governance checks run alongside compatibility checks',
          'Governance &amp; Security\'s data classification taxonomy — the source of valid PII tags',
          'Data Governance team — reviews and updates the rule set over time',
          'Audit Logs — every governance rejection is logged for compliance visibility',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Processing.SchemaGovernance.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (relational, ACID)',
        ],
        nfr: [
          'Scale: policy checks are rule-based and fast, no different in cost from compatibility checking',
          'Latency: runs synchronously as part of schema registration, same CI-gate pattern as compatibility checking',
          "Reliability: rule updates are versioned so historical schemas aren't retroactively marked non-compliant",
          'Security/Privacy: this is itself a core privacy control — correct PII tagging here is what makes consent enforcement and encryption policy enforceable downstream',
        ],
        example: 'A team registers a new event type with a customer_ssn field but forgets to tag it as PII. Governance Rules rejects the registration until the field is properly classified — preventing an unclassified sensitive field from ever reaching the pipeline where it could bypass consent and encryption controls built around classification tags.',
      },
    ],
  },
];

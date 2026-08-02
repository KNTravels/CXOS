module.exports = [
  {
    anchor: 'identity-profile', name: 'Identity &amp; Profile Service',
    items: [
      {
        slug: 'unified-customer-profile', name: 'Unified Customer Profile',
        tagline: 'The single, continuously-updated record of a customer assembled from every touchpoint and business system — the object every other Intelligence &amp; Services capability reads from.',
        hldCaption: 'Every touchpoint and business system ultimately resolves into one profile record.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Identity-stitched, deduplicated events' },
          { label: 'Foundation', name: 'Curated Zone', detail: 'curated.identity_stitched_events (Unified Data Foundation)' },
          { label: 'Intelligence', name: 'Unified Customer Profile', detail: '.NET Core Analytics/AI API, materialized in Azure DB for PostgreSQL', origin: true },
          { label: 'Activation', name: 'Every Destination &amp; Service', detail: 'Profile API is the single read path for downstream consumers' },
        ],
        business: [
          'Gives every team — marketing, support, sales — the same view of a customer instead of each system holding a fragmented slice of the relationship',
          'Directly enables personalization, support-context lookups, and propensity scoring, all of which depend on one trustworthy profile rather than reconciling several',
          'Owned by Data Engineering / Customer Data Platform team',
        ],
        technical: 'A scheduled dbt model rebuilds <code>marts.customer_profile</code> from the curated zone\'s identity-stitched events, merging demographic attributes, lifecycle stage, consent state, and computed fields (LTV band, churn risk) into one row per customer. The result is served by a .NET Core Analytics/AI API — packaged as a Docker container on Azure Container Apps — that exposes it through the Profile API, backed by Azure Database for PostgreSQL for low-latency point lookups and Azure Cache for Redis for the highest-traffic keys.',
        chipsLabel: 'Profile Attributes', chips: ['Demographics', 'Lifecycle stage', 'LTV band', 'Consent state', 'Preferred channel'],
        artifactTitle: 'Profile Record',
        artifactCode: `{
  "customer_key": "cust_004821",
  "lifecycle_stage": "active",
  "ltv_band": "gold",
  "preferred_channel": "email",
  "consent_basis": { "marketing": true, "analytics": true },
  "updated_at": "2026-08-02T06:00:00Z"
}`,
        integration: [
          'Curated Zone (Unified Data Foundation) — source of the identity-stitched events the profile is built from',
          'dbt — the modeling framework that materializes marts.customer_profile on a schedule',
          'Identity Graph — supplies the resolved customer_key this record is keyed on',
          'Profile API — the read path every downstream service and destination uses',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Profile.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Cosmos DB (Core API + Gremlin API) + Azure Cache for Redis',
        ],
        nfr: [
          'Scale: profile table grows linearly with customer count, not event count, keeping it compact relative to the raw event volume',
          'Latency: point lookups by customer_key return in single-digit milliseconds via Redis cache in front of PostgreSQL',
          'Reliability: rebuilt on a fixed dbt schedule with dbt test coverage, so a bad upstream batch is caught before it overwrites a good profile',
          'Security/Privacy: every field carries the classification tags inherited from its source (Data Classification), and consent_basis gates which downstream purposes may read it',
        ],
        example: 'A support agent opens a ticket and the console calls the Profile API once, getting lifecycle stage, LTV band, and consent state in one round trip — replacing what used to be three separate lookups against CRM, Commerce, and a marketing tool that frequently disagreed with each other.',
      },
      {
        slug: 'identity-graph', name: 'Identity Graph',
        tagline: 'The graph of every known identifier for a customer — device IDs, cookies, emails, loyalty IDs — and the resolved links between them that make "one customer" possible.',
        hldCaption: 'Identity Graph is the resolution layer the Unified Customer Profile is keyed on.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Identity Resolution', detail: "Data Sources' Customer Touchpoints stitching logic" },
          { label: 'Foundation', name: 'curated.identity_edges', detail: 'Graph edges stored as an Iceberg table' },
          { label: 'Intelligence', name: 'Identity Graph', detail: '.NET Core Analytics/AI API, graph queries over Azure DB for PostgreSQL', origin: true },
          { label: 'Activation', name: 'Unified Customer Profile', detail: 'Resolves the canonical customer_key every profile is keyed on' },
        ],
        business: [
          'Without a maintained identity graph, "unified" profile is a fiction — this is the mechanism that actually links an anonymous web cookie to a known loyalty member',
          'Improves attribution accuracy and prevents the same person being double-counted as two customers in reporting',
          'Owned by Data Engineering / Customer Data Platform team',
        ],
        technical: 'Identity edges (device_id&harr;email, cookie&harr;loyalty_id, etc.) produced by the Identity Resolution step during Transformation &amp; Processing are persisted as a versioned graph table in the curated zone. The Analytics/AI API — a Docker container running on Azure Container Apps — exposes a graph-traversal endpoint that resolves any known identifier to its canonical <code>customer_key</code>, using Azure Database for PostgreSQL\'s recursive CTE support for multi-hop traversal and Azure Cache for Redis to cache hot lookups.',
        chipsLabel: 'Identifier Types', chips: ['device_id', 'cookie_id', 'email hash', 'loyalty_id', 'phone hash'],
        artifactTitle: 'Identity Resolution Query',
        artifactCode: `GET /identity/resolve?device_id=dev_88f2

{
  "customer_key": "cust_004821",
  "resolved_via": ["device_id", "email_hash"],
  "confidence": "high",
  "linked_identifiers": 4
}`,
        integration: [
          "Data Sources' Identity Resolution — produces the raw edges this graph consumes",
          'curated.identity_edges — the Iceberg table storing graph edges',
          'Unified Customer Profile — resolves customer_key via this graph before every profile read',
          'AI &amp; Insights — anomaly detection flags identity edges with unusually low confidence',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Profile.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Cosmos DB (Core API + Gremlin API) + Azure Cache for Redis',
        ],
        nfr: [
          'Scale: edge count grows faster than customer count (many identifiers per customer), so the graph table is partitioned by customer_key for traversal performance',
          'Latency: single-hop resolution is cache-served in single-digit milliseconds; rare multi-hop traversals fall back to PostgreSQL and complete in under 100ms',
          'Reliability: low-confidence merges are flagged rather than auto-applied, preventing one bad match from silently merging two different customers',
          'Security/Privacy: raw identifiers (email, phone) are stored hashed, and the graph itself is classified PII under Data Classification',
        ],
        example: "A customer browses anonymously on mobile, then logs in on desktop hours later. The identity graph links the anonymous device_id session to the newly authenticated email, so their browsing behavior — not just the desktop session — informs the propensity score the AI & Insights engine computes minutes later.",
      },
      {
        slug: 'relationships', name: 'Relationships',
        tagline: 'Models the connections between customer records themselves — households, corporate accounts, referrals — beyond identity resolution\'s single-person linking.',
        hldCaption: 'Relationships link customer records to each other, not just identifiers to a customer.',
        hld: [
          { label: 'Data Source', name: 'Business Systems', detail: 'CRM account hierarchies, loyalty referral records' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'Business system connectors' },
          { label: 'Processing', name: 'Data Modeling', detail: "Transformation & Processing's dbt models" },
          { label: 'Foundation', name: 'curated.customer_relationships', detail: 'Relationship edges as an Iceberg table' },
          { label: 'Intelligence', name: 'Relationships', detail: '.NET Core Analytics/AI API relationship endpoint', origin: true },
          { label: 'Activation', name: 'Household &amp; Account Views', detail: 'Powers account-level personalization and B2B activation' },
        ],
        business: [
          "Lets the business reason at the household or corporate-account level, not just the individual — essential for B2B customers and family/household marketing",
          "Improves referral-program accuracy by linking a new sign-up back to the referring customer's own profile",
          'Owned by Data Engineering, with relationship types sourced from CRM/Loyalty business rules',
        ],
        technical: 'A dbt model in Transformation &amp; Processing derives relationship edges — household (shared address/payment method), corporate account (CRM hierarchy), and referral (loyalty program referral codes) — into <code>curated.customer_relationships</code>. The Analytics/AI API, deployed as a Docker container on Azure Container Apps, exposes a relationship-traversal endpoint so a query for one customer can return their household or corporate-account peers in a single call.',
        chipsLabel: 'Relationship Types', chips: ['Household', 'Corporate account', 'Referral', 'Family plan member'],
        artifactTitle: 'Relationship Record',
        artifactCode: `{
  "customer_key": "cust_004821",
  "relationship_type": "household",
  "related_keys": ["cust_004822", "cust_004823"],
  "source": "shared_payment_method"
}`,
        integration: [
          'Business Systems (CRM, Loyalty) — source of account hierarchy and referral data',
          'Data Modeling (Transformation &amp; Processing) — the dbt model producing relationship edges',
          'Unified Customer Profile — household/account context is attached to profile reads on request',
          'Real-time Activation — household-level suppression rules (e.g., one offer email per household) read from this endpoint',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Profile.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Cosmos DB (Core API + Gremlin API) + Azure Cache for Redis',
        ],
        nfr: [
          'Scale: relationship edges are a small fraction of total customer count, so the table stays compact even at enterprise scale',
          'Latency: relationship lookups are cached alongside profile lookups and return in single-digit milliseconds',
          'Reliability: relationship inference rules are versioned in dbt and tested, since a bad rule could incorrectly merge unrelated households',
          'Security/Privacy: a household view of another member\'s data respects that member\'s own consent state — visibility is not an implicit override of individual privacy',
        ],
        example: 'A marketing campaign wants to send one offer per household rather than one per family member. The Relationships endpoint collapses four individually-profiled family members into a single household, cutting redundant sends and the complaint rate that comes with them.',
      },
      {
        slug: 'profile-api', name: 'Profile API',
        tagline: 'The single, versioned API surface every internal service and external destination uses to read (never directly query) customer profile data.',
        hldCaption: 'One API surface, so every consumer gets the same governed view of the profile.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Populates the profile the API serves' },
          { label: 'Foundation', name: 'Unified Data Foundation', detail: 'Governance & Security enforces field-level access' },
          { label: 'Intelligence', name: 'Profile API', detail: '.NET Core Analytics/AI API behind Azure API Management', origin: true },
          { label: 'Activation', name: 'Every Consumer', detail: 'Support tools, activation destinations, other microservices' },
        ],
        business: [
          "Prevents every consuming team from writing its own SQL against the profile table, which would create N different, drifting interpretations of 'the customer'",
          'Gives Governance &amp; Security a single enforcement point for field-level access instead of N direct-query paths to audit',
          'Owned by Data Engineering / Platform Engineering',
        ],
        technical: 'The Profile API is a .NET Core service — packaged as a Docker container and deployed on AKS — fronted by Azure API Management, which applies rate limiting, authentication, and request logging consistently with the Ingestion Layer\'s gateway pattern. It exposes REST and gRPC endpoints backed by the Unified Customer Profile and Identity Graph, enforcing the same RBAC/ABAC and column-masking policies defined in Governance &amp; Security so a caller\'s permitted fields are consistent whether they call the API from a support tool or an activation service.',
        chipsLabel: 'Endpoints', chips: ['GET /profile/{customer_key}', 'GET /identity/resolve', 'GET /relationships/{customer_key}', 'POST /profile/batch'],
        artifactTitle: 'Profile API Request',
        artifactCode: `GET /v1/profile/cust_004821
Authorization: Bearer <service-token>

200 OK
{ "customer_key": "cust_004821", "lifecycle_stage": "active", "ltv_band": "gold" }
-- fields the caller is not entitled to are omitted, not nulled`,
        integration: [
          'Azure API Management — gateway: auth, rate limiting, request logging',
          'Unified Customer Profile, Identity Graph, Relationships — the underlying data this API serves',
          'Access Control (RBAC/ABAC) — enforced per request, per field',
          'Application Insights — per-request tracing and dependency tracking across every call',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Profile.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Cosmos DB (Core API + Gremlin API) + Azure Cache for Redis',
        ],
        nfr: [
          'Scale: stateless service scales horizontally on AKS behind API Management; read-heavy traffic is absorbed by the Redis cache layer beneath it',
          'Latency: p99 under 100ms for single-customer reads; batch endpoint is used for bulk activation exports rather than looping single calls',
          'Reliability: circuit breakers and retry policies (Polly) protect callers if the underlying PostgreSQL store is under load',
          'Security/Privacy: every response is entitlement-filtered per caller identity — omitting fields the caller lacks access to, not just masking them',
        ],
        example: "The Real-time Activation service calls the Profile API to check consent and preferred channel before sending a promotional email, and the same API — with different caller entitlements — powers a support agent's console, guaranteeing both see a consistent, correctly-governed view of the customer.",
      },
    ],
  },
  {
    anchor: 'query-analytics-engine', name: 'Query &amp; Analytics Engine',
    items: [
      {
        slug: 'semantic-layer', name: 'Semantic Layer',
        tagline: 'A shared layer of business-defined metrics and dimensions that sits between raw lakehouse tables and every BI tool or query, so "revenue" means the same thing everywhere.',
        hldCaption: 'The Semantic Layer is what keeps every dashboard\'s numbers reconcilable.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'dbt marts feed the semantic definitions' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Analytics-ready dimensional models' },
          { label: 'Intelligence', name: 'Semantic Layer', detail: 'DataFusion-backed metric definitions, .NET Core Analytics/AI API', origin: true },
          { label: 'Activation', name: 'BI Tools &amp; AI Copilot', detail: 'Every consumer queries the same metric definitions' },
        ],
        business: [
          'Ends the recurring problem of two dashboards showing two different numbers for "revenue" because each was computed with a slightly different SQL query',
          'Lets business users self-serve metrics without needing to know the underlying table joins',
          'Owned by Analytics Engineering, metric definitions reviewed with the owning business domain',
        ],
        technical: 'Metric and dimension definitions (e.g., <code>net_revenue = sum(order_total) - sum(refund_amount)</code>) are declared once, version-controlled alongside the dbt models in Rollups &amp; Aggregations that they read from, and compiled into SQL by the Query &amp; Analytics Engine\'s DataFusion runtime — running inside a .NET Core Analytics/AI API packaged as a Docker container on Azure Container Apps. Any consumer (BI tool, ad hoc query, the AI Copilot) requests a metric by name rather than writing its own aggregation logic, guaranteeing every caller gets an identical computation.',
        chipsLabel: 'Semantic Objects', chips: ['Metrics (net_revenue, churn_rate)', 'Dimensions (region, channel, ltv_band)', 'Time grains (day/week/month)'],
        artifactTitle: 'Metric Definition',
        artifactCode: `metric: net_revenue
  sql: sum(order_total) - sum(refund_amount)
  table: marts.order_fact
  dimensions: [region, channel, product_category]
  time_grain: day`,
        integration: [
          'Rollups &amp; Aggregations (Transformation &amp; Processing) — dbt marts the semantic layer reads from',
          'Data Dictionary (Metadata Layer) — business-readable definitions are cross-linked to semantic metrics',
          'AI Copilot — translates natural language into semantic-layer metric requests rather than raw SQL',
          'BI tools (Power BI, Looker-class tools) — connect via the semantic layer\'s query API, not directly to marts tables',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (semantic layer) + Azure Cache for Redis (query cache)',
        ],
        nfr: [
          'Scale: metric definitions grow with business complexity, not data volume — a governance/curation concern more than an infrastructure one',
          'Latency: metric compilation to SQL adds negligible overhead; actual query latency is dominated by the Query Optimizer and Caching layers beneath it',
          'Reliability: metric definitions are code-reviewed and tested like dbt models, since a wrong formula silently produces a wrong number everywhere it is used',
          'Security/Privacy: semantic-layer queries still pass through Access Control (RBAC/ABAC) — a shared metric definition does not bypass row/column-level entitlements',
        ],
        example: 'Finance and Marketing both build dashboards referencing net_revenue by region. Because both queries compile through the same semantic definition, a quarter-end reconciliation that used to take a week of tracing formula differences now takes minutes.',
      },
      {
        slug: 'metrics-dimensions', name: 'Metrics &amp; Dimensions',
        tagline: 'The curated catalog of approved, governed metrics and dimensions available through the Semantic Layer — what business users actually browse and pick from.',
        hldCaption: 'Metrics & Dimensions is the browsable catalog on top of the Semantic Layer\'s definitions.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Underlying marts models' },
          { label: 'Foundation', name: 'Data Dictionary', detail: 'Business-readable definitions (Metadata Layer)' },
          { label: 'Intelligence', name: 'Metrics &amp; Dimensions', detail: 'Governed catalog exposed by the Analytics/AI API', origin: true },
          { label: 'Activation', name: 'Self-Service BI', detail: 'Business users pick from an approved list, not raw tables' },
        ],
        business: [
          'Gives business users a finite, trustworthy list of approved metrics instead of an intimidating list of every raw table and column',
          'Reduces the support burden on Analytics Engineering by making metric discovery self-service',
          'Owned by Analytics Engineering, curated with input from each business domain',
        ],
        technical: 'Every metric and dimension registered in the Semantic Layer is exposed through a catalog endpoint on the Analytics/AI API (a Docker container on Azure Container Apps), including its business description pulled from the Data Dictionary, valid dimension values, and which teams own it. New metrics go through a lightweight review process before appearing in the catalog, keeping the browsable list curated rather than growing unbounded with every ad hoc calculation anyone has ever written.',
        chipsLabel: 'Catalog Fields', chips: ['Metric name & description', 'Available dimensions', 'Owning team', 'Approval status'],
        artifactTitle: 'Metrics Catalog Entry',
        artifactCode: `GET /v1/metrics

[{
  "name": "net_revenue",
  "description": "Order total less refunds, in USD",
  "dimensions": ["region", "channel", "product_category"],
  "owner_team": "finance-analytics",
  "status": "approved"
}]`,
        integration: [
          'Semantic Layer — the metric definitions this catalog exposes',
          'Data Dictionary (Metadata Layer) — supplies business-readable descriptions',
          'BI tools — query the catalog to populate metric picker UIs',
          'AI Copilot — uses the catalog to ground natural-language questions in valid, approved metrics',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (semantic layer) + Azure Cache for Redis (query cache)',
        ],
        nfr: [
          'Scale: catalog size tracks metric count (dozens to low hundreds), trivial relative to data volume',
          'Latency: catalog reads are cached aggressively since the list changes infrequently relative to query traffic',
          'Reliability: a metric review/approval step prevents unvetted calculations from appearing as if they were an official number',
          'Security/Privacy: catalog entries are metadata only; actual metric values still respect Access Control at query time',
        ],
        example: 'A new marketing analyst opens the BI tool\'s metric picker and finds net_revenue, churn_rate, and ltv_band already defined with descriptions and valid dimensions — building their first dashboard in an afternoon instead of a week of asking data engineering what tables to join.',
      },
      {
        slug: 'query-optimizer', name: 'Query Optimizer',
        tagline: 'The query-planning layer that turns a semantic-layer request or ad hoc SQL query into an efficient execution plan against the lakehouse.',
        hldCaption: 'The Query Optimizer is why a well-formed question doesn\'t require the asker to know partition strategy.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Produces the tables being queried' },
          { label: 'Foundation', name: 'Partitioning &amp; Clustering', detail: 'Iceberg hidden partitioning the optimizer exploits' },
          { label: 'Intelligence', name: 'Query Optimizer', detail: 'DataFusion query planner, .NET Core Analytics/AI API', origin: true },
          { label: 'Activation', name: 'Interactive Dashboard Latency', detail: 'The direct beneficiary of good query planning' },
        ],
        business: [
          'The difference between a query that returns instantly and one that times out is usually query planning, not raw compute — this is where that gap is closed',
          'Keeps query compute costs proportional to the question asked, not the total size of the lakehouse',
          'Owned by Analytics Engineering / Platform Engineering',
        ],
        technical: 'Queries compiled from the Semantic Layer or submitted ad hoc are planned by the Apache Arrow DataFusion engine running inside the Analytics/AI API (a Docker container on AKS), which pushes filter predicates down to Iceberg\'s partition metadata (from Partitioning &amp; Clustering) to prune irrelevant files before any data is read, reorders joins based on table statistics, and can route especially large ad hoc analytical workloads to Snowflake or Spark via the same Iceberg tables when a query exceeds DataFusion\'s efficient working range.',
        chipsLabel: 'Optimizations', chips: ['Partition pruning', 'Predicate pushdown', 'Join reordering', 'Snowflake/Spark offload for large scans'],
        artifactTitle: 'Query Plan (abridged)',
        artifactCode: `EXPLAIN SELECT net_revenue FROM marts.order_fact
WHERE event_date >= '2026-07-26';

-- Plan: Partition prune (7 of 400+ date partitions read)
--       -> Projection push-down (order_total, refund_amount only)
--       -> Aggregate (sum)`,
        integration: [
          'Partitioning &amp; Clustering (Unified Data Foundation) — the physical layout the optimizer prunes against',
          'Semantic Layer — the compiled SQL the optimizer plans and executes',
          'Snowflake / Spark — offload targets for workloads beyond DataFusion\'s efficient range, via the same Iceberg tables',
          'Caching — the layer the optimizer checks before planning a fresh execution',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (semantic layer) + Azure Cache for Redis (query cache)',
        ],
        nfr: [
          'Scale: partition pruning keeps query cost roughly constant as total lakehouse size grows, since only relevant partitions are ever touched',
          'Latency: p95 interactive dashboard queries return in under 2 seconds against multi-billion-row fact tables',
          'Reliability: a query plan that would scan an unreasonable number of partitions is flagged and rejected before execution rather than silently running for hours',
          'Security/Privacy: the optimizer plans within the row/column boundaries Access Control already applied — it never exposes data the caller lacks entitlement to see',
        ],
        example: 'A "last 7 days of revenue by region" dashboard query against a 3-billion-row order_fact table returns in under a second because the optimizer prunes to 7 of 400+ date partitions before ever touching storage, rather than scanning the full table history.',
      },
      {
        slug: 'caching', name: 'Caching',
        tagline: 'The result and metadata caching layer that makes repeated or near-identical queries return instantly instead of re-executing the full plan every time.',
        hldCaption: 'Caching is why the tenth person to open the same dashboard doesn\'t wait as long as the first.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Cache invalidation is keyed to batch/stream completion' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Source of truth the cache is invalidated against' },
          { label: 'Intelligence', name: 'Caching', detail: 'Azure Cache for Redis in front of the Query Optimizer', origin: true },
          { label: 'Activation', name: 'Interactive Dashboards &amp; AI Copilot', detail: 'The direct beneficiaries of a cache hit' },
        ],
        business: [
          'Most dashboard traffic is many people asking the same or nearly the same question — caching turns that traffic pattern into a cost and latency win rather than repeated full-cost execution',
          'Protects the lakehouse from being overloaded by popular-dashboard traffic during business hours',
          'Owned by Analytics Engineering / Platform Engineering',
        ],
        technical: 'Query results are cached in Azure Cache for Redis, keyed on a normalized representation of the compiled semantic-layer query plus its parameters, with a TTL tuned per mart to the underlying dbt refresh schedule so a cache entry never outlives the data it was computed from. Rollups &amp; Aggregations\' batch jobs actively invalidate the relevant cache keys on completion — packaged as part of the same .NET Core scheduler that orchestrates dbt runs — rather than relying purely on TTL expiry, keeping the cache from serving stale results after a fresh batch lands.',
        chipsLabel: 'Cache Layers', chips: ['Query-result cache (Redis)', 'Metadata/catalog cache', 'Active invalidation on batch completion'],
        artifactTitle: 'Cache Key Structure',
        artifactCode: `cache:query:{metric_hash}:{dimension_filter_hash}:{time_grain}
TTL: aligned to marts.order_fact's dbt refresh schedule (hourly)
Invalidated on: rollups_aggregations job completion`,
        integration: [
          'Azure Cache for Redis — the caching implementation',
          'Rollups &amp; Aggregations — actively invalidates cache entries on batch completion',
          'Query Optimizer — checks the cache before planning a fresh execution',
          'AI Copilot — benefits from cache hits on the common questions it fields repeatedly',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL (semantic layer) + Azure Cache for Redis (query cache)',
        ],
        nfr: [
          'Scale: cache sizing tracks distinct-query cardinality among popular dashboards, not total data volume',
          'Latency: a cache hit returns in single-digit milliseconds versus hundreds of milliseconds to seconds for a fresh execution',
          "Reliability: active invalidation on batch completion, not TTL alone, is what prevents a stale-cache correctness bug after a fix lands upstream",
          'Security/Privacy: cache entries are scoped per caller entitlement context, not shared blindly across users with different access levels',
        ],
        example: "During a Monday morning traffic spike, 200 people open the same executive revenue dashboard within 10 minutes. Only the first query executes a full plan against the lakehouse; the remaining 199 are served from cache in milliseconds, keeping the underlying query engine's load flat.",
      },
    ],
  },
  {
    anchor: 'ai-insights', name: 'AI &amp; Insights',
    items: [
      {
        slug: 'anomaly-detection', name: 'Anomaly Detection',
        tagline: 'Continuously monitors key metrics and data-quality signals for statistically unusual behavior and raises it before a human would otherwise notice.',
        hldCaption: 'Anomaly Detection watches the marts layer so a bad number gets caught before a dashboard is.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Metric time series the model scores' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Source metrics evaluated on each refresh' },
          { label: 'Intelligence', name: 'Anomaly Detection', detail: 'Azure Machine Learning model, scheduled scoring job', origin: true },
          { label: 'Activation', name: 'Alerts &amp; Notifications', detail: 'Anomalies are surfaced as operational alerts' },
        ],
        business: [
          "Catches metric and data-quality regressions — a broken connector, a mis-tagged event, a real business anomaly — before a stakeholder spots it in a dashboard and asks an unplanned question",
          "Reduces mean-time-to-detect for revenue or volume anomalies from 'whenever someone notices' to minutes",
          'Owned by Analytics Engineering / Data Science, alert routing owned by Operational Services',
        ],
        technical: 'An Azure Machine Learning-hosted model (a seasonal-decomposition and z-score ensemble, retrained periodically) scores every registered Semantic Layer metric on each dbt refresh, comparing the latest value against its expected range given historical seasonality. The scoring job runs as a .NET Core-orchestrated Azure Container Apps Job — a Docker container invoking the Azure ML scoring endpoint — and any metric outside its confidence band is written to an anomalies table that Alerts &amp; Notifications polls.',
        chipsLabel: 'Detected Anomaly Types', chips: ['Metric value out of range', 'Volume drop/spike', 'Data-quality regression', 'Schema drift correlation'],
        artifactTitle: 'Anomaly Record',
        artifactCode: `{
  "metric": "net_revenue",
  "dimension": { "region": "APAC" },
  "expected_range": [42000, 58000],
  "observed": 12400,
  "severity": "high",
  "detected_at": "2026-08-02T07:15:00Z"
}`,
        integration: [
          'Rollups &amp; Aggregations — supplies the metric time series being scored',
          'Azure Machine Learning — hosts and serves the anomaly-scoring model',
          'Alerts &amp; Notifications (Operational Services) — routes detected anomalies to the owning team',
          'Data Quality Monitoring (Operational Services) — a related but distinct signal source; anomalies here are metric-level, not row-level',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Data Explorer/Kusto (scoring time series) + Azure Database for PostgreSQL',
        ],
        nfr: [
          'Scale: scoring runs once per metric per refresh cycle, so cost scales with catalog size, not raw event volume',
          'Latency: anomalies are detected within one refresh cycle of the underlying metric — typically within the hour',
          'Reliability: the model is retrained on a rolling window so seasonal patterns (e.g., holiday spikes) do not get permanently flagged as anomalies',
          'Security/Privacy: scoring operates on aggregated metrics, not row-level customer data, keeping the model\'s inputs low-sensitivity',
        ],
        example: 'An APAC connector silently breaks overnight, dropping reported revenue to a quarter of its expected range. Anomaly Detection flags it within the hour and Alerts &amp; Notifications pages the on-call data engineer — instead of the drop being discovered two days later when Finance asks why the weekly number looks wrong.',
      },
      {
        slug: 'predictive-models', name: 'Predictive Models',
        tagline: 'The shared framework for training, versioning, and serving machine learning models — churn, LTV forecasting, demand — that other AI & Insights capabilities build on.',
        hldCaption: 'Predictive Models is the shared ML platform every scoring capability in this module is built on.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'dbt Python Models', detail: 'Feature prep (Rollups & Aggregations)' },
          { label: 'Foundation', name: 'marts.ml_features', detail: 'Curated feature tables in the lakehouse' },
          { label: 'Intelligence', name: 'Predictive Models', detail: 'Azure Machine Learning training + registry', origin: true },
          { label: 'Activation', name: 'Propensity Scores, AI Copilot', detail: 'Consumers of trained model outputs' },
        ],
        business: [
          'Gives every predictive use case (churn, LTV, propensity) a shared, auditable training and deployment pipeline instead of one-off notebooks nobody can reproduce',
          'Makes model performance and drift visible to the business, not just to the data science team that built it',
          'Owned by Data Science, feature pipelines co-owned with Data Engineering',
        ],
        technical: 'Feature engineering happens as dbt Python models — version-controlled and tested like any other dbt model — producing curated feature tables (<code>marts.ml_features</code>) directly from the lakehouse. Azure Machine Learning handles training, experiment tracking, and model registry; trained models are deployed behind a .NET Core Analytics/AI API scoring endpoint (a Docker container on Azure Container Apps) so downstream capabilities like Propensity Scores call a stable API rather than loading a model file directly.',
        chipsLabel: 'Pipeline Stages', chips: ['dbt Python feature models', 'Azure ML training & registry', 'Scoring API (Docker/ACA)', 'Drift monitoring'],
        artifactTitle: 'Model Registry Entry',
        artifactCode: `{
  "model_name": "churn_risk_v4",
  "framework": "azureml",
  "trained_on": "marts.ml_features (as of 2026-07-28)",
  "auc": 0.87,
  "deployed_endpoint": "/v1/score/churn_risk_v4"
}`,
        integration: [
          'Rollups &amp; Aggregations / dbt Python models — feature engineering pipeline',
          'Azure Machine Learning — training, experiment tracking, model registry',
          'Propensity Scores — the primary consumer of trained model outputs',
          'Application Insights — tracks scoring-endpoint latency and error rates in production',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Data Explorer/Kusto (scoring time series) + Azure Database for PostgreSQL',
        ],
        nfr: [
          'Scale: training runs on a scheduled cadence (not per-request), so cost scales with retraining frequency, not query volume',
          'Latency: the scoring API returns predictions in under 100ms per customer, using a pre-loaded model rather than cold-starting per request',
          'Reliability: every deployed model is versioned in the registry, so a regression can be rolled back to the prior version without retraining',
          'Security/Privacy: feature tables inherit classification tags from their source fields — a model trained on PII-derived features is itself treated as a sensitive artifact',
        ],
        example: 'A new churn model scores 0.87 AUC in offline evaluation but drifts to 0.79 in production after a promotional pricing change shifts customer behavior. Drift monitoring flags the gap, and the team rolls back to the prior registry version while retraining — a controlled response instead of silently serving degraded predictions.',
      },
      {
        slug: 'propensity-scores', name: 'Propensity Scores',
        tagline: 'Per-customer likelihood scores — to convert, to churn, to upgrade — computed from Predictive Models and served alongside the profile for use in activation.',
        hldCaption: 'Propensity Scores turn a trained model into a per-customer number activation can act on.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Predictive Models', detail: 'Supplies the trained scoring model' },
          { label: 'Foundation', name: 'marts.ml_features', detail: 'Per-customer feature vector at scoring time' },
          { label: 'Intelligence', name: 'Propensity Scores', detail: 'Batch + on-demand scoring, Azure DB for PostgreSQL', origin: true },
          { label: 'Activation', name: 'Real-time Activation, Reverse ETL', detail: 'Scores drive audience segmentation and CRM sync' },
        ],
        business: [
          "Turns a model's raw prediction into a concrete, usable number — 'this customer has a 78% churn risk' — that marketing and support can act on directly",
          'Improves campaign efficiency by targeting the customers most likely to respond, rather than blasting an entire segment',
          'Owned by Data Science, consumed operationally by Marketing and Support',
        ],
        technical: "A daily batch job scores every active customer's feature vector through the relevant Predictive Model (churn, conversion, upgrade), writing results to <code>marts.propensity_scores</code>, with an on-demand scoring path through the same .NET Core Analytics/AI API for customers who need a fresher score (e.g., immediately after a high-signal event). Scores are surfaced through the Profile API so any consumer already reading profile data gets propensity alongside it without a separate integration.",
        chipsLabel: 'Score Types', chips: ['Churn risk', 'Conversion propensity', 'Upgrade/upsell propensity', 'Next-best-action'],
        artifactTitle: 'Propensity Score Record',
        artifactCode: `{
  "customer_key": "cust_004821",
  "churn_risk": 0.78,
  "conversion_propensity": 0.12,
  "scored_at": "2026-08-02T02:00:00Z",
  "model_version": "churn_risk_v4"
}`,
        integration: [
          'Predictive Models — supplies the trained model each score type is computed from',
          'Profile API — surfaces scores alongside profile reads',
          'Real-time Activation — segments audiences by propensity threshold for campaigns',
          'Reverse ETL / CDP Sync — pushes scores into CRM so sales/support see them in their native workflow',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Data Explorer/Kusto (scoring time series) + Azure Database for PostgreSQL',
        ],
        nfr: [
          'Scale: daily batch scoring covers the full active customer base; on-demand scoring is reserved for high-value, low-volume triggers to control cost',
          'Latency: batch scores are available by start of business; on-demand scores return in under 200ms',
          'Reliability: a scoring job failure holds the prior day\'s scores rather than serving nulls, so downstream campaigns degrade gracefully rather than breaking',
          'Security/Privacy: propensity scores are treated as PII-derived data and inherit the same access controls as the profile they are attached to',
        ],
        example: 'Marketing targets a win-back campaign at customers with churn_risk above 0.7 and conversion_propensity above 0.3 simultaneously — a segment that used to require a manual data-science pull now refreshes automatically every morning as part of the standard audience sync.',
      },
      {
        slug: 'natural-language-query', name: 'Natural Language Query',
        tagline: 'Lets business users ask a question in plain English and get back a governed answer, grounded in the Semantic Layer\'s approved metrics rather than free-form SQL generation.',
        hldCaption: 'Natural Language Query translates English into a semantic-layer request, never raw SQL against the lakehouse.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Semantic Layer', detail: 'The approved metric/dimension vocabulary grounding the model' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Ultimately what the resolved query reads' },
          { label: 'Intelligence', name: 'Natural Language Query', detail: 'Azure OpenAI Service, constrained to Semantic Layer objects', origin: true },
          { label: 'Activation', name: 'AI Copilot', detail: 'The primary interface this capability powers' },
        ],
        business: [
          "Lowers the barrier for business users who don't know SQL or the Semantic Layer's exact metric names to still get a governed, correct answer",
          "Reduces the volume of one-off 'can you pull me a number' requests that land on Analytics Engineering",
          'Owned by Analytics Engineering / Data Science',
        ],
        technical: 'Azure OpenAI Service is used to translate a natural-language question into a structured request against the Semantic Layer\'s registered metrics and dimensions — never into raw SQL against lakehouse tables directly — so the model\'s only job is intent parsing and mapping to an approved vocabulary, not query correctness. The .NET Core Analytics/AI API (a Docker container on Azure Container Apps) validates the resolved metric/dimension combination exists and is entitled to the caller before executing it through the normal Query Optimizer / Caching path.',
        chipsLabel: 'Guardrails', chips: ['Grounded in Semantic Layer only', 'No raw SQL generation', 'Entitlement check before execution', 'Ambiguous questions ask for clarification'],
        artifactTitle: 'NL Query Resolution',
        artifactCode: `"What was APAC revenue last week?"
  -> resolved: metric=net_revenue, dimension={region:"APAC"}, time_grain=week, range=last_week
  -> executed via Query Optimizer (same path as any dashboard query)`,
        integration: [
          'Azure OpenAI Service — natural-language intent parsing',
          'Semantic Layer — the constrained vocabulary the model is grounded in',
          'Query Optimizer / Caching — executes the resolved query the normal way, no special-cased path',
          'AI Copilot — the conversational interface built on top of this capability',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Data Explorer/Kusto (scoring time series) + Azure Database for PostgreSQL',
        ],
        nfr: [
          'Scale: language parsing cost scales with question volume, not data volume, and is bounded by the fixed size of the semantic vocabulary',
          'Latency: intent resolution adds roughly 1-2 seconds ahead of normal query execution latency',
          "Reliability: because the model only ever selects from pre-registered metrics, a hallucinated or malformed query cannot reach the lakehouse — it fails at the resolution step, not silently returning wrong data",
          'Security/Privacy: the resolved query still passes through Access Control per the asking user\'s entitlements — natural language is not a privilege-escalation path',
        ],
        example: "A regional manager types \"how did APAC do last week compared to the week before\" instead of building a dashboard filter. The system resolves it to two semantic-layer queries against net_revenue and returns a governed, cache-eligible answer in seconds — the same number a formal dashboard would show.",
      },
      {
        slug: 'ai-copilot', name: 'AI Copilot',
        tagline: 'The conversational assistant that ties Natural Language Query, Propensity Scores, and Anomaly Detection together into one interface business users actually talk to.',
        hldCaption: 'AI Copilot is the user-facing surface that composes every other AI & Insights capability.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Semantic Layer', detail: 'Grounds every metric the copilot can reference' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Ultimate source of every answer' },
          { label: 'Intelligence', name: 'AI Copilot', detail: 'Azure OpenAI Service orchestrating NLQ, Propensity, Anomaly Detection', origin: true },
          { label: 'Activation', name: 'Business Users', detail: 'Marketing, support, and ops teams querying conversationally' },
        ],
        business: [
          "Consolidates several previously separate capabilities (ask a question, check a customer's risk, see what's anomalous) into one conversational entry point, instead of a business user needing to know which tool does what",
          'Lowers the skill floor for getting value from the Intelligence &amp; Services layer without engineering support',
          'Owned by Data Science / Analytics Engineering',
        ],
        technical: 'The AI Copilot is a .NET Core service (Docker container on Azure Container Apps) that orchestrates calls across Natural Language Query, Propensity Scores, and Anomaly Detection behind Azure OpenAI Service\'s function-calling, letting a user ask "which customers are at risk of churning in APAC" and have the copilot resolve it into a semantic query plus a propensity-score filter, rather than requiring the user to know both capabilities exist separately. Conversation state and function-call history are stored in Azure Database for PostgreSQL for session continuity.',
        chipsLabel: 'Composed Capabilities', chips: ['Natural Language Query', 'Propensity Scores', 'Anomaly Detection', 'Semantic Layer metric lookup'],
        artifactTitle: 'Copilot Function-Call Trace',
        artifactCode: `User: "Which APAC customers are at risk of churning?"
-> function_call: propensity_scores.filter(region=APAC, churn_risk>0.7)
-> function_call: profile_api.batch_lookup(customer_keys)
-> response: "14 customers, avg LTV band gold. Top 3: ..."`,
        integration: [
          'Azure OpenAI Service — conversation and function-calling orchestration',
          'Natural Language Query, Propensity Scores, Anomaly Detection — the capabilities the copilot composes',
          'Profile API — resolves customer_keys returned by other capabilities into readable profile summaries',
          'Application Insights — traces the full function-call chain per conversation for debugging and cost tracking',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Intelligence.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Data Explorer/Kusto (scoring time series) + Azure Database for PostgreSQL',
        ],
        nfr: [
          'Scale: conversation volume scales with active business users, a much smaller number than raw event volume',
          'Latency: a multi-function-call question typically resolves in 3-5 seconds end to end',
          'Reliability: each composed function call is independently validated and entitlement-checked, so a partial failure (e.g., propensity service down) degrades to a clear error rather than a fabricated answer',
          "Security/Privacy: the copilot inherits the asking user's own entitlements for every underlying call — it has no elevated access of its own",
        ],
        example: 'A support team lead asks the copilot which of their assigned accounts are at high churn risk and gets a ranked list with LTV context in one conversational turn — a query that previously required pulling a propensity export and cross-referencing it against a CRM view manually.',
      },
    ],
  },
  {
    anchor: 'operational-services', name: 'Operational Services',
    items: [
      {
        slug: 'workflow-engine', name: 'Workflow Engine',
        tagline: 'Orchestrates multi-step operational processes — approval flows, escalations, scheduled jobs — across Intelligence & Services and beyond, distinct from real-time customer journeys.',
        hldCaption: 'Workflow Engine coordinates internal operational steps, not customer-facing journeys.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Batch job completions can trigger workflows' },
          { label: 'Foundation', name: 'Unified Data Foundation', detail: 'Lifecycle Management jobs run under this engine' },
          { label: 'Intelligence', name: 'Workflow Engine', detail: 'Azure Service Bus-orchestrated .NET Core state machine', origin: true },
          { label: 'Activation', name: 'Alerts &amp; Notifications', detail: 'Workflow state changes trigger notifications' },
        ],
        business: [
          "Gives operational processes — a schema-governance approval, an anomaly escalation, a scheduled retention job — a consistent, auditable state machine instead of ad hoc scripts and tribal knowledge",
          'Makes it possible to answer "where is this approval stuck" without asking the one engineer who remembers',
          'Owned by Platform Engineering',
        ],
        technical: 'The Workflow Engine is a .NET Core state-machine service (Docker container on Azure Container Apps) that models each operational process as a sequence of steps with defined transitions, using Azure Service Bus topics to advance state on completion of an async step (a job finishing, an approver responding) rather than polling. It is the same orchestration layer scheduled Governance &amp; Security jobs (Lifecycle Management, deletion requests) and Data Quality Monitoring escalations run under, giving every operational process the same visibility model.',
        chipsLabel: 'Workflow Types', chips: ['Schema-change approval', 'Data-quality escalation', 'Anomaly investigation', 'Scheduled compliance job'],
        artifactTitle: 'Workflow State',
        artifactCode: `{
  "workflow_id": "wf_88213",
  "type": "schema_change_approval",
  "state": "pending_approver",
  "steps_completed": ["submitted", "governance_review"],
  "next_step": "data_owner_approval"
}`,
        integration: [
          'Azure Service Bus — topic/queue backbone advancing workflow state',
          'Lifecycle Management, Event Schema &amp; Registry — operational jobs orchestrated through this engine',
          'Alerts &amp; Notifications — subscribes to workflow state-change events',
          'Application Insights — traces each workflow\'s step-by-step execution',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Operations.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL + Azure Cosmos DB Table API + Azure Data Explorer',
        ],
        nfr: [
          'Scale: workflow volume is operational (dozens to hundreds concurrently), several orders of magnitude below customer event volume',
          'Latency: state transitions occur within seconds of the triggering event via Service Bus, not on a polling delay',
          'Reliability: workflow state is persisted at every transition, so a service restart resumes in-flight workflows rather than losing them',
          'Security/Privacy: workflow definitions and history are internal-operational data, access-controlled by role rather than customer-data classification',
        ],
        example: 'A proposed breaking schema change is submitted for approval. The Workflow Engine routes it through governance review and data-owner sign-off, and anyone can check its exact state at any time — replacing what used to be a Slack thread nobody could reliably locate two weeks later.',
      },
      {
        slug: 'alerts-notifications', name: 'Alerts &amp; Notifications',
        tagline: 'The routing layer that turns an anomaly, a workflow state change, or a data-quality failure into a notification the right person or team actually sees.',
        hldCaption: 'Alerts & Notifications is the last-mile delivery for every operational signal generated elsewhere in the platform.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Anomaly Detection', detail: 'A primary upstream signal source' },
          { label: 'Foundation', name: 'Data Quality Monitoring', detail: 'Another primary upstream signal source' },
          { label: 'Intelligence', name: 'Alerts &amp; Notifications', detail: '.NET Core routing service over Azure Service Bus', origin: true },
          { label: 'Activation', name: 'Email, Slack, PagerDuty', detail: 'Delivery channels for the owning team' },
        ],
        business: [
          'A detected anomaly or data-quality issue has no value if it sits in a table nobody looks at — this is what makes signals actionable',
          'Reduces mean-time-to-detect and mean-time-to-resolve by routing directly to the owning team rather than a shared, ignorable channel',
          'Owned by Platform Engineering / SRE',
        ],
        technical: 'A .NET Core routing service (Docker container on Azure Container Apps) subscribes to Azure Service Bus topics published by Anomaly Detection, Data Quality Monitoring, and the Workflow Engine, matches each event against ownership metadata from the Catalog to determine the responsible team, and fans out to the configured channel (email via SendGrid, Slack webhook, or PagerDuty for severity-critical alerts) with configurable per-team severity thresholds to avoid alert fatigue.',
        chipsLabel: 'Delivery Channels', chips: ['Email (SendGrid)', 'Slack webhook', 'PagerDuty (critical severity)', 'In-app notification'],
        artifactTitle: 'Alert Routing Rule',
        artifactCode: `{
  "source": "anomaly_detection",
  "severity_threshold": "high",
  "owner_team": "platform-engineering",
  "channels": ["slack", "pagerduty"],
  "dedup_window_minutes": 30
}`,
        integration: [
          'Azure Service Bus — the event backbone alerts are published and consumed through',
          'Anomaly Detection, Data Quality Monitoring, Workflow Engine — primary upstream signal sources',
          'Catalog (Metadata Layer) — owner metadata used to route an alert to the correct team',
          'SendGrid, Slack, PagerDuty — external delivery integrations',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Operations.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL + Azure Cosmos DB Table API + Azure Data Explorer',
        ],
        nfr: [
          'Scale: alert volume is bounded by monitored-metric and workflow count, not raw event volume',
          'Latency: alerts are delivered within seconds to minutes of the triggering condition, well inside the mean-time-to-detect targets this system exists to hit',
          'Reliability: a deduplication window prevents the same underlying issue from paging a team repeatedly within a short window',
          'Security/Privacy: alert payloads summarize the issue (metric name, severity) rather than embedding raw customer data, keeping notification channels low-sensitivity',
        ],
        example: 'A critical data-quality failure is detected at 2am. Alerts &amp; Notifications pages the owning team\'s on-call engineer via PagerDuty within a minute, rather than the issue being discovered the next morning when someone happens to check a dashboard.',
      },
      {
        slug: 'data-quality-monitoring', name: 'Data Quality Monitoring',
        tagline: 'Continuously validates row-level and schema-level data quality — nulls, referential integrity, dbt test failures — surfacing issues before they reach a dashboard or model.',
        hldCaption: 'Data Quality Monitoring catches row-level problems; Anomaly Detection catches metric-level ones.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'dbt test', detail: 'Row-level and referential-integrity assertions' },
          { label: 'Foundation', name: 'curated / marts tables', detail: 'Tables validated on every dbt run' },
          { label: 'Intelligence', name: 'Data Quality Monitoring', detail: '.NET Core dashboard over dbt test results', origin: true },
          { label: 'Activation', name: 'Alerts &amp; Notifications', detail: 'Test failures are surfaced as operational alerts' },
        ],
        business: [
          "Catches broken pipelines and bad data at the row level before they propagate into a metric, a model feature, or a customer-facing decision",
          "Gives data owners a scorecard for their tables instead of quality being invisible until someone complains",
          'Owned by Data Engineering, scorecards reviewed per domain team',
        ],
        technical: "Every dbt model in Transformation &amp; Processing carries <code>dbt test</code> assertions (not-null, uniqueness, referential integrity, accepted-value ranges), executed as part of the same scheduled run that materializes the model. A .NET Core service (Docker container on Azure Container Apps) aggregates test results into a per-table quality scorecard and publishes failures to Azure Service Bus for Alerts &amp; Notifications, distinguishing this row/schema-level signal from Anomaly Detection's metric-level scoring.",
        chipsLabel: 'Test Types', chips: ['Not-null', 'Uniqueness', 'Referential integrity', 'Accepted value range', 'Freshness'],
        artifactTitle: 'Quality Scorecard Entry',
        artifactCode: `{
  "table": "curated.identity_stitched_events",
  "tests_run": 24,
  "tests_passed": 23,
  "failure": { "test": "not_null:customer_key", "failed_rows": 142 },
  "run_at": "2026-08-02T03:00:00Z"
}`,
        integration: [
          'dbt test — the assertion framework underlying every check',
          'Rollups &amp; Aggregations / Data Modeling — the scheduled runs quality checks execute alongside',
          'Alerts &amp; Notifications — receives test-failure events for routing',
          'Catalog — quality scorecard is surfaced alongside each table\'s catalog entry',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Operations.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL + Azure Cosmos DB Table API + Azure Data Explorer',
        ],
        nfr: [
          'Scale: test execution overhead scales with model count and test count, tuned to run within the existing batch window',
          'Latency: quality issues are caught within one dbt run cycle of the data landing — typically within the hour for high-frequency models',
          'Reliability: a critical test failure can be configured to block downstream models from running on bad data (dbt\'s failure-propagation), preventing a bad batch from silently cascading',
          'Security/Privacy: quality scorecards report aggregate pass/fail counts, not the offending row-level data itself, in team-visible summaries',
        ],
        example: 'A connector starts sending customer_key as null for 5% of a table\'s new rows after an upstream change. The not-null test fails on the next dbt run, the model is blocked from feeding downstream marts, and the owning team is paged — instead of a silently degraded profile match rate being discovered weeks later.',
      },
      {
        slug: 'usage-billing', name: 'Usage &amp; Billing',
        tagline: 'Meters consumption per tenant/team across ingestion volume, query compute, and storage — the basis for internal chargeback or external multi-tenant billing.',
        hldCaption: 'Usage & Billing turns platform consumption into an attributable, auditable number.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'Event volume metered per tenant here' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Batch/stream compute metered per job' },
          { label: 'Foundation', name: 'Unified Data Foundation', detail: 'Storage consumption metered per zone/tenant' },
          { label: 'Intelligence', name: 'Usage &amp; Billing', detail: '.NET Core metering service, Azure DB for PostgreSQL ledger', origin: true },
          { label: 'Activation', name: 'Chargeback Reports, Billing API', detail: 'Consumed by finance and tenant admin tooling' },
        ],
        business: [
          'Makes platform cost attributable per team or tenant, enabling internal chargeback instead of a single unattributed infrastructure line item',
          'Is the metering foundation required before the platform could support external, multi-tenant billing',
          'Owned by Platform Engineering / Finance',
        ],
        technical: 'A .NET Core metering service (Docker container on AKS) aggregates consumption signals emitted across the stack — event volume tagged per tenant at the Ingestion API, query compute time from the Query Optimizer, and storage bytes per zone from Azure Data Lake Storage Gen2 — into a usage ledger in Azure Database for PostgreSQL, rolled up nightly via a dbt model into <code>marts.tenant_usage</code>. A billing API exposes current-period usage and historical invoices to tenant-admin tooling and finance systems.',
        chipsLabel: 'Metered Dimensions', chips: ['Ingestion event volume', 'Query compute time', 'Storage bytes by zone', 'API request count'],
        artifactTitle: 'Usage Ledger Entry',
        artifactCode: `{
  "tenant_id": "tenant_northwind",
  "period": "2026-07",
  "ingestion_events": 812_400_000,
  "query_compute_minutes": 4210,
  "storage_gb": 18_400,
  "estimated_cost_usd": 6240.18
}`,
        integration: [
          'Ingestion API — tags event volume per tenant at the point of ingestion',
          'Query Optimizer — reports compute time per query for attribution',
          'Azure Data Lake Storage Gen2 — source of per-zone, per-tenant storage bytes',
          'Reverse ETL / CDP Sync — can push usage summaries into a finance system\'s native workflow',
        ],
        servicesConsumed: [
          'Owning microservice &mdash; <code>Cxos.Operations.Api</code> (see the <a href="../../index.html#service-map">Full Application Service Map</a>)',
          'Database &mdash; Azure Database for PostgreSQL + Azure Cosmos DB Table API + Azure Data Explorer',
        ],
        nfr: [
          'Scale: metering aggregation runs as a nightly rollup, decoupled from real-time request paths so it never adds latency to ingestion or query traffic',
          'Latency: usage figures are current as of the prior night\'s rollup; near-real-time usage is available at reduced precision from live counters for the current period',
          'Reliability: the usage ledger is append-only and reconciled against raw metering events monthly, since billing figures must be auditable and disputable',
          'Security/Privacy: usage records contain consumption metadata, not customer data, and are scoped so one tenant can never see another tenant\'s usage',
        ],
        example: 'Finance needs to allocate platform infrastructure cost across five internal business units. Usage &amp; Billing\'s monthly ledger gives an auditable, per-unit breakdown of ingestion, compute, and storage consumption — replacing a rough headcount-based cost allocation that several teams disputed as unfair.',
      },
    ],
  },
];

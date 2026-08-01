module.exports = [
  {
    anchor: 'client-sdks', name: 'Client SDKs',
    items: [
      {
        slug: 'web-sdk', name: 'Web SDK',
        tagline: 'The client library (TypeScript) that instruments web storefronts and apps, wrapping the shared ingestion contract so every event agrees with the rest of the platform.',
        hldCaption: 'Web SDK is the entry point for every browser-originated event.',
        hld: [
          { label: 'Data Source', name: 'Web / Mobile App', detail: 'Browser calling Cxos.track()' },
          { label: 'Ingestion', name: 'Web SDK (npm: @cxos/web-sdk)', detail: "TypeScript wrapper around Cxos.Ingestion.Client", origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: 'Azure API Management &rarr; validation &rarr; Azure Event Hubs' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Raw event zone (Azure Data Lake Storage Gen2)' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Funnel &amp; session analysis' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Real-time on-site personalization' },
        ],
        business: [
          'Usually the very first integration in any CXOS rollout — the fastest path to real behavioral data',
          'Auto-captures page views so teams get value before writing a single custom tracking call',
          'Owned by the Digital / Web Engineering team; changes here affect every page on the site',
        ],
        technical: "The Web SDK is a thin TypeScript wrapper generated from the same OpenAPI contract published in the <code>Cxos.Ingestion.Client</code> NuGet package, so the browser and the .NET Core Ingestion API never drift on event shape. It auto-instruments page views, assigns and persists an anonymous ID (first-party cookie or localStorage), batches events client-side, and posts them to Azure API Management over HTTPS. A single <code>track()</code> call handles custom events.",
        chipsLabel: 'Auto-Captured', chips: ['page_view', 'session_start', 'utm_parameters', 'referrer'],
        artifactTitle: 'SDK Initialization',
        artifactCode: `import { Cxos } from '@cxos/web-sdk';

Cxos.init({
  writeKey: 'wk_live_9f21ac',
  endpoint: 'https://ingest.cxos.example.com',
  consentRequired: true,
});

Cxos.track('product_viewed', {
  product_id: 'sku-1029',
  price: 2499,
});`,
        integration: [
          'npm package <code>@cxos/web-sdk</code>, generated from the same contract as <code>Cxos.Ingestion.Client</code>',
          'Azure API Management — HTTPS ingress, auth, throttling',
          'Consent Management Platform hook — gates SDK initialization until consent is granted',
          'Ingestion API (ASP.NET Core on AKS) — validates and publishes to Azure Event Hubs',
        ],
        nfr: [
          'Scale: client-side batching (configurable flush interval/size) reduces request volume during high-traffic pages',
          'Latency: events are queued in-memory and flushed asynchronously so tracking never blocks page rendering',
          'Reliability: failed sends are retried with exponential backoff; unsent events persist to localStorage across page reloads',
          'Security/Privacy: no PII is captured automatically; consentRequired blocks all network calls until the CMP signals consent',
        ],
        example: "A retailer adds three lines of Web SDK initialization to their Angular app's root module. Within a day, page views and product views are flowing into CXOS — before any custom event has been written — giving the analytics team a baseline funnel view immediately.",
      },
      {
        slug: 'mobile-sdk', name: 'Mobile SDK',
        tagline: 'Native iOS (Swift) and Android (Kotlin) client libraries, plus a React Native/Flutter wrapper, sharing the same event contract as the Web SDK.',
        hldCaption: 'Mobile SDK carries the same contract into native app environments.',
        hld: [
          { label: 'Data Source', name: 'Mobile App', detail: 'iOS/Android app calling Cxos.track()' },
          { label: 'Ingestion', name: 'Mobile SDK (Swift / Kotlin)', detail: 'Offline-queued wrapper around Cxos.Ingestion.Client', origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: 'Azure API Management &rarr; validation &rarr; Azure Event Hubs' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Raw event zone (Azure Data Lake Storage Gen2)' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Engagement &amp; retention analysis' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Push notification targeting' },
        ],
        business: [
          'Mobile is often the highest-engagement, highest-LTV channel for app-first businesses — instrumenting it well is a direct revenue lever',
          'Push-notification and in-app personalization use cases depend entirely on Mobile SDK data being complete and timely',
          'Owned by Mobile Engineering; requires app-store release cycles to update, unlike the Web SDK',
        ],
        technical: 'The Mobile SDK ships as native Swift (iOS) and Kotlin (Android) packages, with React Native and Flutter wrappers on top, all generated from the same contract as <code>Cxos.Ingestion.Client</code>. It auto-instruments screen views and app lifecycle events, persists an offline event queue (SQLite) for connectivity gaps, and syncs to Azure API Management when the device is online. Push token registration is a first-class event so the Activation API can target the device directly.',
        chipsLabel: 'Auto-Captured', chips: ['app_opened', 'screen_view', 'app_backgrounded', 'push_token_registered'],
        artifactTitle: 'SDK Initialization (Swift)',
        artifactCode: `import CxosSDK

Cxos.initialize(
  writeKey: "wk_live_9f21ac",
  consentRequired: true
)

Cxos.track("product_viewed", properties: [
  "product_id": "sku-1029",
  "price": 2499
])`,
        integration: [
          'Native Swift / Kotlin packages + React Native / Flutter wrappers',
          'Local SQLite-backed offline event queue with a Polly-equivalent retry policy on sync',
          'Azure API Management — HTTPS ingress once connectivity is available',
          "Push notification token registration feeding the Activation API's real-time channel",
        ],
        nfr: [
          'Scale: batched sync reduces battery/network impact on the device',
          'Latency: online devices sync within seconds; offline devices flush on reconnect',
          'Reliability: offline queue survives app kills/restarts; bounded size with oldest-event eviction to avoid unbounded growth',
          'Security/Privacy: consent state is checked before the SDK initializes any tracking, including crash/performance telemetry',
        ],
        example: "A travel app instruments the Mobile SDK across its booking flow. When a user abandons a booking mid-flow while offline (e.g., in-flight), the event queues locally and syncs on landing — letting the Activation API trigger a timely 'complete your booking' push notification instead of losing the signal entirely.",
      },
      {
        slug: 'server-sdk', name: 'Server SDK',
        tagline: 'The server-side (.NET, Node, Python, Java) library for emitting events from backend systems — IoT gateways, kiosks, batch jobs, and internal services.',
        hldCaption: 'Server SDK is the direct binding used by every backend integration in this handbook.',
        hld: [
          { label: 'Data Source', name: 'Backend Service', detail: 'Payment, fulfillment, IoT gateway, batch job' },
          { label: 'Ingestion', name: 'Server SDK (Cxos.Ingestion.Client)', detail: 'Direct .NET binding / generated Node, Python, Java clients', origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: 'Azure API Management &rarr; Azure Event Hubs' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Raw event zone (Azure Data Lake Storage Gen2)' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Server-confirmed event analysis' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Downstream automation triggers' },
        ],
        business: [
          "Server-side tracking is more trustworthy than client-side — it can't be blocked by an ad blocker or browser privacy setting",
          'Used for any event that originates or is confirmed server-side: payments, fulfillment, IoT telemetry, kiosk sessions',
          'Owned by Backend / Platform Engineering, used by every team building a server-side integration',
        ],
        technical: 'The .NET Server SDK is literally the <code>Cxos.Ingestion.Client</code> NuGet package itself — no separate wrapper needed. Non-.NET languages (Node.js, Python, Java) get thin clients generated from the same OpenAPI contract via an internal codegen pipeline, keeping every language binding schema-identical. Server SDK calls skip client-side consent gating (assumed already applied by the calling service) but still carry a required <code>consent_basis</code> field in the contract.',
        chipsLabel: 'Common Callers', chips: ['IoT gateways', 'Kiosk clients', 'Batch/ETL jobs', 'Internal backend services'],
        artifactTitle: 'Server SDK Call (.NET Core)',
        artifactCode: `services.AddCxosIngestionClient(options =>
{
    options.Endpoint = "https://ingest.cxos.example.com";
    options.ApiKey = configuration["Cxos:ApiKey"];
});

await _cxosClient.TrackAsync(new CxosEvent
{
    Event = "payment_processed",
    UserId = "cust_004821",
    Properties = new { orderId = "ord_55123", amount = 3499 }
});`,
        integration: [
          'Cxos.Ingestion.Client NuGet package (native .NET binding)',
          'Generated Node.js / Python / Java clients from the shared OpenAPI contract',
          'Azure API Management — server-to-server auth via API key or Azure AD managed identity',
          'Used directly by every other connector/gateway described elsewhere in this handbook (IoT, Kiosk, batch connectors)',
        ],
        nfr: [
          "Scale: server-side callers can emit at much higher throughput than client SDKs — the Ingestion API applies per-caller rate limits",
          'Latency: typically sub-100ms for a synchronous call to Azure API Management within the same Azure region',
          'Reliability: built-in Polly retry policy with circuit breaker to avoid cascading failure if the Ingestion API is degraded',
          'Security/Privacy: server callers authenticate via Azure AD managed identity where possible, avoiding long-lived API keys',
        ],
        example: "The payment service calls the Server SDK synchronously the moment a payment is confirmed, guaranteeing the payment_processed event lands before the order confirmation page renders — a stronger reliability guarantee than waiting for a client-side event that might never fire if the user closes the tab.",
      },
    ],
  },
  {
    anchor: 'edge-network', name: 'Edge Network',
    items: [
      {
        slug: 'event-collection', name: 'Event Collection',
        tagline: 'The front door of the platform — the endpoint that receives every event from every SDK, connector, and webhook before anything else happens to it.',
        hldCaption: 'Event Collection is the acknowledgment boundary between callers and the platform.',
        hld: [
          { label: 'Data Source', name: 'All Sources', detail: 'Every SDK, connector, and webhook' },
          { label: 'Ingestion', name: 'Event Collection Endpoint', detail: 'Azure API Management &rarr; .NET Core Ingestion API', origin: true },
          { label: 'Processing', name: 'Validation &amp; Enrichment', detail: 'Next steps in the same Ingestion API pipeline' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Every acknowledged event eventually lands here' },
          { label: 'Intelligence', name: 'Azure Monitor', detail: 'Collection-tier health &amp; throughput dashboards' },
          { label: 'Activation', name: 'Every Downstream Stage', detail: 'Nothing in the platform proceeds without this step' },
        ],
        business: [
          'Every downstream capability depends on collection being rock-solid — an outage here is an outage for the entire platform',
          'The single place where "did we receive this event at all" can be answered, which matters for data-completeness audits',
          'Owned by Platform Engineering; treated as a tier-1 production service',
        ],
        technical: 'Event Collection is the ASP.NET Core Web API endpoint fronted by Azure API Management. It accepts events over HTTPS (SDKs), gRPC (high-throughput server callers), and via the webhook receivers described elsewhere. Every request is authenticated, given a receipt timestamp and a server-assigned <code>event_id</code> if the caller didn\'t supply one, and acknowledged with a 202 Accepted before any validation or enrichment happens — collection is deliberately decoupled from processing so a downstream slowdown never blocks intake.',
        chipsLabel: 'Supported Transports', chips: ['HTTPS (SDKs)', 'gRPC (server callers)', 'Webhooks', 'Batch upload'],
        artifactTitle: 'Collection Acknowledgment',
        artifactCode: `HTTP/1.1 202 Accepted
{
  "event_id": "9f2c1e6a-2b41-4e9d-8f3a-1c7d9a0b6e2f",
  "received_at": "2026-08-01T10:22:14.203Z",
  "status": "queued"
}`,
        integration: [
          'Azure API Management — ingress, auth, throttling for all transports',
          'NET Core Ingestion API on AKS — the collection endpoint itself',
          'Azure Event Hubs — immediate hand-off after acknowledgment',
          'Azure Monitor — collection-tier health and throughput dashboards',
        ],
        nfr: [
          'Scale: AKS horizontal pod autoscaling keeps collection latency flat under load; acknowledgment happens before any heavy processing',
          'Latency: target is sub-100ms acknowledgment at the 99th percentile',
          'Reliability: collection is stateless and horizontally scaled — any pod can handle any request',
          'Security/Privacy: authentication happens before any payload parsing to avoid processing unauthenticated traffic',
        ],
        example: 'During a product launch, event volume spikes 15x. Because collection only authenticates and hands off to Azure Event Hubs — without waiting for downstream processing — acknowledgment latency stays flat even while the Stream Worker queue temporarily backs up, so no client-side SDK ever times out or drops events.',
      },
      {
        slug: 'validation', name: 'Validation',
        tagline: 'The schema and contract check every event passes through immediately after collection, before it can affect any downstream system.',
        hldCaption: 'Validation is the quality gate between collection and everything else.',
        hld: [
          { label: 'Data Source', name: 'Event Collection', detail: 'Hands off the raw, authenticated event' },
          { label: 'Ingestion', name: 'Validation Layer', detail: 'Schema check against the Cxos.Ingestion.Client contract', origin: true },
          { label: 'Processing', name: 'Enrichment', detail: 'Runs next on events that pass validation' },
          { label: 'Foundation', name: 'Dead-letter Topic', detail: 'Quarantine for failed events' },
          { label: 'Intelligence', name: 'Event Schema &amp; Registry', detail: 'Source of the enforced schema' },
          { label: 'Activation', name: 'Azure Monitor Alert', detail: "Notifies the owning team of failure spikes" },
        ],
        business: [
          'Bad data caught at the door is cheap; bad data caught in a dashboard three hops downstream is expensive and erodes trust in the platform',
          "Protects every team's reports and models from a single misbehaving integration",
          'Owned by Platform Engineering, with schema ownership shared with each domain team via the Event Schema & Registry',
        ],
        technical: 'Validation checks every event against the JSON Schema published alongside the <code>Cxos.Ingestion.Client</code> contract: required fields, type correctness, and enum constraints (e.g., a known <code>channel</code> value). Events that fail validation are not silently dropped — they\'re routed to a dead-letter Event Hubs topic with the validation error attached, so the sending team can see exactly what failed and why.',
        chipsLabel: 'Checks Performed', chips: ['Required fields', 'Type correctness', 'Enum/allowed values', 'Schema version compatibility'],
        artifactTitle: 'Validation Failure Record',
        artifactCode: `{
  "event_id": "9f2c1e6a-...",
  "status": "validation_failed",
  "errors": [
    { "field": "properties.price", "issue": "expected number, got string" }
  ],
  "raw_payload_ref": "deadletter/2026-08-01/9f2c1e6a.json"
}`,
        integration: [
          'JSON Schema derived from the Cxos.Ingestion.Client contract (single source of truth)',
          'Dead-letter Azure Event Hubs topic — quarantines failed events with error context',
          'Event Schema & Registry — schema versioning and compatibility rules',
          "Azure Monitor alert — notifies the owning team when their integration's failure rate spikes",
        ],
        nfr: [
          'Scale: validation is a stateless, in-memory check — negligible latency overhead per event',
          'Latency: adds low-single-digit milliseconds to the collection-to-acknowledgment path',
          'Reliability: a schema registry outage fails open to the last-known-good schema version rather than blocking all ingestion',
          'Security/Privacy: validation also enforces that no unexpected fields smuggle unclassified data past the contract boundary',
        ],
        example: 'A newly deployed version of the Mobile SDK accidentally sends price as a string instead of a number. Validation catches every affected event at the door, routes them to the dead-letter topic, and fires an alert to Mobile Engineering within minutes — instead of corrupting weeks of revenue reporting before anyone notices.',
      },
      {
        slug: 'enrichment', name: 'Enrichment (Geo, Device, IP)',
        tagline: "Adds context an event didn't arrive with — location, device details, and network information — before it's stored.",
        hldCaption: 'Enrichment adds consistent context so no downstream team reimplements it.',
        hld: [
          { label: 'Data Source', name: 'Validation', detail: 'Hands off a schema-valid event' },
          { label: 'Ingestion', name: 'Enrichment Service', detail: 'Geo/device/IP lookups via Azure Cache for Redis', origin: true },
          { label: 'Processing', name: 'Consent Enforcement', detail: 'Runs next in the edge pipeline' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Enriched context is persisted with the event' },
          { label: 'Intelligence', name: 'Identity &amp; Profile Service', detail: 'Consumes enriched device/geo fields' },
          { label: 'Activation', name: 'Personalization Use Cases', detail: 'Geo/device-aware activation logic' },
        ],
        business: [
          '"Users in Mumbai on iOS" style personalization and analytics constantly need geo/device context that raw events rarely include on their own',
          'Doing enrichment once, centrally, means every downstream team gets consistent geo/device fields instead of reimplementing their own lookup',
          'Owned by Platform Engineering',
        ],
        technical: 'Enrichment runs as a .NET Core middleware step in the Ingestion API pipeline: IP address resolves to geo (country/city) via a MaxMind-style lookup service cached in Azure Cache for Redis; device/browser fields are parsed from the User-Agent header (client-supplied device fields on mobile are trusted directly); and the raw IP is then discarded rather than persisted, keeping the stored event privacy-minimized while still geo-enriched.',
        chipsLabel: 'Fields Added', chips: ['geo.country', 'geo.city', 'device.type', 'device.os', 'device.browser'],
        artifactTitle: 'Enriched Context Block',
        artifactCode: `"context": {
  "geo": { "country": "IN", "city": "Pune" },
  "device": { "type": "mobile", "os": "iOS 18", "browser": null }
}`,
        integration: [
          'Azure Cache for Redis — cached IP-to-geo lookup table for low-latency enrichment',
          'NET Core Ingestion API middleware — enrichment runs inline before publishing to Event Hubs',
          'User-Agent parsing library — device/browser classification',
          "Identity & Profile Service — enriched geo/device fields feed the unified profile's device graph",
        ],
        nfr: [
          'Scale: enrichment lookups are cache-backed to keep per-event latency low even at high throughput',
          'Latency: adds low-single-digit milliseconds via the Redis cache; a cache miss falls back to a slower lookup without blocking the request',
          'Reliability: enrichment failures never block ingestion — an event proceeds with partial context rather than being rejected',
          'Security/Privacy: raw IP addresses are discarded immediately after geo resolution — only the derived country/city is persisted',
        ],
        example: "A retailer's Analytics API can answer 'which cities are driving mobile conversion this week' without any team having written custom geo-lookup code — every event already arrived enriched, consistently, from day one.",
      },
      {
        slug: 'consent-enforcement', name: 'Consent Enforcement',
        tagline: "Checks the caller's consent state before an event is allowed to proceed — the platform's compliance gate.",
        hldCaption: 'Consent Enforcement is the control point that makes downstream compliance possible.',
        hld: [
          { label: 'Data Source', name: 'Enrichment', detail: 'Hands off a geo/device-enriched event' },
          { label: 'Ingestion', name: 'Consent Enforcement', detail: 'Policy check against consent_basis', origin: true },
          { label: 'Processing', name: 'Queue &amp; Retry', detail: 'Consented events proceed to Azure Event Hubs' },
          { label: 'Foundation', name: 'Governance &amp; Security', detail: 'Policy table — source of truth' },
          { label: 'Intelligence', name: 'Audit Logs', detail: 'Every consent decision is logged' },
          { label: 'Activation', name: 'Compliant Downstream Processing', detail: 'Only consented events reach analytics/marketing' },
        ],
        business: [
          'Getting consent wrong is a direct legal/regulatory exposure (GDPR, CCPA, DPDP) — this is the control point that prevents that',
          'Lets every downstream team build without re-implementing consent logic themselves',
          'Owned jointly by Platform Engineering and Legal/Privacy',
        ],
        technical: 'Every event carries a <code>consent_basis</code> field (set by the SDK from the Consent Management Platform\'s current state, or explicitly by server callers). The Ingestion API checks this against the event\'s declared purpose (analytics, personalization, marketing) using a policy table maintained by the Governance & Security layer. Events without a valid consent basis for their purpose are either dropped or routed to a restricted-processing path, depending on policy — never silently stored as if consented.',
        chipsLabel: 'Consent Purposes', chips: ['analytics', 'personalization', 'marketing', 'essential'],
        artifactTitle: 'Consent Policy Check',
        artifactCode: `{
  "event_id": "9f2c1e6a-...",
  "consent_basis": { "analytics": true, "marketing": false },
  "purpose_requested": "marketing",
  "decision": "blocked",
  "policy_ref": "gdpr-eu-v2"
}`,
        integration: [
          'Consent Management Platform (client-side) — supplies real-time consent state to the SDKs',
          'Governance & Security policy table — the source of truth for purpose-vs-consent rules',
          'NET Core Ingestion API — enforcement point, before Event Hubs publish',
          'Audit Logs (Governance & Security) — every consent decision is logged for compliance review',
        ],
        nfr: [
          'Scale: policy lookups are cached per consent-basis combination to avoid a database round-trip per event',
          'Latency: consent check adds negligible latency — it\'s a policy-table lookup, not an external call',
          'Reliability: on policy-service unavailability, the system fails closed for marketing/personalization and open for essential/legal-basis events',
          'Security/Privacy: this is itself a compliance control — its own audit trail is retained longer than standard event data',
        ],
        example: 'A customer withdraws marketing consent through the preference center. The very next event they generate is checked against the updated consent basis and blocked from any marketing-purpose processing — with no code change needed in any of the dozens of downstream services that might otherwise have used it.',
      },
      {
        slug: 'queue-retry', name: 'Queue &amp; Retry',
        tagline: 'Absorbs bursts and outages between the edge and downstream processing, so a slow or failing consumer never becomes data loss.',
        hldCaption: 'Queue & Retry is the buffer that decouples ingestion from every consumer.',
        hld: [
          { label: 'Data Source', name: 'Consent Enforcement', detail: 'Hands off a policy-cleared event' },
          { label: 'Ingestion', name: 'Queue &amp; Retry', detail: 'Azure Event Hubs buffering + Polly retries', origin: true },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'Primary consumer, reading from the buffer' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Ultimate durable destination' },
          { label: 'Intelligence', name: 'Consumer Offset Tracking', detail: 'Safe backlog catch-up after an outage' },
          { label: 'Activation', name: 'Zero Data-Loss Guarantee', detail: "What makes the platform's reliability SLA possible" },
        ],
        business: [
          "Guarantees that a downstream incident (a bad deploy, a database outage) doesn't translate into lost customer data",
          'Removes the pressure to over-provision every downstream service for worst-case traffic, since the queue absorbs the spike',
          "Owned by Platform Engineering; its throughput/retention settings are a direct input to the platform's data-loss SLA",
        ],
        technical: 'Once an event passes validation and enrichment, it\'s published to Azure Event Hubs, which retains events for a configurable window (default 7 days) independent of consumer health. Consumers (the Stream Worker, batch jobs) track their own read offset, so a consumer outage simply means a backlog to catch up on, not lost data. Client-side (Web/Mobile SDK) and server-side (<code>Cxos.Ingestion.Client</code>) callers additionally retry failed sends with exponential backoff via Polly before an event is ever considered lost.',
        chipsLabel: 'Retry Layers', chips: ['Client-side SDK retry', 'Server SDK Polly policy', 'Event Hubs retention buffer', 'Dead-letter fallback'],
        artifactTitle: 'Retry Policy Configuration',
        artifactCode: `services.AddHttpClient<CxosIngestionClient>()
  .AddPolicyHandler(Policy
    .Handle<HttpRequestException>()
    .WaitAndRetryAsync(5, attempt =>
       TimeSpan.FromSeconds(Math.Pow(2, attempt))));`,
        integration: [
          'Azure Event Hubs — the durable buffer between ingestion and every consumer',
          'Polly retry/circuit-breaker policies — built into Cxos.Ingestion.Client',
          'Consumer offset tracking (Stream Worker, batch jobs) — enables safe backlog catch-up',
          'Dead-letter topic — final fallback for events that exhaust retries',
        ],
        nfr: [
          'Scale: Event Hubs throughput units scale independently of consumer capacity, so ingestion never has to slow down to match a slower downstream stage',
          'Latency: under normal conditions, queue dwell time is milliseconds; during an incident it becomes backlog depth, not data loss',
          "Reliability: this is the mechanism that makes the rest of the platform's reliability claims possible",
          'Security/Privacy: queued events remain subject to the same encryption-at-rest and access policies as stored data, not a lower-security holding area',
        ],
        example: 'A bad deploy takes the Stream Worker offline for 40 minutes. Because Event Hubs retains events for 7 days, there is zero data loss — the worker resumes from its last committed offset and catches up on the backlog within 10 minutes of redeployment, with no customer-visible impact beyond a short delay in real-time personalization.',
      },
    ],
  },
  {
    anchor: 'streaming-ingestion', name: 'Streaming Ingestion',
    items: [
      {
        slug: 'redpanda', name: 'Redpanda (Kafka Compatible)',
        tagline: 'The Kafka-API-compatible streaming backbone CXOS uses in place of Apache Kafka itself, chosen for lower operational overhead at equivalent throughput.',
        hldCaption: 'Redpanda is the durable log every ingested event flows through.',
        hld: [
          { label: 'Data Source', name: 'Ingestion API', detail: 'Producer — publishes validated events' },
          { label: 'Ingestion', name: 'Redpanda Cluster', detail: "Kafka-compatible durable log", origin: true },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'Consumer — Confluent.Kafka .NET client' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Where consumed events are ultimately written' },
          { label: 'Intelligence', name: 'Schema Registry', detail: 'Enforces the contract at the broker level' },
          { label: 'Activation', name: 'Every Real-time Consumer', detail: 'The backbone every real-time stage depends on' },
        ],
        business: [
          "The streaming backbone is invisible to business stakeholders when it works, and existential when it doesn't — it's the platform's real-time nervous system",
          'Kafka-API compatibility means the ecosystem of Kafka connectors, client libraries, and tooling all work unmodified',
          'Owned by Platform / Infrastructure Engineering',
        ],
        technical: "Where CXOS is deployed with Redpanda directly (rather than Azure Event Hubs' native Kafka-compatible endpoint), it runs as a managed cluster fronting the same producer/consumer contracts used elsewhere — the .NET Core Ingestion API and Stream Worker use the standard Confluent.Kafka .NET client against Redpanda exactly as they would against Event Hubs, so the rest of the platform's code is broker-agnostic. Topic partitioning follows the event's user_id/anonymous_id to preserve per-customer ordering.",
        chipsLabel: 'Compatibility', chips: ['Kafka producer/consumer API', 'Schema Registry compatible', 'Confluent.Kafka .NET client'],
        artifactTitle: 'Topic Configuration',
        artifactCode: `{
  "topic": "cxos.events.raw",
  "partitions": 24,
  "partition_key": "user_id | anonymous_id",
  "retention_hours": 168,
  "compaction": false
}`,
        integration: [
          "Redpanda cluster (or Azure Event Hubs' Kafka-compatible endpoint, interchangeably)",
          'Confluent.Kafka .NET client — used by the Ingestion API (producer) and Stream Worker (consumer)',
          'Schema Registry — enforces the Cxos.Ingestion.Client contract at the broker level',
          'Azure Monitor — broker-level throughput, consumer lag, and partition-skew dashboards',
        ],
        nfr: [
          'Scale: partition count is sized for peak expected throughput with headroom; partitioning by customer ID keeps load reasonably balanced',
          'Latency: sub-second producer-to-consumer latency under normal load',
          'Reliability: replication factor 3 across availability zones; offset commits are transactional with downstream writes where exactly-once semantics matter',
          'Security/Privacy: mTLS between all producers/consumers and the broker; topic-level ACLs restrict which services can produce or consume which event types',
        ],
        example: "The platform migrates its highest-volume topic from a self-managed Kafka cluster to Redpanda without changing a single line of the Stream Worker's consumer code, since both speak the same Kafka wire protocol — cutting operational overhead while preserving every existing integration.",
      },
    ],
  },
  {
    anchor: 'connectors', name: 'Connectors',
    items: [
      {
        slug: 'pre-built-connectors', name: 'Pre-built Connectors',
        tagline: 'Maintained, ready-to-configure integrations for common SaaS platforms — no custom code required to onboard a new standard source or destination.',
        hldCaption: 'Pre-built connectors turn a multi-week integration into a configuration task.',
        hld: [
          { label: 'Data Source', name: 'SaaS Platform', detail: 'Salesforce, Shopify, Zendesk, HubSpot, etc.' },
          { label: 'Ingestion', name: 'Pre-built Connector Library', detail: 'Cxos.Connectors.* NuGet packages', origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: "Receives the connector's normalized events" },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Source data alongside every other channel' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Blended with behavioral data' },
          { label: 'Activation', name: 'Reverse ETL', detail: 'Writes CXOS insight back to the same platform' },
        ],
        business: [
          'Cuts integration time from weeks of engineering to hours of configuration for the ~80% of sources/destinations that are common SaaS platforms',
          'Centralizes connector maintenance so platform upgrades (e.g., a Salesforce API version bump) happen once, not per-integration',
          'Owned by Platform Engineering; connector roadmap is prioritized by business demand',
        ],
        technical: 'Each pre-built connector is a .NET Core microservice implementing a shared <code>IConnector</code> interface (auth, extract/webhook handling, field mapping, error handling) and calling <code>Cxos.Ingestion.Client</code> for outbound events or the Activation API\'s equivalent for Reverse ETL. Connectors ship as their own NuGet packages (<code>Cxos.Connectors.*</code>) so they can be versioned and deployed independently, and are registered centrally so any team can enable one via configuration rather than a deployment.',
        chipsLabel: 'Example Connectors', chips: ['Salesforce', 'Shopify', 'Zendesk', 'HubSpot', 'SendGrid', 'Twilio'],
        artifactTitle: 'Connector Registration',
        artifactCode: `{
  "connector": "Cxos.Connectors.Salesforce",
  "version": "2.4.0",
  "instance_id": "sfdc_prod",
  "auth": { "type": "oauth2_jwt", "keyvault_ref": "sfdc-prod-cert" },
  "sync_mode": "cdc"
}`,
        integration: [
          'Shared IConnector interface — every pre-built connector implements the same contract',
          'Cxos.Connectors.* NuGet packages — independently versioned per platform',
          'Azure Key Vault — per-instance credential storage',
          'Central connector registry — enables/configures instances without a new deployment',
        ],
        nfr: [
          "Scale: each connector instance runs and scales independently, so one integration's load never affects another's",
          'Latency: varies by connector — webhook-based connectors are near-real-time, polling-based connectors follow their configured interval',
          'Reliability: connector health/failure is monitored centrally, with automatic alerting to the owning team on sustained failure',
          'Security/Privacy: connector credentials are never stored in application config — always Key Vault references resolved at runtime',
        ],
        example: 'A new marketing team wants HubSpot data in CXOS. Instead of a new engineering project, they request the existing HubSpot connector be enabled for their instance, provide OAuth credentials through a secure onboarding flow, and see data flowing within the same day.',
      },
      {
        slug: 'custom-connectors', name: 'Custom Connectors',
        tagline: 'The framework for building a new source or destination integration when no pre-built connector exists, using the same contracts and tooling.',
        hldCaption: 'Custom connectors extend the platform without leaving its standard patterns.',
        hld: [
          { label: 'Data Source', name: 'Any External System', detail: 'Proprietary or long-tail integration' },
          { label: 'Ingestion', name: 'Custom Connector Framework', detail: 'IConnector interface + scaffolding', origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: "Receives the connector's normalized events" },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Source data alongside every other channel' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Blended with behavioral data' },
          { label: 'Activation', name: 'Reverse ETL (optional)', detail: 'Where the integration requires it' },
        ],
        business: [
          "Ensures a one-off or proprietary integration doesn't become a maintenance orphan outside the platform's standard patterns",
          "Lets teams extend the platform to long-tail or internal systems without waiting on the core platform team's roadmap",
          'Owned by whichever team needs the integration, with architectural review from Platform Engineering',
        ],
        technical: 'A custom connector is a .NET Core project scaffolded from an internal template implementing the same <code>IConnector</code> interface as every pre-built connector, referencing <code>Cxos.Ingestion.Client</code> directly for outbound events. The scaffolding includes the standard cross-cutting concerns (Key Vault credential resolution, Polly retry, structured logging, health-check endpoint) so a team only has to implement the source-specific extract/transform logic.',
        chipsLabel: 'Scaffolding Includes', chips: ['IConnector interface', 'Key Vault credential resolution', 'Polly retry policy', 'Health-check endpoint'],
        artifactTitle: 'Custom Connector Skeleton',
        artifactCode: `public class AcmePartnerConnector : IConnector
{
    public async Task SyncAsync(CancellationToken ct)
    {
        var records = await _acmeClient.GetUpdatesAsync(ct);
        foreach (var r in records)
            await _cxosClient.TrackAsync(MapToEvent(r));
    }
}`,
        integration: [
          'IConnector interface + internal scaffolding template',
          'Cxos.Ingestion.Client NuGet package',
          'Azure Key Vault — credential storage, same pattern as pre-built connectors',
          'Platform Engineering architectural review — before a custom connector goes to production',
        ],
        nfr: [
          'Scale: no different from a pre-built connector once built — same deployment and scaling model (Azure Container Apps or AKS)',
          "Latency: determined by the connector author's chosen sync mode (webhook vs. polling)",
          'Reliability: required to implement the same health-check contract as pre-built connectors so it participates in standard platform monitoring',
          'Security/Privacy: subject to the same architectural review as any new integration — credential handling and PII mapping are checked before go-live',
        ],
        example: 'A team needs to integrate a proprietary in-house loyalty system with no equivalent pre-built connector. Using the scaffolding, an engineer ships a working custom connector in two days instead of building ingestion plumbing from scratch — inheriting retry, credential management, and monitoring for free.',
      },
    ],
  },
  {
    anchor: 'protocols-supported', name: 'Protocols Supported',
    items: [
      {
        slug: 'http-https', name: 'HTTP / HTTPS',
        tagline: 'The default, universal protocol for SDK and connector traffic into the Ingestion API.',
        hldCaption: 'HTTP/HTTPS is the default transport for nearly every integration.',
        hld: [
          { label: 'Data Source', name: 'SDKs &amp; Connectors', detail: 'Default transport for nearly everyone' },
          { label: 'Ingestion', name: 'HTTP/HTTPS Endpoint', detail: 'REST ingress via Azure API Management', origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: 'ASP.NET Core Web API' },
          { label: 'Foundation', name: 'Azure Event Hubs', detail: 'Hand-off after acknowledgment' },
          { label: 'Intelligence', name: 'Azure Front Door', detail: 'Global entry + DDoS protection' },
          { label: 'Activation', name: 'Every Integration', detail: 'The universal default path' },
        ],
        business: [
          'The lowest-friction integration path — any system that can make an HTTP call can integrate with CXOS',
          'Universally supported by every client platform (browsers, mobile, servers, IoT gateways)',
          'Owned by Platform Engineering as the default transport',
        ],
        technical: 'The primary ingestion endpoint is a REST API (ASP.NET Core) fronted by Azure API Management, which terminates TLS, enforces HTTPS-only (HTTP requests are redirected/rejected), and applies authentication and per-caller rate limits before requests reach the Ingestion API. Requests use standard JSON bodies matching the Cxos.Ingestion.Client contract.',
        chipsLabel: 'Endpoint Details', chips: ['TLS 1.2+', 'JSON payloads', 'API key or OAuth2 bearer auth', 'Per-caller rate limits'],
        artifactTitle: 'Sample Request',
        artifactCode: `POST /v1/events HTTP/1.1
Host: ingest.cxos.example.com
Authorization: Bearer wk_live_9f21ac
Content-Type: application/json

{ "event": "product_viewed", "user_id": "cust_004821" }`,
        integration: [
          'Azure API Management — TLS termination, auth, rate limiting',
          'NET Core Ingestion API (ASP.NET Core Web API) — the REST endpoint itself',
          'Used by every SDK and most connectors as the default transport',
          'Azure Front Door — global entry point and DDoS protection ahead of API Management',
        ],
        nfr: [
          'Scale: horizontally scaled behind Azure API Management; the default and most battle-tested transport',
          'Latency: typically the lowest-latency option for low-to-moderate throughput callers',
          'Reliability: standard HTTP retry semantics (idempotent event_id) apply',
          'Security/Privacy: HTTPS-only enforced at the gateway; plaintext HTTP is never accepted',
        ],
        example: "Every SDK and most connectors default to HTTP/HTTPS because it requires no special client libraries or network configuration — it's the protocol every engineering team already knows how to call.",
      },
      {
        slug: 'grpc', name: 'gRPC',
        tagline: 'The high-throughput binary protocol used by server-side callers that need lower overhead than JSON-over-HTTP at scale.',
        hldCaption: 'gRPC is the opt-in transport for the platform\'s highest-throughput producers.',
        hld: [
          { label: 'Data Source', name: 'High-Throughput Server Callers', detail: 'IoT gateways, internal services' },
          { label: 'Ingestion', name: 'gRPC Endpoint', detail: 'Protobuf-based streaming ingress', origin: true },
          { label: 'Processing', name: '.NET Core Ingestion API', detail: 'ASP.NET Core gRPC service' },
          { label: 'Foundation', name: 'Azure Event Hubs', detail: 'Hand-off after acknowledgment' },
          { label: 'Intelligence', name: 'Azure Monitor', detail: 'Throughput and consumer-lag dashboards' },
          { label: 'Activation', name: 'IoT Hub Bridge', detail: 'The primary consumer of this transport' },
        ],
        business: [
          'Matters for a small number of very high-volume server-side integrations (IoT gateways, internal event buses) where JSON overhead becomes measurable at scale',
          'Reduces bandwidth and CPU cost for the highest-throughput producers',
          'Owned by Platform Engineering; opt-in, not the default',
        ],
        technical: 'The Ingestion API exposes a gRPC service alongside the REST endpoint, using the same event schema compiled to Protocol Buffers. gRPC\'s binary encoding and HTTP/2 multiplexing reduce per-event overhead and allow a single connection to stream many events, which matters for producers emitting tens of thousands of events per second — most notably the IoT Hub-to-Ingestion-API bridge described under IoT Devices.',
        chipsLabel: 'Used By', chips: ['IoT gateways', 'High-volume internal services', 'Batch import jobs'],
        artifactTitle: 'Protobuf Contract Excerpt',
        artifactCode: `service Ingestion {
  rpc TrackEvent(EventRequest) returns (EventAck);
  rpc TrackEventStream(stream EventRequest) returns (stream EventAck);
}`,
        integration: [
          'gRPC service on the .NET Core Ingestion API (ASP.NET Core gRPC support)',
          'Protocol Buffers schema — compiled from the same source contract as the REST/JSON schema',
          'Used by the IoT Hub bridge and other high-throughput server-side producers',
          'Azure API Management — gRPC-aware routing where supported, or direct AKS ingress for internal callers',
        ],
        nfr: [
          'Scale: streaming RPCs let a single connection carry sustained high-throughput traffic without per-request HTTP overhead',
          'Latency: lower per-event latency than JSON/HTTP at high volume due to binary encoding and connection reuse',
          'Reliability: bidirectional streaming allows the server to signal backpressure to the client directly',
          'Security/Privacy: mTLS between internal callers and the gRPC endpoint; external gRPC access is not exposed publicly',
        ],
        example: 'The IoT Hub bridge switches its highest-volume device fleet from HTTP to gRPC streaming, cutting ingestion-tier CPU usage by roughly a third at the same event volume — meaningful at millions of devices reporting continuously.',
      },
      {
        slug: 'webhooks', name: 'Webhooks',
        tagline: 'The inbound pattern used when an external platform pushes events to CXOS rather than CXOS pulling from it.',
        hldCaption: 'Webhooks are the near-real-time path for every platform-initiated integration.',
        hld: [
          { label: 'Data Source', name: 'Platform Push', detail: 'Shopify, SendGrid, etc. — source-initiated delivery' },
          { label: 'Ingestion', name: 'Webhook Receivers', detail: 'One Azure Function per source platform', origin: true },
          { label: 'Processing', name: 'Cxos.Ingestion.Client', detail: 'Shared contract call into the Ingestion API' },
          { label: 'Foundation', name: 'Azure Event Hubs', detail: 'Hand-off after acknowledgment' },
          { label: 'Intelligence', name: 'Azure API Management', detail: 'Public endpoint exposure &amp; throttling' },
          { label: 'Activation', name: 'Every Webhook-driven Connector', detail: 'The shared pattern across the handbook' },
        ],
        business: [
          'Webhooks are how most SaaS platforms (Shopify, SendGrid, Zendesk) natively notify external systems — supporting them well is table stakes for connector coverage',
          'Near-real-time by nature, since the source platform pushes the moment something happens',
          'Owned by Platform Engineering, with one receiver per connector',
        ],
        technical: 'Each webhook-based connector registers its own Azure Function endpoint (e.g., <code>/webhooks/shopify</code>, <code>/webhooks/sendgrid</code>), independently deployed and scaled. Every receiver follows the same pattern: verify the platform\'s signature (HMAC or equivalent), map the platform-specific payload to the shared event contract, and call <code>Cxos.Ingestion.Client</code> — the same pattern used across every webhook-driven integration described elsewhere in this handbook.',
        chipsLabel: 'Common Sources', chips: ['Shopify', 'SendGrid', 'Twilio', 'Zendesk', 'HubSpot'],
        artifactTitle: 'Webhook Receiver Skeleton',
        artifactCode: `[Function("ShopifyWebhook")]
public async Task<HttpResponseData> Run(
    [HttpTrigger("post")] HttpRequestData req)
{
    VerifyHmac(req, _shopifySecret);
    var order = await ParseAsync(req.Body);
    await _cxosClient.TrackAsync(MapOrderEvent(order));
    return req.CreateResponse(HttpStatusCode.OK);
}`,
        integration: [
          'One Azure Function per source platform, independently deployed',
          'Platform-specific signature verification (HMAC, etc.) before payload processing',
          'Cxos.Ingestion.Client NuGet package — shared contract for the outbound call',
          'Azure API Management — public webhook endpoint exposure and throttling',
        ],
        nfr: [
          "Scale: Azure Functions consumption plan scales each receiver independently based on that platform's traffic pattern",
          'Latency: near-real-time — events land within seconds of the source platform\'s push',
          'Reliability: idempotent handling (event_id dedup) since most platforms retry webhook deliveries on failure',
          'Security/Privacy: signature verification happens before any payload is trusted or parsed',
        ],
        example: "SendGrid, Zendesk, and Shopify all push events to their own dedicated webhook receivers. When Shopify has a traffic spike during a flash sale, its receiver scales independently without affecting SendGrid's or Zendesk's — each platform's integration is isolated.",
      },
      {
        slug: 'batch-upload', name: 'Batch Upload (S3, SFTP, API)',
        tagline: "The path for large, scheduled data drops — historical exports, partner files, and bulk API pulls that don't fit an event-at-a-time model.",
        hldCaption: 'Batch Upload handles scale and history rather than real-time delivery.',
        hld: [
          { label: 'Data Source', name: 'Partner / Legacy System', detail: 'Bulk file export or scheduled API pull' },
          { label: 'Ingestion', name: 'Batch Upload', detail: 'Azure Blob Storage / SFTP landing zone', origin: true },
          { label: 'Processing', name: 'Blob-triggered Azure Function', detail: 'Validation and batch ingestion' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Raw zone, promoted to curated' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Backfilled into unified profile' },
          { label: 'Activation', name: 'Batch-driven Segment Refresh', detail: 'Downstream activation on a schedule' },
        ],
        business: [
          'Some data simply arrives in bulk, on a schedule, from systems with no real-time integration option',
          'Enables efficient historical backfill when onboarding a new source, rather than replaying millions of individual events',
          'Owned by Data Engineering',
        ],
        technical: 'Batch Upload accepts files via Azure Blob Storage (direct upload or S3-compatible API), SFTP (for partners who require it, backed by Azure Blob Storage\'s native SFTP support), or a bulk API pull triggered on a schedule. A Blob-triggered .NET Core Azure Function validates and streams the file\'s records through <code>Cxos.Ingestion.Client</code> in batches — the same underlying ingestion contract as every real-time transport, just delivered on a schedule instead of continuously.',
        chipsLabel: 'Supported Paths', chips: ['Azure Blob Storage (S3-compatible API)', 'SFTP', 'Scheduled bulk API pull'],
        artifactTitle: 'Batch Job Summary',
        artifactCode: `{
  "batch_id": "batch_20260801_0300",
  "path": "sftp",
  "file": "partner_export_2026-08-01.csv",
  "rows_ingested": 184213,
  "rows_quarantined": 12,
  "duration_seconds": 94
}`,
        integration: [
          "Azure Blob Storage — primary landing zone, S3-compatible API for partners already using that pattern",
          "SFTP endpoint — Azure Blob Storage's native SFTP support for partners requiring it",
          'Blob-triggered Azure Function (.NET Core) — validation and batch ingestion',
          'Cxos.Ingestion.Client NuGet package — batch mode, same contract as real-time transports',
        ],
        nfr: [
          'Scale: large files are streamed and chunked rather than loaded into memory, supporting multi-million-row batches',
          'Latency: inherently batch — processed on file arrival or schedule, not real-time',
          'Reliability: partial-batch failures quarantine only the affected rows, not the whole file',
          'Security/Privacy: SFTP/Blob credentials are scoped per-partner and rotated on a schedule via Azure Key Vault',
        ],
        example: "A newly onboarded partner delivers three years of historical transaction data as a single SFTP file drop. Batch Upload validates and ingests 8M+ rows overnight, giving the Identity API a complete historical view before the partner's real-time integration even goes live.",
      },
    ],
  },
];

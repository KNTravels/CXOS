module.exports = [
  {
    anchor: 'real-time-activation', name: 'Real-time Activation',
    items: [
      {
        slug: 'email-platforms', name: 'Email Platforms (SendGrid)',
        tagline: 'Triggers transactional and campaign email in response to a real-time customer event or a propensity-score threshold — the highest-volume real-time destination.',
        hldCaption: 'A qualifying event or score crossing a threshold triggers an email within minutes.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Real-time event stream feeding trigger logic' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'Consent state and preferred channel checked before send' },
          { label: 'Intelligence', name: 'Propensity Scores', detail: 'Optional trigger input for targeted campaigns' },
          { label: 'Activation', name: 'Email Platforms (SendGrid)', detail: '.NET Core Activation API &rarr; SendGrid API', origin: true },
        ],
        business: [
          'Email remains the highest-ROI, highest-volume activation channel — cart abandonment, win-back, and lifecycle campaigns all depend on it firing reliably and on time',
          'Consent and channel-preference enforcement here is a direct compliance requirement, not just good practice',
          'Owned by Marketing Technology / Platform Engineering',
        ],
        technical: 'A .NET Core Activation API — packaged as a Docker container on Azure Container Apps — subscribes to qualifying events (cart abandonment, propensity-score threshold crossings) via Azure Service Bus, checks the customer\'s <code>consent_basis</code> and preferred channel through the Profile API, and calls the SendGrid API to trigger the appropriate template. Delivery status (sent, bounced, opened, clicked) is written back to Azure Event Hubs as a new event, closing the loop so engagement data feeds back into the lakehouse like any other touchpoint.',
        chipsLabel: 'Trigger Types', chips: ['Cart abandonment', 'Propensity threshold', 'Lifecycle milestone', 'Transactional (order confirmation)'],
        artifactTitle: 'Activation Trigger Payload',
        artifactCode: `{
  "customer_key": "cust_004821",
  "trigger": "cart_abandonment",
  "channel": "email",
  "template_id": "cart_recovery_v3",
  "consent_checked": true
}`,
        integration: [
          'Azure Service Bus — delivers the triggering event to the Activation API',
          'Profile API — consent and preferred-channel check before every send',
          'SendGrid — email delivery provider',
          'Azure Event Hubs — delivery/engagement events written back as new touchpoint data',
        ],
        nfr: [
          'Scale: designed for bursty campaign sends (tens of thousands of triggers in a short window) without backing up the Service Bus queue',
          'Latency: real-time triggers fire within 5 minutes of the qualifying event, per BR-6.2',
          'Reliability: failed sends are retried with backoff via Polly, then dead-lettered for manual review rather than silently dropped',
          'Security/Privacy: no send occurs without a passing consent check — the API fails closed if the Profile API is unreachable rather than sending anyway',
        ],
        example: 'A customer abandons a cart with a high-value item. The event reaches the Activation API within seconds, a consent check passes, and a recovery email sends within the 5-minute SLA — recovering an order that would otherwise have been lost, with the resulting click event flowing back into the lakehouse as a fresh touchpoint.',
      },
      {
        slug: 'sms-push', name: 'SMS / Push (Twilio, FCM)',
        tagline: 'Time-sensitive, high-attention channels for delivery updates, security alerts, and in-session re-engagement — used more sparingly than email due to higher intrusiveness.',
        hldCaption: 'SMS/Push follows the same trigger path as email, with stricter consent and frequency rules.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Real-time event stream feeding trigger logic' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'Consent state, device tokens, frequency cap state' },
          { label: 'Intelligence', name: 'Operational Services', detail: 'Frequency-cap enforcement shares the Workflow Engine' },
          { label: 'Activation', name: 'SMS / Push (Twilio, FCM)', detail: '.NET Core Activation API &rarr; Twilio / Firebase Cloud Messaging', origin: true },
        ],
        business: [
          'Highest-attention channel for genuinely time-sensitive messages — delivery updates, security alerts, session re-engagement — but overuse burns customer trust faster than any other channel',
          'Explicit opt-in consent for SMS is typically a distinct legal requirement from general marketing consent',
          'Owned by Marketing Technology / Platform Engineering',
        ],
        technical: 'The Activation API routes SMS sends through Twilio and mobile push through Firebase Cloud Messaging (FCM), using device tokens and phone numbers stored on the Unified Customer Profile. Because these channels are more intrusive, the same .NET Core service (Docker container on Azure Container Apps) enforces a frequency cap — tracked as workflow state in the Operational Services\' Workflow Engine — separately from the channel-level consent check every send already requires.',
        chipsLabel: 'Channels', chips: ['SMS (Twilio)', 'Mobile push (FCM)', 'Frequency capping', 'Explicit opt-in consent'],
        artifactTitle: 'SMS/Push Send Record',
        artifactCode: `{
  "customer_key": "cust_004821",
  "channel": "push",
  "provider": "fcm",
  "trigger": "session_reengagement",
  "frequency_cap_state": "1_of_3_this_week"
}`,
        integration: [
          'Twilio — SMS delivery provider',
          'Firebase Cloud Messaging — mobile push delivery provider',
          'Unified Customer Profile — device tokens, phone numbers, and channel-specific consent',
          'Workflow Engine (Operational Services) — enforces per-customer frequency caps across sends',
        ],
        nfr: [
          'Scale: lower volume than email by design, given frequency capping — sized for bursty but bounded traffic',
          'Latency: push notifications typically deliver in under 10 seconds; SMS within the 5-minute activation SLA',
          'Reliability: a failed push falls back to no-op rather than substituting SMS automatically, since channel substitution without consent would itself be a compliance issue',
          'Security/Privacy: SMS opt-in is tracked as a distinct consent flag from general marketing consent and enforced independently',
        ],
        example: "A flight delay triggers a push notification to the airline app within seconds of the operational system reporting it — the kind of time-sensitive alert email couldn't deliver fast enough to be useful, while the frequency cap prevents the same customer from also being pushed a same-day promotional offer.",
      },
      {
        slug: 'ad-platforms', name: 'Ad Platforms (Google, Meta)',
        tagline: 'Syncs customer segments and hashed identifiers to ad platforms for audience targeting and suppression — activation aimed at paid media rather than owned channels.',
        hldCaption: 'Audiences are synced as hashed identifiers, never raw PII, to every connected ad platform.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Semantic Layer', detail: 'Audience segments defined as semantic-layer queries' },
          { label: 'Foundation', name: 'Propensity Scores', detail: 'Common audience-definition input (e.g., high churn risk)' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Resolves the audience membership list' },
          { label: 'Activation', name: 'Ad Platforms (Google, Meta)', detail: '.NET Core Activation API &rarr; Google Ads / Meta Conversions API', origin: true },
        ],
        business: [
          'Lets paid media target or suppress audiences based on real first-party data (propensity, LTV) instead of only the ad platform\'s own inferred signals',
          'Suppression sync (e.g., stop advertising to customers who just purchased) is often the higher-value use case, avoiding wasted spend',
          'Owned by Marketing Technology, in partnership with the Paid Media team',
        ],
        technical: 'A scheduled .NET Core Activation API job (Docker container on Azure Container Apps Jobs) resolves an audience defined as a Semantic Layer query — often combined with a Propensity Scores threshold — into a customer list, hashes identifiers (email, phone) per each platform\'s required format, and syncs via the Google Ads Customer Match API and Meta Conversions API. No raw PII ever leaves the platform; only irreversibly hashed identifiers are transmitted.',
        chipsLabel: 'Sync Types', chips: ['Audience match (targeting)', 'Suppression list', 'Conversion event sync', 'Lookalike seed audience'],
        artifactTitle: 'Audience Sync Payload',
        artifactCode: `{
  "audience": "high_churn_risk_gold_tier",
  "platform": "meta_conversions_api",
  "member_count": 4218,
  "identifier_format": "sha256_hashed_email",
  "sync_type": "targeting"
}`,
        integration: [
          'Semantic Layer — defines audience membership as a governed query',
          'Propensity Scores — common input for behaviorally-defined audiences',
          'Google Ads Customer Match API / Meta Conversions API — destination platforms',
          'Consent Enforcement — audiences exclude customers who have withdrawn marketing consent before the sync ever runs',
        ],
        nfr: [
          'Scale: audience syncs run on a scheduled batch cadence (typically daily), sized for list sizes in the hundreds of thousands without per-record API calls',
          'Latency: not real-time by design — ad platform audience syncs typically run within the platform\'s own daily refresh window',
          "Reliability: a failed sync retains the platform's last successfully synced audience rather than clearing it, avoiding an accidental blank targeting list",
          'Security/Privacy: only hashed identifiers are ever transmitted, and consent-withdrawn customers are excluded before hashing, not filtered after the fact',
        ],
        example: 'A "recently purchased" suppression audience syncs to Meta nightly, preventing customers from seeing the same product ad for days after buying it — a change that measurably reduced wasted ad spend and customer-reported ad fatigue complaints.',
      },
      {
        slug: 'web-app-personalization', name: 'Web / App Personalization',
        tagline: 'Serves personalized content, recommendations, and offers back into the website or app in near-real-time based on the customer\'s current profile and propensity.',
        hldCaption: 'Personalization closes the loop: the same channel that generated the data now consumes it back.',
        hld: [
          { label: 'Data Source', name: 'Customer Touchpoints', detail: 'Web / Mobile Apps — this capability\'s own destination' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Session-level event stream informing personalization' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'LTV band, lifecycle stage, preferences' },
          { label: 'Intelligence', name: 'Propensity Scores', detail: 'Next-best-action / recommendation input' },
          { label: 'Activation', name: 'Web / App Personalization', detail: '.NET Core Activation API personalization endpoint', origin: true },
        ],
        business: [
          "Closes the loop between data collection and the customer's own next experience — the most direct, visible payoff of the entire CXOS pipeline",
          'Higher-converting than generic content because it is grounded in the same unified profile every other capability reads from',
          'Owned by Product Engineering, in partnership with Marketing Technology',
        ],
        technical: 'The website/app calls a low-latency personalization endpoint on the .NET Core Activation API (Docker container on AKS, fronted by Azure API Management) at page-render or session-start time, which combines Unified Customer Profile attributes and Propensity Scores\' next-best-action output, cached in Azure Cache for Redis to keep response times inside a page-render budget. This is the one activation destination where the Cxos.Ingestion.Client SDK\'s own touchpoint is also the read target, making it the tightest latency requirement in the module.',
        chipsLabel: 'Personalization Inputs', chips: ['LTV band / lifecycle stage', 'Propensity next-best-action', 'Recent browsing session', 'A/B experiment assignment'],
        artifactTitle: 'Personalization Response',
        artifactCode: `GET /v1/personalize?customer_key=cust_004821&surface=homepage

{
  "hero_variant": "gold_tier_loyalty_banner",
  "recommended_products": ["sku_2291", "sku_4471"],
  "next_best_action": "upgrade_offer"
}`,
        integration: [
          'Client SDKs (Ingestion Layer) — the same touchpoint that generates the data this endpoint reads',
          'Unified Customer Profile, Propensity Scores — primary inputs to the personalization decision',
          'Azure Cache for Redis — keeps response latency inside a page-render budget',
          'Azure API Management — gateway in front of the personalization endpoint',
        ],
        nfr: [
          'Scale: must handle full site/app traffic concurrency, not just campaign-triggered bursts — the highest-QPS destination in this module',
          'Latency: p99 under 150ms, since this call sits directly in the page-render or session-start critical path',
          'Reliability: falls back to a sensible default (non-personalized) experience if the profile or propensity lookup times out, rather than blocking the page',
          'Security/Privacy: personalization decisions respect consent_basis for the "analytics/personalization" purpose specifically, distinct from marketing consent',
        ],
        example: "A returning gold-tier customer lands on the homepage and sees a loyalty-tier banner and two recommended products chosen from their browsing history — rendered in the same request as the page itself, with the fallback default experience used automatically on the rare occasion the personalization call doesn't return in time.",
      },
      {
        slug: 'on-site-messages', name: 'On-site Messages',
        tagline: 'In-session banners, modals, and inline messages triggered by real-time behavior — the fastest-firing destination, reacting within the same visit rather than a later one.',
        hldCaption: 'On-site Messages react within the same session the triggering behavior happened in.',
        hld: [
          { label: 'Data Source', name: 'Customer Touchpoints', detail: 'Web / Mobile Apps — the live session generating the trigger' },
          { label: 'Ingestion', name: 'Client SDKs', detail: 'Real-time session event stream (Ingestion Layer)' },
          { label: 'Processing', name: 'Stream Worker', detail: 'Transformation & Processing evaluates in-session rules' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'Suppression rules (e.g., don\'t show to existing subscribers)' },
          { label: 'Intelligence', name: 'Operational Services', detail: 'Frequency capping shares the same Workflow Engine' },
          { label: 'Activation', name: 'On-site Messages', detail: '.NET Core Activation API, WebSocket/SSE push to the client', origin: true },
        ],
        business: [
          'The only activation channel that can react and be seen within the same visit — exit-intent offers, low-stock nudges, and session-based upsells all depend on this speed',
          'Lower cost per impression than paid channels since it uses a customer\'s own already-open session',
          'Owned by Product Engineering / Marketing Technology',
        ],
        technical: "A Stream Worker (Transformation &amp; Processing) evaluates in-session behavioral rules (time-on-page, exit intent, cart value threshold) against the live event stream and, on a match, publishes to Azure Service Bus. The Activation API — a Docker container on Azure Container Apps — pushes the resulting message to the client over a WebSocket/Server-Sent-Events connection already established by the Client SDK, giving true within-session reaction rather than requiring a page reload.",
        chipsLabel: 'Trigger Signals', chips: ['Exit intent', 'Time-on-page threshold', 'Cart value threshold', 'Low-stock nudge'],
        artifactTitle: 'On-site Message Push',
        artifactCode: `{
  "customer_key": "cust_004821",
  "trigger": "exit_intent",
  "message_variant": "10_percent_first_order",
  "suppressed_if": "existing_customer"
}`,
        integration: [
          'Client SDKs — maintains the live connection this destination pushes through',
          'Stream Worker (Transformation &amp; Processing) — evaluates in-session behavioral rules in real time',
          'Azure Service Bus — carries the triggering event to the Activation API',
          'Workflow Engine (Operational Services) — shared frequency-capping mechanism with SMS/Push',
        ],
        nfr: [
          'Scale: bounded by concurrent active sessions, not total customer base — spikes with traffic, not campaign size',
          'Latency: sub-second from triggering behavior to message display, the tightest latency requirement of any destination in this module',
          'Reliability: if the live connection has dropped, the trigger is simply not delivered rather than queued for a later session — on-site messages are inherently session-scoped',
          'Security/Privacy: suppression rules (e.g., never show to existing subscribers) are enforced before the message is even evaluated, not just before delivery',
        ],
        example: "A visitor adds an item to their cart, browses for two more minutes without checking out, and shows exit-intent behavior. Within milliseconds a 10%-off modal appears — a conversion path only possible because the trigger, evaluation, and delivery all happen inside the same live session.",
      },
    ],
  },
  {
    anchor: 'batch-file-exports', name: 'Batch / File Exports',
    items: [
      {
        slug: 's3-gcs-azure-blob', name: 'S3 / GCS / Azure Blob',
        tagline: 'Scheduled bulk export of lakehouse data to a customer or partner\'s own cloud object storage — the simplest, most universal batch destination.',
        hldCaption: 'The lowest-friction batch destination: files land in a bucket the receiving team already owns.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Produces the mart the export is sourced from' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Analytics-ready export source' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Executes the export query' },
          { label: 'Activation', name: 'S3 / GCS / Azure Blob', detail: 'Scheduled .NET Core export job (Azure Functions Timer)', origin: true },
        ],
        business: [
          'The lowest-friction destination for partners and internal teams who already have their own cloud storage and just need the data delivered there on a schedule',
          'Avoids building a bespoke integration per partner when a file drop is sufficient',
          'Owned by Data Engineering / Partner Integrations',
        ],
        technical: 'A scheduled Azure Functions Timer job (a .NET Core service packaged as a Docker container) queries the relevant marts table via the Query &amp; Analytics Engine, writes the result as Parquet or CSV, and uploads it to the destination bucket — Amazon S3, Google Cloud Storage, or Azure Blob Storage — using the appropriate cloud SDK and a partner-scoped credential stored in Azure Key Vault. Each export run is logged with row count and checksum for downstream validation.',
        chipsLabel: 'Destinations', chips: ['Amazon S3', 'Google Cloud Storage', 'Azure Blob Storage', 'Parquet / CSV format'],
        artifactTitle: 'Export Job Manifest',
        artifactCode: `{
  "destination": "s3://partner-northwind/cxos-exports/",
  "table": "marts.order_fact",
  "format": "parquet",
  "schedule": "0 2 * * *",
  "row_count": 481200,
  "checksum": "sha256:9f2a..."
}`,
        integration: [
          'Query &amp; Analytics Engine — executes the export query against marts tables',
          'Azure Key Vault — stores partner-scoped destination credentials',
          'Azure Functions (Timer trigger) — runs the scheduled export job',
          'Audit Logs — records every export run for compliance traceability',
        ],
        nfr: [
          'Scale: export size scales with the requested table/date range, not total lakehouse size, since each export is scoped by query',
          'Latency: batch by design — runs on a defined schedule (typically daily/hourly), not on-demand',
          'Reliability: checksum and row-count validation lets the receiving side confirm a complete, uncorrupted transfer before consuming it',
          'Security/Privacy: only fields the export configuration explicitly includes are written — the export job itself is entitlement-scoped like any other consumer',
        ],
        example: 'A logistics partner needs daily order data to plan fulfillment capacity. A nightly export job drops a Parquet file into their S3 bucket by 2am local time, replacing what used to be a manual weekly CSV emailed by an analyst.',
      },
      {
        slug: 'sftp-ftps', name: 'SFTP / FTPS',
        tagline: 'File-based export over a secure legacy transfer protocol, still required by many enterprise partners and financial institutions that don\'t accept cloud-storage delivery.',
        hldCaption: 'SFTP/FTPS exists for the partners who genuinely cannot receive data any other way.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Produces the mart the export is sourced from' },
          { label: 'Foundation', name: 'marts.* tables', detail: 'Analytics-ready export source' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Executes the export query' },
          { label: 'Activation', name: 'SFTP / FTPS', detail: 'Scheduled .NET Core job pushing to a partner-managed SFTP server', origin: true },
        ],
        business: [
          'Many enterprise, banking, and healthcare partners mandate SFTP/FTPS for compliance or legacy-integration reasons — cloud-bucket delivery is simply not an accepted option for them',
          'Keeping this path well-supported avoids losing otherwise-viable partnerships over a transport-protocol requirement',
          'Owned by Data Engineering / Partner Integrations',
        ],
        technical: "The same export pipeline used for S3/GCS/Azure Blob generates the file, but delivery is via SSH.NET-based SFTP (or FTPS where SFTP isn't supported) to a partner-managed server, running as a Docker container job on Azure Container Apps Jobs with credentials rotated through Azure Key Vault. Because SFTP servers vary widely in reliability, this path includes stricter retry-with-backoff and a dead-letter alert if delivery fails after the maximum retry window.",
        chipsLabel: 'Protocol Support', chips: ['SFTP (SSH.NET)', 'FTPS (fallback)', 'PGP file encryption (optional)', 'Retry with backoff'],
        artifactTitle: 'SFTP Delivery Config',
        artifactCode: `{
  "partner": "acme_financial",
  "protocol": "sftp",
  "host": "sftp.acmefinancial.example",
  "remote_path": "/inbound/cxos/",
  "encryption": "pgp",
  "max_retries": 5
}`,
        integration: [
          'Query &amp; Analytics Engine — executes the export query, same as other batch destinations',
          'Azure Key Vault — SFTP credentials and PGP keys',
          'Azure Container Apps Jobs — runs the scheduled delivery job',
          'Alerts &amp; Notifications — pages the owning team on repeated delivery failure',
        ],
        nfr: [
          'Scale: per-partner file sizes are typically modest (single-digit GB), sized to the partner\'s own ingestion capability, not the lakehouse',
          'Latency: batch by design, on a defined schedule agreed with each partner',
          'Reliability: stricter retry/backoff than cloud-storage delivery, since partner-managed SFTP servers are outside CXOS\'s reliability guarantees',
          'Security/Privacy: PGP file-level encryption is used in addition to transport encryption for the most sensitive partner exports (e.g., financial data)',
        ],
        example: "A banking partner's compliance team only accepts PGP-encrypted files over SFTP. The export pipeline reuses the same query and file-generation logic as every other batch destination, differing only in the delivery and encryption step — avoiding a duplicate pipeline just for one partner's transport requirement.",
      },
      {
        slug: 'snowflake-bigquery', name: 'Snowflake / BigQuery',
        tagline: 'Delivers data directly into a partner or internal team\'s own cloud data warehouse — either via native Iceberg attachment or a warehouse-native load, no file hand-off required.',
        hldCaption: 'Because storage is open Iceberg, warehouse delivery can be a table attachment, not a copy.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Produces the mart being delivered' },
          { label: 'Foundation', name: 'Open Table Format (Iceberg)', detail: 'What makes direct Snowflake attachment possible' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Alternative read path when a warehouse-native load is preferred' },
          { label: 'Activation', name: 'Snowflake / BigQuery', detail: 'Iceberg external tables (Snowflake) or scheduled load job (BigQuery)', origin: true },
        ],
        business: [
          'Teams that already standardize on Snowflake or BigQuery for analysis get CXOS data without learning a new query engine',
          "Because the lakehouse is open Iceberg, Snowflake delivery can be a zero-copy table attachment rather than a duplicated, staling export — the same zero-copy principle from the Unified Data Foundation extended to an external consumer",
          'Owned by Data Engineering / Analytics Engineering',
        ],
        technical: "For Snowflake, delivery is a governance-reviewed grant of Iceberg external-table access directly against the lakehouse's Azure Data Lake Storage Gen2 location — no data movement at all, consistent with the platform's zero-copy architecture. BigQuery, lacking native Iceberg external-table support at the same maturity, instead receives a scheduled load job (a .NET Core Docker container on Azure Container Apps Jobs) that reads via the Query &amp; Analytics Engine and writes into a BigQuery-native table on a schedule.",
        chipsLabel: 'Delivery Modes', chips: ['Snowflake — Iceberg external table (zero-copy)', 'BigQuery — scheduled load job', 'Governance-reviewed grant'],
        artifactTitle: 'Warehouse Delivery Config',
        artifactCode: `-- Snowflake: zero-copy external table
CREATE EXTERNAL TABLE partner_db.order_fact
  LOCATION = 'abfss://lakehouse@cxosdata.dfs.core.windows.net/marts/order_fact'
  FILE_FORMAT = ICEBERG;

-- BigQuery: scheduled load job (no native Iceberg external tables)
{ "destination": "bigquery://partner-project.cxos.order_fact", "schedule": "hourly" }`,
        integration: [
          'Open Table Format (Iceberg) — what makes the Snowflake zero-copy path possible',
          'Query &amp; Analytics Engine — read path for the BigQuery load job',
          'Governance &amp; Security — reviews and grants external-table access before any warehouse can attach',
          'Azure Data Lake Storage Gen2 — the physical location Snowflake attaches to directly',
        ],
        nfr: [
          'Scale: Snowflake attachment has no export-size limit since no copy is made; BigQuery load jobs are sized to the scheduled table/range like any batch export',
          'Latency: Snowflake external tables reflect the lakehouse in near-real-time (as fast as the underlying dbt refresh); BigQuery lags by its load schedule',
          'Reliability: Snowflake\'s zero-copy path has no separate copy to drift out of sync with the source; the BigQuery path is validated like any other batch export',
          'Security/Privacy: external-table grants are entitlement-scoped and reviewed by Governance &amp; Security before being issued, same as any other access grant',
        ],
        example: 'A partner analytics team standardized on Snowflake asks for order data access. Rather than building a recurring export pipeline, Data Engineering grants a reviewed Iceberg external-table connection — the partner queries current data directly, with zero ongoing export maintenance.',
      },
      {
        slug: 'databricks-redshift', name: 'Databricks / Redshift',
        tagline: 'Serves data-science and legacy-warehouse teams standardized on Databricks or Redshift, via the same open-format access pattern as any other Iceberg-compatible engine.',
        hldCaption: 'Databricks attaches like Spark; Redshift receives a scheduled load like BigQuery.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Produces the mart being delivered' },
          { label: 'Foundation', name: 'Zero-Copy Architecture', detail: 'Databricks (Spark) attaches to the same Iceberg tables' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Read path for the Redshift load job' },
          { label: 'Activation', name: 'Databricks / Redshift', detail: 'Spark/Iceberg attachment (Databricks) or scheduled load job (Redshift)', origin: true },
        ],
        business: [
          "Data science teams standardized on Databricks get direct Spark access to the same tables everything else reads, without a duplicate ML-specific copy",
          'Legacy Redshift-based BI teams remain supported during a migration window without blocking their existing dashboards',
          'Owned by Data Engineering / Data Science Platform',
        ],
        technical: "Databricks connects to the lakehouse the same way any Iceberg-compatible Spark engine does — direct attachment to Azure Data Lake Storage Gen2 tables, no export job required, matching the pattern already established for ad hoc Spark access under Zero-Copy Architecture. Redshift, without native Iceberg support, receives a scheduled load job (a Docker container on Azure Container Apps Jobs) that reads via the Query &amp; Analytics Engine and writes into Redshift-native tables, used primarily to support legacy dashboards during migration to the lakehouse-native path.",
        chipsLabel: 'Delivery Modes', chips: ['Databricks — Spark/Iceberg attachment (zero-copy)', 'Redshift — scheduled load job', 'Used for ML workloads & legacy BI'],
        artifactTitle: 'Databricks Attachment Example',
        artifactCode: `# Databricks notebook, direct Iceberg read — no CXOS export job involved
df = spark.read.format("iceberg") \\
    .load("abfss://lakehouse@cxosdata.dfs.core.windows.net/marts/order_fact")`,
        integration: [
          'Zero-Copy Architecture — the same principle extended to Databricks\' Spark engine',
          'Query &amp; Analytics Engine — read path for the Redshift scheduled load',
          'Governance &amp; Security — grants and reviews Databricks workspace access to lakehouse tables',
          'Predictive Models — Databricks is a common environment for ad hoc feature exploration ahead of formal dbt Python model changes',
        ],
        nfr: [
          'Scale: Databricks attachment has no export-size ceiling; Redshift loads are sized like any scheduled batch export',
          'Latency: Databricks reflects the lakehouse near-real-time; Redshift lags by its load schedule',
          'Reliability: the Databricks path has no separate copy to go stale; the Redshift path is monitored like any other batch export job',
          'Security/Privacy: Databricks workspace access is governed and audited the same as any direct lakehouse consumer, not treated as an external export',
        ],
        example: "A data science team exploring a new feature for the next Predictive Models iteration attaches Databricks directly to curated tables for ad hoc exploration, while the BI team's existing Redshift dashboards keep working unchanged off a nightly load job until their planned migration to querying the lakehouse directly.",
      },
    ],
  },
  {
    anchor: 'apis-webhooks', name: 'APIs &amp; Webhooks',
    items: [
      {
        slug: 'journeys-automation', name: 'Journeys &amp; Automation',
        tagline: 'Exposes CXOS events and profile changes to external marketing-automation and journey-orchestration tools that own their own campaign logic.',
        hldCaption: 'Journeys & Automation is the webhook path for tools that orchestrate their own campaigns.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Real-time event stream feeding webhook triggers' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'Profile-change events also qualify as webhook triggers' },
          { label: 'Intelligence', name: 'Operational Services', detail: 'Delivery retry/state tracked via the Workflow Engine' },
          { label: 'Activation', name: 'Journeys &amp; Automation', detail: '.NET Core webhook dispatcher, Azure Service Bus fan-out', origin: true },
        ],
        business: [
          "Lets external journey-orchestration tools (the marketing team's own campaign-builder platforms) react to CXOS events without CXOS needing to own campaign-logic itself",
          'Extends activation reach to whatever tool a business team already invests in, rather than forcing every activation use case through CXOS-native destinations',
          'Owned by Platform Engineering, subscriptions managed self-service by each integrating team',
        ],
        technical: "A .NET Core webhook dispatcher (Docker container on Azure Container Apps) subscribes to qualifying event types on Azure Service Bus and delivers them as signed HTTPS POST callbacks to each registered subscriber endpoint, following the same event contract published via the Cxos.Ingestion.Client NuGet package so the payload shape is consistent with what was originally ingested. Each subscription's delivery state (success, retry count, last failure) is tracked as workflow state in Operational Services' Workflow Engine.",
        chipsLabel: 'Webhook Events', chips: ['profile.updated', 'propensity.threshold_crossed', 'consent.changed', 'order.completed'],
        artifactTitle: 'Webhook Subscription',
        artifactCode: `{
  "subscriber": "acme_journey_platform",
  "event_types": ["profile.updated", "propensity.threshold_crossed"],
  "endpoint": "https://hooks.acmejourney.example/cxos",
  "signing_secret_ref": "kv://acme-webhook-secret"
}`,
        integration: [
          'Azure Service Bus — event fan-out source for webhook delivery',
          'Cxos.Ingestion.Client contract — the shared event schema webhook payloads follow',
          'Workflow Engine (Operational Services) — tracks per-subscription delivery state and retries',
          'Azure Key Vault — stores per-subscriber signing secrets for payload verification',
        ],
        nfr: [
          'Scale: fan-out is designed for hundreds of concurrent subscribers without per-subscriber delivery becoming a bottleneck for any one',
          'Latency: webhook delivery typically completes within seconds of the source event, well inside the real-time activation SLA',
          'Reliability: failed deliveries retry with exponential backoff and are dead-lettered after a configured maximum, with the subscriber able to query missed-event state',
          'Security/Privacy: every payload is signed (HMAC) so subscribers can verify authenticity, and each subscription is entitlement-scoped to only the event types and fields it is approved for',
        ],
        example: "A marketing team's third-party journey-orchestration tool subscribes to propensity.threshold_crossed events and builds its own multi-step win-back campaign entirely within that tool — CXOS supplies the trustworthy trigger, the journey platform owns the campaign logic, and neither team has to rebuild the other's functionality.",
      },
      {
        slug: 'external-applications', name: 'External Applications',
        tagline: 'A general-purpose, authenticated REST API surface for external and partner applications to read profile, propensity, and activation-relevant data on demand.',
        hldCaption: 'External Applications is the on-demand pull counterpart to the push-based webhook path.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Populates the profile/propensity data this API serves' },
          { label: 'Foundation', name: 'Profile API', detail: 'Underlying data source for external reads' },
          { label: 'Intelligence', name: 'Propensity Scores', detail: 'Also exposed for entitled external callers' },
          { label: 'Activation', name: 'External Applications', detail: '.NET Core public API behind Azure API Management', origin: true },
        ],
        business: [
          "Some partner and internal applications need to pull data on demand rather than react to a push event — this is that path, distinct from Journeys & Automation's webhook model",
          "Gives external application developers a self-service, documented API instead of a bespoke integration per partner",
          'Owned by Platform Engineering',
        ],
        technical: 'External Applications is a .NET Core public API (Docker container on AKS) fronted by Azure API Management, applying OAuth 2.0 client-credentials authentication (Azure AD B2C for customer-facing partner apps, Azure AD/Entra ID app registrations for internal-partner service accounts) and per-application rate limiting. It wraps the same Profile API and Propensity Scores data already used internally, applying entitlement scoping per registered application so an external partner only ever sees the fields their integration agreement covers.',
        chipsLabel: 'API Surface', chips: ['REST + OAuth 2.0', 'Rate-limited per application', 'Profile & propensity reads', 'API key / client-credentials auth'],
        artifactTitle: 'External API Request',
        artifactCode: `POST /oauth/token  (client_credentials grant)

GET /external/v1/profile/cust_004821
Authorization: Bearer <partner-scoped-token>

200 OK
{ "lifecycle_stage": "active", "ltv_band": "gold" }
-- only fields covered by this partner's integration agreement are returned`,
        integration: [
          'Azure API Management — gateway: OAuth validation, rate limiting',
          'Azure AD B2C / Entra ID — identity providers for partner and internal-service authentication',
          'Profile API, Propensity Scores — underlying data this surface wraps with external-appropriate scoping',
          'Application Insights — per-partner usage and error tracking',
        ],
        nfr: [
          'Scale: rate limits are set per registered application to prevent one partner\'s traffic from degrading service for others',
          'Latency: p99 under 200ms, comparable to the internal Profile API since it wraps the same underlying data path',
          'Reliability: circuit breakers protect the API if an underlying dependency (Profile API, propensity store) is degraded',
          'Security/Privacy: every registered application has an explicit field-level entitlement scope reviewed at onboarding — no partner gets broader access than its integration agreement specifies',
        ],
        example: 'A loyalty-partner mobile app calls External Applications on login to fetch the customer\'s current LTV band and display tier-appropriate perks — a self-service integration the partner\'s own engineering team built from published API docs, without a CXOS engineer involved in the build.',
      },
      {
        slug: 'custom-integrations', name: 'Custom Integrations',
        tagline: 'The bespoke-connector pattern for destinations that don\'t fit the standard batch, real-time, webhook, or Reverse ETL shapes — built on the same shared SDK contract as everything else.',
        hldCaption: 'Custom Integrations reuses the shared Ingestion contract in reverse, for activation.',
        hld: [
          { label: 'Data Source', name: 'Data Sources', detail: 'Every touchpoint and business system' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'SDKs, connectors, protocols' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Supplies whatever event/data the custom connector needs' },
          { label: 'Foundation', name: 'Unified Data Foundation', detail: 'Any lakehouse table a custom connector may read from' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Common read path for custom connector logic' },
          { label: 'Activation', name: 'Custom Integrations', detail: '.NET Core connector template, Cxos.Activation.Client NuGet pattern', origin: true },
        ],
        business: [
          "Not every destination fits a standard shape — a niche partner system, an unusual delivery cadence, a proprietary protocol — and this pattern exists so those cases don't get hacked into an ill-fitting standard connector",
          'Keeps one-off integrations maintainable by building them on the same shared conventions as every standard destination',
          'Owned by Platform Engineering, individual connectors owned by the requesting team',
        ],
        technical: "A custom connector is a .NET Core service scaffolded from a shared template (mirroring the Ingestion Layer's Connectors pattern in reverse), packaged as its own Docker container on Azure Container Apps, and registered with the Activation API's dispatch layer so it can subscribe to the same Azure Service Bus events as any standard destination. It follows the same observability conventions (Application Insights tracing, Azure Monitor alerting) as every other service, so an unusual destination doesn't become an unmonitored blind spot.",
        chipsLabel: 'Connector Pattern', chips: ['Scaffolded from shared template', 'Own Docker container / Azure Container Apps', 'Subscribes via Azure Service Bus', 'Standard observability conventions'],
        artifactTitle: 'Custom Connector Registration',
        artifactCode: `{
  "connector_name": "regional_pos_sync",
  "owning_team": "commerce-integrations",
  "subscribed_events": ["order.completed"],
  "delivery_protocol": "proprietary_pos_api_v2",
  "container_image": "cxos/connectors/regional-pos-sync:1.4.0"
}`,
        integration: [
          'Azure Service Bus — event subscription mechanism shared with every standard destination',
          'Shared connector template — the scaffold every custom connector starts from',
          'Application Insights / Azure Monitor — standard observability every connector inherits',
          'Query &amp; Analytics Engine — common read path when a connector needs lakehouse data beyond the triggering event',
        ],
        nfr: [
          'Scale: each custom connector is sized to its own destination\'s needs — no shared infrastructure bottleneck across unrelated connectors',
          'Latency: varies per connector\'s use case, documented individually rather than held to one platform-wide SLA',
          'Reliability: inherits the same retry/dead-letter conventions as standard destinations by building on the shared template rather than reinventing them',
          'Security/Privacy: each custom connector goes through the same Governance &amp; Security review as a standard destination before being granted event subscriptions',
        ],
        example: 'A regional point-of-sale vendor requires a proprietary, non-REST protocol no standard connector supports. Commerce Integrations scaffolds a custom connector from the shared template in a few days, inheriting retry logic and monitoring for free, rather than building an integration from scratch.',
      },
    ],
  },
  {
    anchor: 'reverse-etl-cdp-sync', name: 'Reverse ETL / CDP Sync',
    items: [
      {
        slug: 'crm-salesforce', name: 'CRM (Salesforce)',
        tagline: 'Pushes CXOS-computed insight — LTV band, propensity, relationship context — back into Salesforce so sales and account teams see it in their native workflow.',
        hldCaption: 'Reverse ETL puts CXOS insight where sales already works, instead of a separate tool.',
        hld: [
          { label: 'Data Source', name: 'Business Systems', detail: 'Salesforce is also a source under Data Sources' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'Salesforce connector — original data in' },
          { label: 'Processing', name: 'Rollups &amp; Aggregations', detail: 'Computes the marts feeding this sync' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'LTV band, lifecycle stage source data' },
          { label: 'Intelligence', name: 'Propensity Scores', detail: 'Upsell/churn scores synced alongside profile fields' },
          { label: 'Activation', name: 'CRM (Salesforce)', detail: 'Scheduled Reverse ETL job &rarr; Salesforce Bulk API', origin: true },
        ],
        business: [
          "Sales and account teams live in Salesforce — pushing LTV, propensity, and relationship context there means insight gets used, instead of sitting in a dashboard salespeople never open",
          'Closes the loop with a system that is itself a Data Sources input, making Salesforce both a source and a destination',
          'Owned by Revenue Operations / Platform Engineering',
        ],
        technical: 'A scheduled .NET Core Reverse ETL job (Docker container on Azure Container Apps Jobs) reads computed fields — LTV band, upsell propensity, churn risk, household/account relationships — from the relevant marts tables via the Query &amp; Analytics Engine, maps them to custom fields on the Salesforce Account/Contact object, and writes them via the Salesforce Bulk API for efficient high-volume upsert. Field mappings are version-controlled configuration, not hardcoded, so adding a new synced field doesn\'t require a code change.',
        chipsLabel: 'Synced Fields', chips: ['LTV band', 'Churn risk / upsell propensity', 'Household/account relationships', 'Last-touchpoint summary'],
        artifactTitle: 'Salesforce Field Mapping',
        artifactCode: `{
  "salesforce_object": "Account",
  "field_mappings": {
    "CXOS_LTV_Band__c": "marts.customer_profile.ltv_band",
    "CXOS_Churn_Risk__c": "marts.propensity_scores.churn_risk"
  },
  "sync_method": "bulk_api_upsert",
  "schedule": "hourly"
}`,
        integration: [
          'Business Systems (Data Sources) — Salesforce as an original source, distinct from this reverse sync',
          'Query &amp; Analytics Engine — reads the marts tables being synced',
          'Salesforce Bulk API — the write mechanism for efficient high-volume upsert',
          'Consent Enforcement — synced fields respect the same purpose-based consent rules as any other consumer',
        ],
        nfr: [
          'Scale: bulk API upsert handles the full account/contact base in a single scheduled run rather than per-record calls',
          'Latency: hourly sync cadence by default, tunable per field group based on how time-sensitive the insight is',
          'Reliability: partial-batch failures are retried at the record level via Bulk API job status polling, not treated as an all-or-nothing failure',
          'Security/Privacy: only fields explicitly approved for CRM sync are mapped — Reverse ETL does not become a shortcut around the same field-level entitlement rules the Profile API enforces',
        ],
        example: 'An account executive opens a Salesforce account record and sees CXOS-computed churn risk and upsell propensity directly on the page — insight that previously required logging into a separate BI tool now shows up automatically in the tool they already work in every day.',
      },
      {
        slug: 'support-zendesk', name: 'Support (Zendesk)',
        tagline: 'Syncs profile and relationship context into Zendesk so support agents see who they\'re talking to without switching tools mid-ticket.',
        hldCaption: 'Support context arrives in Zendesk before the agent even opens the ticket.',
        hld: [
          { label: 'Data Source', name: 'Business Systems', detail: 'Zendesk is also a source under Data Sources' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'Support system connector — original ticket data in' },
          { label: 'Processing', name: 'Transformation &amp; Processing', detail: 'Identity resolution links tickets to the profile' },
          { label: 'Foundation', name: 'Unified Customer Profile', detail: 'Lifecycle stage, LTV band, relationship context' },
          { label: 'Intelligence', name: 'Profile API', detail: 'Read path this sync pulls from' },
          { label: 'Activation', name: 'Support (Zendesk)', detail: 'Reverse ETL job + real-time webhook &rarr; Zendesk sidebar app', origin: true },
        ],
        business: [
          "Support agents resolve tickets faster and with better judgment (e.g., escalation priority) when they immediately see a customer's tier and relationship context, without pivoting to another tool mid-conversation",
          'Reduces average handle time and improves first-contact resolution for high-value customers',
          'Owned by Customer Support Operations / Platform Engineering',
        ],
        technical: 'A hybrid approach: a scheduled Reverse ETL job (Docker container on Azure Container Apps Jobs) bulk-syncs baseline profile fields into Zendesk custom user fields via its Bulk API, while a lighter real-time path — reusing the Journeys &amp; Automation webhook dispatcher — pushes the small set of fields needed for a Zendesk sidebar app to show live context (current LTV band, open household tickets) at ticket-open time, since support interactions are more time-sensitive than a typical CRM sync.',
        chipsLabel: 'Sync Paths', chips: ['Bulk field sync (scheduled)', 'Real-time sidebar context (webhook)', 'Household/relationship context'],
        artifactTitle: 'Zendesk Sidebar Context',
        artifactCode: `GET /zendesk-sidebar/context?customer_key=cust_004821

{
  "lifecycle_stage": "active",
  "ltv_band": "gold",
  "open_household_tickets": 1,
  "churn_risk": 0.12
}`,
        integration: [
          'Business Systems (Data Sources) — Zendesk as an original ticket-data source, distinct from this reverse sync',
          'Journeys &amp; Automation\'s webhook dispatcher — reused for the real-time sidebar context path',
          'Relationships (Identity &amp; Profile Service) — household ticket context surfaced in the sidebar',
          'Profile API — underlying data source for both the bulk and real-time paths',
        ],
        nfr: [
          'Scale: bulk sync covers the full customer base on a schedule; real-time sidebar calls scale with concurrent open tickets, a much smaller number',
          'Latency: bulk fields refresh hourly; sidebar context loads within the ticket-open critical path, targeting under 300ms',
          'Reliability: sidebar app falls back to the last bulk-synced value if the real-time context call fails, rather than showing a blank panel',
          'Security/Privacy: support agents see only fields approved for support-context display — sensitive fields like raw payment data are never included in this sync',
        ],
        example: 'A gold-tier customer calls in about a billing issue. Before the agent finishes the greeting, the Zendesk sidebar already shows their tier, churn risk, and a note that another household member has an open ticket — context that used to require three separate lookups across different systems.',
      },
      {
        slug: 'marketing-hubspot', name: 'Marketing (HubSpot)',
        tagline: 'Syncs computed segments and engagement scores into HubSpot so marketing operations can build campaigns using CXOS insight inside the tool they already run campaigns from.',
        hldCaption: 'HubSpot receives the same governed segments used everywhere else in Real-time Activation.',
        hld: [
          { label: 'Data Source', name: 'Business Systems', detail: 'HubSpot is also a source under Data Sources' },
          { label: 'Ingestion', name: 'Ingestion Layer', detail: 'Marketing system connector — original engagement data in' },
          { label: 'Processing', name: 'Semantic Layer', detail: 'Segments defined as governed semantic-layer queries' },
          { label: 'Foundation', name: 'Propensity Scores', detail: 'Common segment-definition input' },
          { label: 'Intelligence', name: 'Query &amp; Analytics Engine', detail: 'Resolves segment membership for the sync' },
          { label: 'Activation', name: 'Marketing (HubSpot)', detail: 'Scheduled Reverse ETL job &rarr; HubSpot Contacts API', origin: true },
        ],
        business: [
          "Marketing operations builds and sends campaigns from HubSpot day to day — syncing CXOS segments there means marketers use governed, first-party-informed audiences without leaving their primary tool",
          "Keeps HubSpot's own contact list from drifting out of sync with the platform's unified view of the customer",
          'Owned by Marketing Operations / Platform Engineering',
        ],
        technical: 'A scheduled .NET Core Reverse ETL job (Docker container on Azure Container Apps Jobs) resolves the same Semantic Layer-defined segments used for Ad Platforms sync into HubSpot list membership, and writes engagement-relevant profile fields (LTV band, propensity scores, preferred channel) as HubSpot contact properties via its Contacts API, so marketers building a HubSpot workflow can filter and personalize on CXOS-computed fields directly.',
        chipsLabel: 'Synced Objects', chips: ['Segment/list membership', 'LTV band & propensity as contact properties', 'Preferred channel'],
        artifactTitle: 'HubSpot Sync Payload',
        artifactCode: `{
  "hubspot_object": "contact",
  "list": "high_ltv_low_churn_risk",
  "properties": {
    "cxos_ltv_band": "gold",
    "cxos_churn_risk": 0.12,
    "cxos_preferred_channel": "email"
  }
}`,
        integration: [
          'Business Systems (Data Sources) — HubSpot as an original engagement-data source, distinct from this reverse sync',
          'Semantic Layer — the same governed segment definitions used for Ad Platforms sync, reused here for consistency',
          'HubSpot Contacts API — the write mechanism for list membership and contact properties',
          'Consent Enforcement — contacts who have withdrawn marketing consent are excluded from segment sync',
        ],
        nfr: [
          'Scale: contact sync runs against the full active-customer segment population on a schedule, not per-contact calls',
          'Latency: segments refresh on the same cadence as Ad Platforms sync (typically daily) to keep both channels consistent with each other',
          'Reliability: a failed sync run retains HubSpot\'s last successfully synced segment membership rather than clearing lists mid-campaign',
          'Security/Privacy: only marketing-consented contacts are synced, and only the specific fields approved for the marketing-operations use case are written as contact properties',
        ],
        example: "Marketing Operations builds a HubSpot workflow targeting the same 'high LTV, low churn risk' segment already used for ad-platform suppression — because both pull from the same Semantic Layer definition, the audience marketing emails and the audience ads target stay consistent with each other automatically.",
      },
    ],
  },
];

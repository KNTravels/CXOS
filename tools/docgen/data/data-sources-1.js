module.exports = [
  {
    anchor: 'customer-touchpoints', name: 'Customer Touchpoints',
    items: [
      {
        slug: 'web-mobile-apps', name: 'Web / Mobile Apps',
        tagline: 'Customer-facing web and native mobile applications are typically the highest-volume source of behavioral events — every page view, product view, cart action, search, and click.',
        hldCaption: 'Angular / native app &rarr; .NET Core microservices on Azure &rarr; downstream activation.',
        hld: [
          { label: 'Touchpoint', name: 'Web / Mobile App', detail: 'Angular SPA + native iOS/Android', origin: true },
          { label: 'Ingestion', name: '.NET Core Ingestion API', detail: 'Cxos.Ingestion.Client NuGet SDK &rarr; Azure API Management &rarr; AKS' },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'Azure Event Hubs &rarr; Azure Container Apps' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Azure Data Lake Storage Gen2 + Azure Purview' },
          { label: 'Intelligence', name: '.NET Core Identity / Analytics API', detail: 'Azure DB for PostgreSQL + Azure OpenAI' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Azure Service Bus &rarr; personalization / CRM' },
        ],
        business: [
          'Highest-volume, lowest-cost-to-instrument channel — usually the first source wired into a CXOS rollout',
          'Directly drives conversion-rate optimization, personalization, and cart-abandonment recovery',
          'Owned by Digital / Product / Growth; often the P&amp;L justification for the platform investment',
        ],
        technical: 'The Web SDK (TypeScript) and Mobile SDK (Swift / Kotlin) are thin wrappers around the same contract published in the <code>Cxos.Ingestion.Client</code> NuGet package, so the browser, the mobile app, and the .NET Core Ingestion API all agree on one event schema. Client apps call Azure API Management, which authenticates the request (Azure AD B2C for end-user tokens), applies rate limiting, and routes to the Ingestion API — an ASP.NET Core Web API running on AKS. The API validates the payload and publishes it onto Azure Event Hubs for downstream processing.',
        chipsLabel: 'Typical Events', chips: ['page_view', 'product_viewed', 'add_to_cart', 'search_performed', 'app_opened', 'checkout_started'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "product_viewed",
  "event_id": "9f2c1e6a-2b41-4e9d-8f3a-1c7d9a0b6e2f",
  "timestamp": "2026-08-01T10:22:14Z",
  "anonymous_id": "a1b2c3d4",
  "user_id": "cust_004821",
  "context": {
    "channel": "web",
    "session_id": "sess_77af",
    "page_url": "/products/sku-1029",
    "device": { "type": "desktop", "os": "Windows", "browser": "Chrome" }
  },
  "properties": {
    "product_id": "sku-1029",
    "product_name": "Wireless Headphones",
    "price": 2499,
    "currency": "INR"
  }
}`,
        integration: [
          '<code>Cxos.Ingestion.Client</code> NuGet package (Azure Artifacts feed) — typed contracts + Polly retry policy',
          'Azure API Management — gateway, auth, throttling',
          'Ingestion API — ASP.NET Core microservice on AKS',
          'Azure Event Hubs — Kafka-compatible ingestion backbone',
          'Azure AD B2C — end-user authentication / consent context',
        ],
        nfr: [
          'Scale: AKS autoscaling + Event Hubs throughput units absorb flash-sale traffic spikes without event loss',
          'Latency: sub-200ms edge-to-ingest typical, needed for real-time personalization',
          'Reliability: Mobile SDK queues events locally and retries via Polly when connectivity returns',
          'Security/Privacy: Azure AD B2C consent claims gate SDK initialization; PII fields tagged in the shared contract',
        ],
        example: 'A retail enterprise runs its Ingestion API as an ASP.NET Core microservice on AKS, fronted by Azure API Management. During a flash sale, Azure Event Hubs absorbs a 12x traffic spike while the Stream Worker autoscales on Azure Container Apps. The Analytics API — sharing the same <code>Cxos.Ingestion.Client</code> contract — flags users who viewed a promoted SKU but didn\'t purchase within 10 minutes, and the Activation API pushes a personalization event through Azure Service Bus, lifting flash-sale conversion by 6.2%.',
      },
      {
        slug: 'iot-devices', name: 'IoT Devices',
        tagline: 'Connected devices — smart appliances, wearables, in-vehicle systems, and industrial sensors — that emit telemetry and usage events tied to a customer or account.',
        hldCaption: 'Device telemetry &rarr; Azure IoT Hub &rarr; .NET Core microservices on Azure.',
        hld: [
          { label: 'Touchpoint', name: 'IoT Device', detail: 'Smart appliance, wearable, in-vehicle unit', origin: true },
          { label: 'Ingestion', name: 'Azure IoT Hub + Ingestion API', detail: 'Device-to-cloud telemetry &rarr; Cxos.Ingestion.Client' },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: "IoT Hub's Event Hub-compatible endpoint &rarr; Azure Container Apps" },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Azure Data Lake Storage Gen2 (time-partitioned)' },
          { label: 'Intelligence', name: '.NET Core AI &amp; Insights API', detail: 'Azure Machine Learning — predictive maintenance' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Azure Service Bus &rarr; proactive service alerts' },
        ],
        business: [
          'Turns product usage into a continuous relationship instead of a one-time sale',
          'Powers predictive maintenance and proactive support — reduces warranty cost and churn',
          'Owned jointly by Connected Products and Customer Success teams',
        ],
        technical: 'Devices authenticate to Azure IoT Hub using per-device certificates or SAS tokens issued via the Device Provisioning Service — IoT Hub is the device-facing front door instead of Azure API Management. IoT Hub exposes a built-in Event Hub-compatible endpoint, which the .NET Core Ingestion API consumes using the same <code>Cxos.Ingestion.Client</code> contracts as every other touchpoint, normalizing telemetry into the shared event schema. Where local batching is needed, a lightweight Device Gateway (also .NET Core) runs as an Azure IoT Edge module.',
        chipsLabel: 'Typical Events', chips: ['device_status', 'sensor_reading', 'firmware_updated', 'device_paired', 'battery_low'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "sensor_reading",
  "event_id": "d41d8cd9-8f00-4b3f-8e5f-5c8a2f0e9b11",
  "timestamp": "2026-08-01T10:22:00Z",
  "device_id": "dev_88213",
  "user_id": "cust_004821",
  "context": {
    "channel": "iot",
    "firmware_version": "2.3.1",
    "connectivity": "wifi"
  },
  "properties": {
    "metric": "temperature",
    "value": 21.4,
    "unit": "celsius"
  }
}`,
        integration: [
          'Azure IoT Hub — device registry, per-device auth, telemetry ingress',
          '<code>Cxos.Ingestion.Client</code> NuGet package — consumed by the .NET Core Ingestion API reading IoT Hub\'s endpoint',
          'Azure IoT Edge — optional edge-deployed .NET Core module for local batching/filtering',
          'Azure Machine Learning — predictive maintenance / anomaly models',
          'Identity &amp; Profile microservice — device-to-customer pairing',
        ],
        nfr: [
          'Scale: IoT Hub scales to millions of concurrently connected devices via scale units',
          'Latency: most telemetry is near-real-time (minutes); safety-critical alerts use an Azure Function trigger for a sub-second path',
          'Reliability: IoT Edge modules store-and-forward during connectivity loss',
          'Security: mutual TLS/device certificates via the Device Provisioning Service; firmware version tracked per device for patch compliance',
        ],
        example: 'A connected-appliance manufacturer registers 2M+ devices in Azure IoT Hub. The .NET Core Stream Worker, running on Azure Container Apps, consumes IoT Hub\'s Event Hub-compatible endpoint and flags an abnormal vibration pattern; the AI &amp; Insights API, backed by an Azure Machine Learning model, predicts an 85% failure probability within 30 days. The Activation API pushes a proactive service offer through Azure Service Bus — cutting unplanned service calls by 18%.',
      },
      {
        slug: 'in-store-kiosks', name: 'In-Store Kiosks',
        tagline: 'Self-service and point-of-sale kiosks physically located in stores, capturing in-person interactions like self-checkout, loyalty lookups, and product lookups.',
        hldCaption: 'Kiosk client &rarr; offline queue &rarr; .NET Core microservices on Azure.',
        hld: [
          { label: 'Touchpoint', name: 'In-Store Kiosk', detail: 'Self-checkout, loyalty lookup, product lookup', origin: true },
          { label: 'Ingestion', name: '.NET Core Kiosk Client + Ingestion API', detail: 'Cxos.Ingestion.Client with local offline queue' },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'Azure Event Hubs &rarr; session build, identity match' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Unified with online transaction history' },
          { label: 'Intelligence', name: '.NET Core Identity API', detail: 'Loyalty ID resolution' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Store ops dashboards, loyalty systems (Reverse ETL)' },
        ],
        business: [
          'Bridges the physical store into the same customer profile as digital channels — key for true omnichannel measurement',
          'Enables loyalty-driven personalization at the point of physical interaction',
          'Owned jointly by Store Operations and Digital / CX teams',
        ],
        technical: 'The kiosk runs a .NET Core thin client (Blazor Hybrid or WPF) embedding the same <code>Cxos.Ingestion.Client</code> NuGet package used by every other touchpoint, so the contract never diverges between web, mobile, and in-store. Because store networks are less reliable than a data-center link, the client buffers events in a local SQLite queue and flushes to Azure API Management (&rarr; the Ingestion API on AKS) via the package\'s built-in Polly retry policy. Sessions are anonymous until a loyalty card, phone number, or email is scanned or entered.',
        chipsLabel: 'Typical Events', chips: ['kiosk_session_started', 'loyalty_scanned', 'product_lookup', 'self_checkout_completed', 'payment_processed'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "self_checkout_completed",
  "event_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "timestamp": "2026-08-01T14:05:33Z",
  "user_id": "cust_004821",
  "context": {
    "channel": "kiosk",
    "store_id": "store_0142",
    "kiosk_id": "kiosk_07"
  },
  "properties": {
    "order_id": "ord_55123",
    "total": 3499,
    "currency": "INR",
    "items": 4
  }
}`,
        integration: [
          '<code>Cxos.Ingestion.Client</code> NuGet package with local SQLite-backed offline queue',
          'Azure API Management — ingress once store connectivity is available',
          'POS integration — payment confirmation correlated to the session',
          'Reverse ETL (.NET Core Activation API + Azure Functions) — store operations dashboards and loyalty systems',
        ],
        nfr: [
          'Scale: thousands of stores, bursty peak-hour traffic per location — Ingestion API scales via AKS independent of any single store',
          'Latency: checkout flows need sub-second local response even if cloud sync lags',
          'Reliability: offline-first design — kiosk client functions during an outage and syncs once connectivity returns',
          'Security/Privacy: kiosks are shared physical devices — the client hard-clears the local session and queue on completion or timeout',
        ],
        example: 'A grocery chain rolls out .NET Core kiosk clients across 400 stores, each carrying the same <code>Cxos.Ingestion.Client</code> package as the mobile app. Loyalty-scan events are stitched to the same customer profile through the Identity API, letting the kiosk surface a personalized coupon mid-checkout — increasing average basket size by 4.1% for enrolled loyalty members.',
      },
      {
        slug: 'chat-voice-bots', name: 'Chat / Voice / Bots',
        tagline: 'Conversational touchpoints — live chat, chatbots, and voice assistants — where a customer expresses intent in natural language.',
        hldCaption: 'Conversation platform webhook &rarr; .NET Core microservices on Azure.',
        hld: [
          { label: 'Touchpoint', name: 'Chat / Voice / Bot', detail: 'Live chat, chatbot, voice assistant', origin: true },
          { label: 'Ingestion', name: 'Azure Function (Webhook Receiver)', detail: 'Platform webhook &rarr; Cxos.Ingestion.Client' },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'NLU intent enrichment via Azure Event Hubs' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Transcript + structured intent storage' },
          { label: 'Intelligence', name: '.NET Core AI &amp; Insights API', detail: 'Azure OpenAI Service — sentiment, copilot' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Agent handoff, journey triggers (Azure Service Bus)' },
        ],
        business: [
          'Conversational channels are now a primary support and sales surface — measuring them means measuring deflection, intent, and satisfaction, not just call volume',
          'Powers automated escalation and agent-assist, reducing average handle time',
          'Owned by Customer Support / Conversational AI teams',
        ],
        technical: 'Conversation platforms (Azure Bot Service, Intercom, custom bots, IVR-to-text) call a small .NET Core Azure Function acting as a webhook receiver, which authenticates the payload and forwards it through the shared <code>Cxos.Ingestion.Client</code> contracts into the Ingestion API. Intent classification runs either at the platform (Azure Bot Service\'s built-in NLU) or downstream in the Stream Worker via a call to the AI &amp; Insights API, backed by Azure OpenAI Service. Transcripts are tagged for redaction before long-term storage.',
        chipsLabel: 'Typical Events', chips: ['chat_started', 'message_sent', 'intent_detected', 'bot_handoff_to_human', 'call_transcribed'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "intent_detected",
  "event_id": "b3e1a2f0-6a9b-4b7f-9d2a-1a5c9e6b3f01",
  "timestamp": "2026-08-01T09:41:02Z",
  "user_id": "cust_004821",
  "context": {
    "channel": "chat",
    "conversation_id": "conv_9931",
    "platform": "web_widget"
  },
  "properties": {
    "intent": "return_request",
    "confidence": 0.93,
    "order_id": "ord_55123"
  }
}`,
        integration: [
          'Azure Function (.NET Core isolated worker) as the platform webhook receiver',
          '<code>Cxos.Ingestion.Client</code> NuGet package for the outbound call into the Ingestion API',
          'Azure OpenAI Service — intent/sentiment classification, AI Copilot',
          'Activation API + Azure Service Bus — agent handoff and journey triggers',
        ],
        nfr: [
          'Scale: bursty around support incidents/outages — Azure Functions consumption plan absorbs spikes without pre-provisioned capacity',
          'Latency: handoff/escalation events route through a dedicated high-priority Service Bus topic',
          'Reliability: conversation continuity survives a dropped connection via the platform\'s own session ID',
          'Security/Privacy: transcripts are redacted (PII/payment/health details) by an Azure Function before reaching the Data Lakehouse',
        ],
        example: 'A telecom provider\'s Azure Bot Service and IVR both forward transcripts through a shared .NET Core webhook receiver into the Ingestion API. The AI &amp; Insights API, using Azure OpenAI Service, flags a spike in "billing_dispute" intents tied to a specific promotion within minutes instead of next week\'s report, and a temporary FAQ deflection flow is activated through the Activation API — cutting live-agent volume for that issue by 30%.',
      },
      {
        slug: 'email-sms', name: 'Email / SMS',
        tagline: 'Outbound and inbound engagement on email and SMS channels — opens, clicks, replies, and opt-outs — usually reported back by the sending platform.',
        hldCaption: 'ESP webhook &rarr; .NET Core microservices on Azure.',
        hld: [
          { label: 'Touchpoint', name: 'Email / SMS', detail: 'Outbound campaigns, inbound replies', origin: true },
          { label: 'Ingestion', name: 'Azure Function (Webhook Receiver)', detail: 'SendGrid/Twilio webhook &rarr; Cxos.Ingestion.Client' },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'Priority path for opt-outs via Azure Event Hubs' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Engagement history per profile' },
          { label: 'Intelligence', name: '.NET Core Analytics API', detail: 'Azure DB for PostgreSQL — campaign performance' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Next-best-channel, suppression sync (Reverse ETL)' },
        ],
        business: [
          'Email/SMS engagement is a leading indicator of campaign ROI and channel fatigue',
          'Opt-out/consent events here are legally load-bearing — mishandling them creates compliance risk',
          'Owned by Lifecycle/CRM Marketing; consent state is shared with Legal/Compliance',
        ],
        technical: 'SendGrid and Twilio call a .NET Core Azure Function webhook endpoint for every engagement event (send, open, click, bounce, opt-out); the function validates the provider signature and forwards the event through <code>Cxos.Ingestion.Client</code> into the Ingestion API. The Stream Worker routes two priority tiers onto separate Azure Event Hubs consumer groups: standard engagement (opens/clicks) and compliance-critical (unsubscribes/bounces), so opt-outs are never queued behind bulk analytics traffic. The Analytics API (ASP.NET Core + Dapper) reads rollups from Azure Database for PostgreSQL Flexible Server for campaign dashboards.',
        chipsLabel: 'Typical Events', chips: ['email_sent', 'email_opened', 'email_clicked', 'sms_delivered', 'unsubscribed'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "email_clicked",
  "event_id": "1e438f2b-3a9c-4c2d-8b1a-6f2e0d4a7c93",
  "timestamp": "2026-08-01T08:15:47Z",
  "user_id": "cust_004821",
  "context": {
    "channel": "email",
    "campaign_id": "camp_2291",
    "provider": "sendgrid"
  },
  "properties": {
    "link_url": "/summer-sale",
    "message_id": "msg_774f"
  }
}`,
        integration: [
          'Azure Function webhook receivers for SendGrid / Twilio / Braze',
          '<code>Cxos.Ingestion.Client</code> NuGet package — shared contract for the outbound call into the Ingestion API',
          'Azure Event Hubs — dual consumer groups (standard vs. compliance-priority)',
          'Reverse ETL (.NET Core Activation API + Azure Functions) — suppression list sync back to the ESP',
        ],
        nfr: [
          'Scale: campaign sends can generate millions of webhook callbacks in a short burst — Azure Functions consumption plan scales out automatically',
          'Latency: opt-out events are applied within minutes via the compliance-priority Event Hubs consumer group',
          'Reliability: webhook handling is idempotent (event_id dedup) since providers frequently retry deliveries',
          'Security/Privacy: consent state is written to an auditable table in Azure Database for PostgreSQL, not just a marketing flag',
        ],
        example: 'A retail brand\'s promotional SMS blast generates an unsubscribe spike within 5 minutes. Because the Azure Function webhook receiver routes opt-out events onto the compliance-priority Event Hubs consumer group, every affected contact is suppressed from the next wave of the same campaign before it sends — avoiding a compliance incident and an estimated $40K in regulatory exposure.',
      },
      {
        slug: 'call-center', name: 'Call Center',
        tagline: 'Voice interactions through the contact center — call metadata, IVR selections, agent notes, and outcomes — usually sourced from a CCaaS platform.',
        hldCaption: 'CCaaS export &rarr; Azure Blob Storage &rarr; .NET Core microservices on Azure.',
        hld: [
          { label: 'Touchpoint', name: 'Call Center', detail: 'Inbound/outbound voice via CCaaS', origin: true },
          { label: 'Ingestion', name: '.NET Core Batch Connector', detail: 'CCaaS export &rarr; Azure Blob Storage &rarr; Ingestion API' },
          { label: 'Processing', name: '.NET Core Batch Worker', detail: 'Azure Functions — redaction, transcript enrichment' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Call metadata + linked transcripts' },
          { label: 'Intelligence', name: '.NET Core AI &amp; Insights API', detail: 'Azure OpenAI — topic modeling, CSAT prediction' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'CRM case updates, agent coaching (Reverse ETL)' },
        ],
        business: [
          'The highest-cost-per-interaction channel — connecting it to CXOS ties call outcomes to lifetime value and churn risk',
          'Enables agent coaching and QA automation at scale instead of manual sampling',
          'Owned by Contact Center Operations, often co-funded by CX Analytics',
        ],
        technical: 'CCaaS platforms (Genesys, NICE, Five9) export call metadata and recordings to Azure Blob Storage on a schedule; a timer-triggered .NET Core Azure Function picks up new files and calls the Ingestion API through <code>Cxos.Ingestion.Client</code> — the same contract as every real-time touchpoint. Recordings are transcribed and redacted (PCI/PII) by a .NET Core batch worker before the transcript is attached to the call record. Caller ID or an IVR-entered account number is matched to a known customer profile via the Identity API.',
        chipsLabel: 'Typical Events', chips: ['call_started', 'ivr_selection', 'call_transferred', 'call_ended', 'csat_recorded'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "call_ended",
  "event_id": "a4d1c9e2-5b8f-4a3e-9c1d-7e2f8a0b4d56",
  "timestamp": "2026-08-01T11:03:12Z",
  "user_id": "cust_004821",
  "context": {
    "channel": "call_center",
    "agent_id": "agt_302",
    "queue": "billing"
  },
  "properties": {
    "duration_seconds": 342,
    "disposition": "resolved",
    "csat_score": 4
  }
}`,
        integration: [
          'Azure Blob Storage — CCaaS export landing zone',
          'Timer-triggered Azure Function (.NET Core) — batch pickup and Ingestion API call',
          '<code>Cxos.Ingestion.Client</code> NuGet package — shared ingestion contract',
          'Azure OpenAI Service — transcript topic/sentiment modeling',
          'Reverse ETL — CRM case sync via the Activation API',
        ],
        nfr: [
          'Scale: call volume spikes correlate with outages/incidents — the batch pipeline is decoupled from real-time load',
          'Latency: most call analytics run as scheduled batch (hourly); escalation-risk flags use a near-real-time path where the CCaaS platform supports it',
          'Reliability: the batch worker supports reprocessing/backfill when the redaction model is updated',
          'Security/Privacy: PCI redaction runs before the transcript reaches the Data Lakehouse; the Blob landing zone uses short retention + Azure Key Vault-managed encryption',
        ],
        example: 'A financial services contact center exports call metadata and recordings to Azure Blob Storage nightly. The .NET Core batch worker redacts PCI data and calls the AI &amp; Insights API, backed by Azure OpenAI Service, which surfaces a rising cluster of "fee dispute" calls tied to a recent statement change — reaching the product and billing teams within a day instead of the next quarterly QA review, and cutting related call volume by 22% within two weeks.',
      },
      {
        slug: 'social-media', name: 'Social Media',
        tagline: 'Public and owned social interactions — mentions, comments, DMs, and ad engagement — pulled from platform APIs.',
        hldCaption: 'Platform API polling &rarr; .NET Core microservices on Azure.',
        hld: [
          { label: 'Touchpoint', name: 'Social Media', detail: 'Mentions, comments, DMs, ad engagement', origin: true },
          { label: 'Ingestion', name: '.NET Core Connector Function', detail: 'Platform API polling &rarr; Cxos.Ingestion.Client' },
          { label: 'Processing', name: '.NET Core Stream Worker', detail: 'Normalization across platforms' },
          { label: 'Foundation', name: 'Data Lakehouse', detail: 'Public + owned social interactions' },
          { label: 'Intelligence', name: '.NET Core AI &amp; Insights API', detail: 'Azure OpenAI — sentiment, share-of-voice' },
          { label: 'Activation', name: '.NET Core Activation API', detail: 'Ad audience sync (Reverse ETL)' },
        ],
        business: [
          'Both a brand-perception channel and a paid-media performance channel — unifying it lets the business connect sentiment to actual purchase behavior',
          'Powers audience sync back to ad platforms for retargeting and lookalike modeling',
          'Owned by Social/Brand Marketing and Paid Media teams',
        ],
        technical: 'A timer-triggered .NET Core Azure Function polls each platform\'s API (Meta, X, Instagram, TikTok, LinkedIn) on its own schedule, since most platforms don\'t push webhooks for every event type; each platform has a thin connector built on the shared <code>Cxos.Ingestion.Client</code> package. Ad-engagement events carry a clickthrough ID that can be matched to a session/profile; organic mentions/comments usually can\'t be linked to a known customer unless the user has an explicit account link (login-with-social). Azure Key Vault stores each platform\'s API credentials, with token refresh handled inside the connector function.',
        chipsLabel: 'Typical Events', chips: ['mention_received', 'comment_posted', 'dm_received', 'ad_clicked', 'follower_gained'],
        artifactTitle: 'Sample Event Payload',
        artifactCode: `{
  "event": "ad_clicked",
  "event_id": "5f0c3ab1-4d7e-4f9a-8c3b-9e1a2d5f6081",
  "timestamp": "2026-08-01T13:12:09Z",
  "anonymous_id": "a1b2c3d4",
  "context": {
    "channel": "social",
    "platform": "meta",
    "campaign_id": "camp_9931"
  },
  "properties": {
    "ad_id": "ad_2201",
    "creative": "summer_sale_v2",
    "click_id": "fbclid_88x2"
  }
}`,
        integration: [
          'Timer-triggered Azure Functions (.NET Core) — one connector per platform',
          '<code>Cxos.Ingestion.Client</code> NuGet package — shared ingestion contract',
          'Azure Key Vault — platform API credential storage',
          'Reverse ETL (.NET Core Activation API) — audience sync back to ad platforms',
          'Azure OpenAI Service — sentiment and share-of-voice analysis',
        ],
        nfr: [
          'Scale: platform API rate limits — not data volume — are usually the binding constraint; each connector function throttles independently',
          'Latency: brand-safety/crisis mentions run on a tighter polling interval; general engagement polls hourly',
          'Reliability: connector functions handle platform API schema changes without affecting other platforms\' pipelines',
          'Security/Privacy: public content moderation and takedown-request handling before long-term storage',
        ],
        example: 'A consumer brand\'s Meta connector function feeds <code>ad_clicked</code> events into the Ingestion API with a clickthrough ID. When a clicked-through visitor completes a purchase within 7 days, the Activation API closes the loop back to Meta via Reverse ETL, improving return-on-ad-spend attribution and letting the media team shift 15% of budget toward the better-performing creative the following month.',
      },
    ],
  },
];

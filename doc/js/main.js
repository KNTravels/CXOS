// CXOS Reference Documentation — shared behavior

document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  // Tap-to-open dropdowns on touch/mobile (click toggles instead of hover)
  document.querySelectorAll(".nav-list > li").forEach(function (li) {
    var link = li.querySelector(":scope > a");
    var dropdown = li.querySelector(".dropdown");
    if (!link || !dropdown) return;
    link.addEventListener("click", function (e) {
      if (window.matchMedia("(max-width: 860px)").matches) {
        e.preventDefault();
        var wasOpen = li.classList.contains("open");
        document.querySelectorAll(".nav-list > li.open").forEach(function (o) { o.classList.remove("open"); });
        if (!wasOpen) li.classList.add("open");
      }
    });
  });

  // Highlight current top-level nav item based on page path
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-list > li[data-page]").forEach(function (li) {
    if (li.getAttribute("data-page") === path) li.classList.add("active");
  });

  // Highlight active side-nav link on module pages based on scroll position
  var sideLinks = document.querySelectorAll(".side-nav a[href^='#']");
  var sections = Array.prototype.map.call(sideLinks, function (a) {
    return document.querySelector(a.getAttribute("href"));
  }).filter(Boolean);

  // Clicking a side-nav link highlights it immediately, rather than waiting
  // for the post-scroll position math to agree (which can land on the wrong
  // section boundary on long pages with many short sections, e.g. the BRD).
  var suppressScrollHighlight = false;
  sideLinks.forEach(function (a) {
    a.addEventListener("click", function () {
      sideLinks.forEach(function (l) { l.classList.remove("active"); });
      a.classList.add("active");
      suppressScrollHighlight = true;
      window.clearTimeout(a._suppressTimer);
      a._suppressTimer = window.setTimeout(function () { suppressScrollHighlight = false; }, 700);
    });
  });

  function updateActiveSideLink() {
    if (suppressScrollHighlight) return;
    var scrollPos = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec;
    });
    sideLinks.forEach(function (a) {
      a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id);
    });
  }
  if (sections.length) {
    window.addEventListener("scroll", updateActiveSideLink, { passive: true });
    updateActiveSideLink();
  }

  // Lightbox for architecture diagrams (there can be more than one on a page)
  var diagramImgs = document.querySelectorAll(".diagram-frame img");
  var lightbox = document.querySelector(".lightbox");
  if (diagramImgs.length && lightbox) {
    var lightboxImg = lightbox.querySelector("img");
    diagramImgs.forEach(function (diagramImg) {
      diagramImg.addEventListener("click", function () {
        lightboxImg.src = diagramImg.src;
        lightbox.classList.add("open");
      });
    });
    lightbox.addEventListener("click", function () {
      lightbox.classList.remove("open");
    });
  }

  // Service Map detail modal (index.html only — guarded, since main.js loads on every page)
  initServiceModal();
});

// Content for the Service Map modal — one entry per data-service value on a .service-db-card
// (index.html "Full Application Service Map" for the 6 verticals + "Service Map" for the 5
// horizontals). Namespaces/DB choices mirror pages/brd.html's DDD microservices catalog for the
// 8 vertical bounded contexts; the 5 horizontal entries (observability, security,
// developer-platform, multi-tenancy, administration) don't exist in brd.html yet since
// horizontals aren't one of the six BR-1..BR-6 stages — see CLAUDE.md.
var SERVICE_DETAILS = {
  "ingestion": {
    icon: "📥", tag: "Stage 2 · Supporting Subdomain", name: "Ingestion",
    ns: "Cxos.Ingestion.Api", cq: "must", cqLabel: "Command",
    overview: "The single entry point every SDK, connector, and business-system integration in Data Sources publishes events through — validates, enriches, checks consent, and hands off to the stream.",
    dbs: [{ color: "#d92d20", icon: "⚡", label: "Redis (cache only, no system-of-record DB)" }],
    layers: [
      ["Domain", "Cxos.Ingestion.Domain", "Defines the versioned event contract (Event, EventSchema, ConsentBasis) published as the Cxos.Ingestion.Client NuGet package."],
      ["Application", "Cxos.Ingestion.Application", "Orchestrates Event Collection → Validation → Enrichment → Consent Enforcement → Queue & Retry."],
      ["Infrastructure", "Cxos.Ingestion.Infrastructure", "Azure API Management · Azure Event Hubs publisher · Azure Cache for Redis · Azure Key Vault."],
      ["Api", "Cxos.Ingestion.Api", "Deployed entry point called by every Cxos.Connectors.* service and client SDK."]
    ],
    integration: [
      "Every Cxos.Connectors.* service and client SDK publishes events here first",
      "Validates schema compatibility via Cxos.Processing.SchemaGovernance.Api on every write",
      "Publishes accepted events to Azure Event Hubs, consumed by Cxos.Processing.Infrastructure",
      "Consent decisions are logged to Audit Logs (Cxos.Foundation.Infrastructure)"
    ]
  },
  "event-processing": {
    icon: "⚙️", tag: "Stage 3 · Supporting Subdomain", name: "Event Processing",
    ns: "Cxos.Processing.Api", cq: "must", cqLabel: "Command",
    overview: "Transforms the raw event stream into deduplicated, identity-stitched, and modeled data — both in real time (Stream Worker) and on a schedule (Batch Worker via dbt).",
    dbs: [
      { color: "#2e9e5b", icon: "🧊", label: "ADLS Gen2 (Iceberg) — curated/marts output" },
      { color: "#12a4a4", icon: "🌐", label: "Cosmos DB Table API — stream checkpoints" }
    ],
    layers: [
      ["Domain", "Cxos.Processing.Domain", "Entities/rules for deduplication, identity stitching, sessionization, and rollup definitions."],
      ["Application", "Cxos.Processing.Application", "Orchestrates the Stream Worker (real-time) and Batch Worker (dbt-driven) use cases."],
      ["Infrastructure", "Cxos.Processing.Infrastructure", "Azure Event Hubs consumer · dbt CLI (Azure Container Apps Jobs) · ADLS Gen2 writer · Cosmos DB Table API checkpoints."],
      ["Api", "Cxos.Processing.Api", "Exposes job status/backfill triggers; writes curated/marts tables."]
    ],
    integration: [
      "Consumes accepted events from Cxos.Ingestion.Api via Azure Event Hubs",
      "Validates event/table compatibility via Cxos.Processing.SchemaGovernance.Api",
      "Writes curated/marts tables consumed by Cxos.Foundation.Api and every Cxos.Intelligence.* service",
      "Exposes job status/backfill triggers to Cxos.Operations.Api"
    ]
  },
  "schema-governance": {
    icon: "📋", tag: "Stage 3 · Supporting Subdomain", name: "Schema Governance",
    ns: "Cxos.Processing.SchemaGovernance.Api", cq: "could", cqLabel: "Query",
    overview: "The authoritative registry of every event and table schema — compatibility rules, versioning, and classification requirements every write must pass.",
    dbs: [{ color: "#336791", icon: "🐘", label: "PostgreSQL — versions, rules, ownership (relational)" }],
    layers: [
      ["Domain", "...SchemaGovernance.Domain", "Compatibility rules, classification requirements, versioning policy."],
      ["Application", "...SchemaGovernance.Application", "Validates schema-change requests submitted through the Workflow Engine."],
      ["Infrastructure", "...SchemaGovernance.Infrastructure", "Azure Database for PostgreSQL."],
      ["Api", "...SchemaGovernance.Api", "Called by Cxos.Ingestion.Application and Cxos.Processing.Application on every write."]
    ],
    integration: [
      "Called by Cxos.Ingestion.Application to validate every incoming event",
      "Called by Cxos.Processing.Application to validate table compatibility",
      "Schema-change approvals flow through Cxos.Operations.Api's Workflow Engine",
      "Approved changes propagate classification tags into Cxos.Foundation.Domain"
    ]
  },
  "data-foundation": {
    icon: "🏛️", tag: "Stage 4 · Supporting Subdomain", name: "Data Foundation & Governance",
    ns: "Cxos.Foundation.Api", cq: "could", cqLabel: "Query",
    overview: "The governed lakehouse — catalog, lineage, classification, retention, and access policy for every table CXOS stores.",
    dbs: [
      { color: "#2e9e5b", icon: "🧊", label: "ADLS Gen2 (Iceberg) — the lakehouse itself" },
      { color: "#336791", icon: "🐘", label: "PostgreSQL — retention policy & deletion tracking" }
    ],
    layers: [
      ["Domain", "Cxos.Foundation.Domain", "LakehouseTable, ClassificationTag, RetentionPolicy, AccessPolicy, ConsentBasis entities."],
      ["Application", "Cxos.Foundation.Application", "Orchestrates catalog registration, lineage capture, classification propagation, policy evaluation, lifecycle actions."],
      ["Infrastructure", "Cxos.Foundation.Infrastructure", "ADLS Gen2 · Azure Purview · PostgreSQL · write-once Audit Log container · Azure AD/ADFS · Key Vault."],
      ["Api", "Cxos.Foundation.Api", "Serves Catalog/Lineage/Dictionary/Policy lookups; receives table registrations."]
    ],
    integration: [
      "Receives table registrations from Cxos.Processing.Api on every write",
      "Serves Catalog/Lineage/Dictionary/Policy lookups to every Cxos.Intelligence.* service",
      "Serves policy lookups to Cxos.Activation.Api before every dispatch",
      "Lifecycle Management jobs report completed retention/erasure actions to Cxos.Operations.Api"
    ]
  },
  "customer-profile": {
    icon: "🦪", tag: "Stage 5 · Core Domain", name: "Customer Profile",
    ns: "Cxos.Profile.Api", cq: "could", cqLabel: "Query",
    overview: "The platform's single governed view of a customer — assembled from every source, resolved via the identity graph, and read by everything downstream. One of the platform's two differentiating capabilities.",
    dbs: [
      { color: "#12a4a4", icon: "🌐", label: "Cosmos DB Core API — profile documents" },
      { color: "#12a4a4", icon: "🌐", label: "Cosmos DB Gremlin API — identity graph" },
      { color: "#d92d20", icon: "⚡", label: "Redis — hot-key cache" }
    ],
    layers: [
      ["Domain", "Cxos.Profile.Domain", "CustomerProfile, IdentityGraph, Relationship, ConsentState entities."],
      ["Application", "Cxos.Profile.Application", "Orchestrates profile assembly from Cxos.Foundation.Api's curated zone and identity-resolution graph traversal."],
      ["Infrastructure", "Cxos.Profile.Infrastructure", "Cosmos DB Core API (profile documents) · Cosmos DB Gremlin API (identity graph) · Redis (hot-key cache)."],
      ["Api", "Cxos.Profile.Api", "Serves reads to Cxos.Activation.Api and every internal consumer; receives propensity/anomaly writes."]
    ],
    integration: [
      "Assembled from Cxos.Foundation.Api's curated zone via Cxos.Profile.Application",
      "Serves reads to Cxos.Activation.Api before every activation dispatch",
      "Receives propensity/anomaly-score writes from Cxos.Intelligence.Api",
      "The single read path — no consumer queries the lakehouse directly for profile data"
    ]
  },
  "analytics-ai": {
    icon: "🧠", tag: "Stage 5 · Supporting Subdomain", name: "Analytics & AI Insights",
    ns: "Cxos.Intelligence.Api", cq: "should", cqLabel: "Both",
    overview: "The Semantic Layer, query engine, and AI/ML capabilities — from governed metric definitions to churn prediction and the natural-language copilot.",
    dbs: [
      { color: "#336791", icon: "🐘", label: "PostgreSQL — semantic layer definitions" },
      { color: "#d97706", icon: "📈", label: "Data Explorer — anomaly/scoring time series" },
      { color: "#d92d20", icon: "⚡", label: "Redis — query-result cache" }
    ],
    layers: [
      ["Domain", "Cxos.Intelligence.Domain", "Metric, Segment, PropensityScore, AnomalyRecord entities."],
      ["Application", "Cxos.Intelligence.Application", "Orchestrates the Semantic Layer, Query Optimizer, and model training/scoring workflows."],
      ["Infrastructure", "Cxos.Intelligence.Infrastructure", "DataFusion engine · PostgreSQL · Redis · Azure ML · Azure OpenAI · Data Explorer."],
      ["Api", "Cxos.Intelligence.Api", "Serves query/analytics reads to BI tools and Cxos.Activation.Api; writes propensity/anomaly results."]
    ],
    integration: [
      "Reads marts tables and metadata from Cxos.Foundation.Api",
      "Serves segment/propensity reads to Cxos.Activation.Api for audience resolution",
      "Writes propensity/anomaly results to Cxos.Profile.Api and Cxos.Operations.Api",
      "DataFusion attaches directly to Iceberg tables — no separate copy of the data"
    ]
  },
  "operational-services": {
    icon: "🛠️", tag: "Stage 5 · Supporting Subdomain", name: "Operational Services",
    ns: "Cxos.Operations.Api", cq: "should", cqLabel: "Both",
    overview: "Workflow orchestration, alert routing, data-quality scorecards, and usage/billing metering — the operational nervous system every other service reports into.",
    dbs: [
      { color: "#336791", icon: "🐘", label: "PostgreSQL — workflow state machine + billing ledger" },
      { color: "#12a4a4", icon: "🌐", label: "Cosmos DB Table API — alert history/dedup" },
      { color: "#d97706", icon: "📈", label: "Data Explorer — quality scorecards" }
    ],
    layers: [
      ["Domain", "Cxos.Operations.Domain", "Workflow, Alert, QualityCheck, UsageRecord entities."],
      ["Application", "Cxos.Operations.Application", "Orchestrates the Workflow Engine state machine, alert routing, quality scorecards, usage metering."],
      ["Infrastructure", "Cxos.Operations.Infrastructure", "PostgreSQL · Cosmos DB Table API · Data Explorer · Azure Service Bus · SendGrid/Slack/PagerDuty."],
      ["Api", "Cxos.Operations.Api", "Receives signals from every other Cxos.*.Application layer; serves status/usage queries."]
    ],
    integration: [
      "Receives quality/anomaly signals from every other Cxos.*.Application layer",
      "Schema-change approvals from Cxos.Processing.SchemaGovernance.Application flow through its Workflow Engine",
      "Routes alerts externally via SendGrid/Slack/PagerDuty once a severity threshold is crossed",
      "Serves usage/billing queries to Finance and Platform Engineering"
    ]
  },
  "activation": {
    icon: "📡", tag: "Stage 6 · Core Domain", name: "Activation",
    ns: "Cxos.Activation.Api", cq: "must", cqLabel: "Command",
    overview: "The second differentiating capability: turns a trigger, segment, or propensity score into a real dispatch across every destination — email, SMS, ads, exports, and Reverse ETL.",
    dbs: [
      { color: "#12a4a4", icon: "🌐", label: "Cosmos DB Core API — dispatch/delivery-status log" },
      { color: "#d92d20", icon: "⚡", label: "Redis — frequency-cap counters" }
    ],
    layers: [
      ["Domain", "Cxos.Activation.Domain", "ActivationTrigger, Destination, DispatchPolicy entities."],
      ["Application", "Cxos.Activation.Application", "Orchestrates consent/entitlement checks against Cxos.Profile.Api and segment/propensity resolution against Cxos.Intelligence.Api."],
      ["Infrastructure", "Cxos.Activation.Infrastructure", "Azure Service Bus publisher · Azure API Management · Cosmos DB · Redis."],
      ["Api", "Cxos.Activation.Api", "Entry point for every internal trigger; dispatches to every Cxos.Connectors.* outbound service."]
    ],
    integration: [
      "Checks consent/entitlement against Cxos.Profile.Api before every dispatch",
      "Resolves segments/propensity thresholds against Cxos.Intelligence.Api",
      "Dispatches to every Cxos.Connectors.* outbound service via Azure Service Bus",
      "Real-time triggers fire within 5 minutes of the qualifying event (BR-6.2)"
    ]
  },
  "observability": {
    icon: "📈", tag: "Horizontal · Platform Capability", name: "Observability",
    ns: "Cxos.Observability.Api", cq: "should", cqLabel: "Both",
    overview: "The unified logging, metrics, and distributed-tracing layer wired into every .NET Core microservice on the platform — the ability to follow one request across every hop.",
    dbs: [{ color: "#d97706", icon: "📈", label: "Data Explorer (Kusto) — logs, metrics, traces" }],
    layers: [
      ["Domain", "Cxos.Observability.Domain", "TraceSpan, LogEntry, MetricPoint, CorrelationId entities."],
      ["Application", "Cxos.Observability.Application", "Correlates Application Insights telemetry from every service into a single per-request trace."],
      ["Infrastructure", "Cxos.Observability.Infrastructure", "Application Insights SDK (in every service) · Azure Monitor · Azure Data Explorer."],
      ["Api", "Cxos.Observability.Api", "Serves trace/log queries to engineers debugging a specific correlation ID."]
    ],
    integration: [
      "Every Cxos.*.Api service emits Application Insights telemetry carrying the same correlation ID across hops",
      "Azure Monitor provides the aggregate/ops dashboard view; this service provides the per-request drill-down",
      "Data-quality and anomaly alerts from Cxos.Operations.Api cross-reference trace data during investigations",
      "No service is exempt — observability is wired in at the shared .NET Core service template level"
    ]
  },
  "security": {
    icon: "🔒", tag: "Horizontal · Platform Capability", name: "Security",
    ns: "Cxos.Security.Api", cq: "should", cqLabel: "Both",
    overview: "Identity federation, secrets management, and threat detection spanning every service — the enforcement layer Cxos.Foundation.Api's policies are actually built on.",
    dbs: [],
    dbNote: "No CXOS-owned database — delegates to Azure Key Vault (secrets) and Azure AD / ADFS (identity).",
    layers: [
      ["Domain", "Cxos.Security.Domain", "Principal, Role, ThreatSignal entities."],
      ["Application", "Cxos.Security.Application", "Evaluates authentication/authorization decisions and threat-detection rules."],
      ["Infrastructure", "Cxos.Security.Infrastructure", "Azure Key Vault · Azure AD (Entra ID) · ADFS · Azure AD B2C."],
      ["Api", "Cxos.Security.Api", "Issues/validates tokens; every other Cxos.*.Api calls it via shared middleware on every request."]
    ],
    integration: [
      "Every Cxos.*.Api validates caller identity through this service's shared authentication middleware",
      "Cxos.Foundation.Api's Access Control (RBAC/ABAC) policies are evaluated using roles this service resolves",
      "ADFS federates on-prem enterprise AD for internal/employee SSO; Azure AD B2C stays separate for customers",
      "Key rotation and credential storage for every Cxos.Connectors.* service flows through here"
    ]
  },
  "developer-platform": {
    icon: "🔧", tag: "Horizontal · Platform Capability", name: "Developer Platform",
    ns: "Cxos.DevPlatform.Api", cq: "could", cqLabel: "Query",
    overview: "The self-service surface for engineers integrating with CXOS — API catalog, SDK docs, and sandbox environments to build and test against before going to production.",
    dbs: [{ color: "#12a4a4", icon: "🌐", label: "Cosmos DB — API catalog & sandbox tenant state" }],
    layers: [
      ["Domain", "Cxos.DevPlatform.Domain", "ApiListing, SdkVersion, SandboxTenant entities."],
      ["Application", "Cxos.DevPlatform.Application", "Orchestrates API catalog publishing and sandbox provisioning/teardown."],
      ["Infrastructure", "Cxos.DevPlatform.Infrastructure", "Cosmos DB (catalog documents) · Azure API Management (sandbox gateway)."],
      ["Api", "Cxos.DevPlatform.Api", "Serves the catalog/docs site; provisions sandbox credentials on request."]
    ],
    integration: [
      "Catalogs every Cxos.*.Api and Cxos.Connectors.* service's published contract",
      "Sandbox environments proxy to non-production instances of the same Cxos.*.Api services",
      "New connector onboarding (Cxos.Connectors.Generic) is documented and discoverable here first",
      "Feeds the same OpenAPI contract that Cxos.Ingestion.Client's SDKs are generated from"
    ]
  },
  "multi-tenancy": {
    icon: "🏢", tag: "Horizontal · Platform Capability", name: "Multi-Tenancy",
    ns: "Cxos.Tenancy.Api", cq: "should", cqLabel: "Both",
    overview: "Tenant registry, isolation configuration, and quota/limit enforcement — the reason one tenant's traffic can never see or starve another's.",
    dbs: [{ color: "#336791", icon: "🐘", label: "PostgreSQL — tenant registry & quota tables" }],
    layers: [
      ["Domain", "Cxos.Tenancy.Domain", "Tenant, IsolationPolicy, QuotaLimit entities."],
      ["Application", "Cxos.Tenancy.Application", "Orchestrates tenant provisioning, quota enforcement, and isolation-policy checks."],
      ["Infrastructure", "Cxos.Tenancy.Infrastructure", "Azure Database for PostgreSQL."],
      ["Api", "Cxos.Tenancy.Api", "Resolves tenant context for every request; enforces quota limits."]
    ],
    integration: [
      "Every Cxos.*.Api resolves tenant_id from this service before processing a request",
      "Quota limits enforced here are what Cxos.Operations.Api's Usage & Billing meters against",
      "Cosmos DB, PostgreSQL, and Redis stores across the platform are partitioned by the tenant boundary this service defines",
      "A tenant's data is provably isolated at every layer, not just access-controlled"
    ]
  },
  "administration": {
    icon: "⚙️", tag: "Horizontal · Platform Capability", name: "Administration",
    ns: "Cxos.Admin.Api", cq: "should", cqLabel: "Both",
    overview: "User, role, and platform-settings management, plus the audit trail of every administrative action taken.",
    dbs: [
      { color: "#336791", icon: "🐘", label: "PostgreSQL — users, roles, settings" },
      { color: "#2e9e5b", icon: "🧊", label: "ADLS Gen2 — audit logs (write-once)" }
    ],
    layers: [
      ["Domain", "Cxos.Admin.Domain", "User, Role, Setting, AdminAuditEntry entities."],
      ["Application", "Cxos.Admin.Application", "Orchestrates user/role management and platform-settings changes."],
      ["Infrastructure", "Cxos.Admin.Infrastructure", "PostgreSQL (users/roles/settings) · ADLS Gen2 write-once container (shared with Cxos.Foundation.Infrastructure)."],
      ["Api", "Cxos.Admin.Api", "Serves the admin console; every settings change writes an audit entry."]
    ],
    integration: [
      "Role changes made here are what Cxos.Security.Api resolves during authorization checks",
      "Every administrative action writes an immutable entry to the same Audit Logs store Cxos.Foundation.Infrastructure uses",
      "Platform settings (feature flags, rate limits) are read by every Cxos.*.Api at startup/refresh",
      "Administration itself is entitlement-scoped through Cxos.Security.Api — admins don't bypass access control"
    ]
  }
};

function initServiceModal() {
  var backdrop = document.getElementById("serviceModalBackdrop");
  if (!backdrop) return; // modal markup only exists on index.html

  var iconEl = document.getElementById("serviceModalIcon");
  var tagEl = document.getElementById("serviceModalTag");
  var titleEl = document.getElementById("serviceModalTitle");
  var nsEl = document.getElementById("serviceModalNs");
  var cqEl = document.getElementById("serviceModalCq");
  var overviewEl = document.getElementById("serviceModalOverview");
  var dbsEl = document.getElementById("serviceModalDbs");
  var layersEl = document.getElementById("serviceModalLayers");
  var integrationEl = document.getElementById("serviceModalIntegration");
  var closeBtn = document.getElementById("serviceModalClose");
  var lastFocused = null;

  function openModal(data, cardAccent) {
    iconEl.textContent = data.icon;
    iconEl.style.background = cardAccent || "";
    tagEl.textContent = data.tag;
    titleEl.textContent = data.name;
    nsEl.textContent = data.ns;
    cqEl.textContent = data.cqLabel;
    cqEl.className = "priority " + data.cq;
    overviewEl.textContent = data.overview;

    dbsEl.innerHTML = "";
    if (data.dbs && data.dbs.length) {
      data.dbs.forEach(function (db) {
        var pill = document.createElement("span");
        pill.className = "db-pill";
        pill.style.setProperty("--db-color", db.color);
        pill.innerHTML = "<span class=\"pip\">" + db.icon + "</span>" + db.label;
        dbsEl.appendChild(pill);
      });
    } else if (data.dbNote) {
      var note = document.createElement("span");
      note.className = "tag";
      note.textContent = data.dbNote;
      dbsEl.appendChild(note);
    }

    layersEl.innerHTML = "";
    data.layers.forEach(function (layer) {
      var row = document.createElement("div");
      row.className = "service-modal-layer";
      row.innerHTML = "<div class=\"layer-name\">" + layer[0] + "</div>" +
        "<div class=\"layer-body\"><code>" + layer[1] + "</code><p>" + layer[2] + "</p></div>";
      layersEl.appendChild(row);
    });

    integrationEl.innerHTML = "";
    data.integration.forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      integrationEl.appendChild(li);
    });

    lastFocused = document.activeElement;
    backdrop.classList.add("open");
    closeBtn.focus();
  }

  function closeModal() {
    backdrop.classList.remove("open");
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  document.querySelectorAll(".service-db-card[data-service]").forEach(function (card) {
    var data = SERVICE_DETAILS[card.getAttribute("data-service")];
    if (!data) return;
    var accent = card.style.getPropertyValue("--card-accent");
    card.addEventListener("click", function () { openModal(data, accent); });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(data, accent);
      }
    });
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", function (e) {
    if (e.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && backdrop.classList.contains("open")) closeModal();
  });
}

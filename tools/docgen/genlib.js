const fs = require('fs');
const path = require('path');

const MODULES = {
  'data-sources': { title: 'Data Sources', accent: '#6a4fc2', num: 1 },
  'ingestion-layer': { title: 'Ingestion Layer', accent: '#2b7fd6', num: 2 },
  'transformation-processing': { title: 'Transformation &amp; Processing', accent: '#0f9b8e', num: 3 },
  'unified-data-foundation': { title: 'Unified Data Foundation', accent: '#2e9e5b', num: 4 },
  'intelligence-services': { title: 'Intelligence &amp; Services', accent: '#d9822b', num: 5 },
  'destinations-activation': { title: 'Destinations &amp; Activation', accent: '#c23b6d', num: 6 },
};

function navHtml(activeModuleFile) {
  const items = [
    { file: 'data-sources.html', num: '1', label: 'Data Sources', anchors: [
      ['customer-touchpoints', 'Customer Touchpoints', 'Web, mobile, kiosk, chat, call center'],
      ['business-systems', 'Business Systems', 'CRM, Commerce, Support, Marketing, ERP'],
      ['files-integrations', 'Files &amp; Integrations', 'CSV/JSON/Parquet, Databases, APIs'],
    ]},
    { file: 'ingestion-layer.html', num: '2', label: 'Ingestion Layer', anchors: [
      ['client-sdks', 'Client SDKs', 'Web, Mobile, Server SDK'],
      ['edge-network', 'Edge Network', 'Global points of presence'],
      ['streaming-ingestion', 'Streaming Ingestion', 'Redpanda (Kafka compatible)'],
      ['connectors', 'Connectors', 'Pre-built &amp; custom connectors'],
      ['protocols-supported', 'Protocols Supported', 'HTTP, gRPC, Webhooks, Batch'],
    ]},
    { file: 'transformation-processing.html', num: '3', label: 'Transformation &amp; Processing', anchors: [
      ['stream-processing', 'Stream Processing', 'Real-time — Bytewax / Quix Streams'],
      ['batch-processing', 'Batch Processing', 'Near-real-time — Spark / Python Jobs'],
      ['event-schema-registry', 'Event Schema &amp; Registry', 'Versioning, compatibility, governance'],
    ]},
    { file: 'unified-data-foundation.html', num: '4', label: 'Unified Data Foundation', anchors: [
      ['data-lakehouse', 'CXOS Data Lakehouse', 'Apache Iceberg + S3-compatible storage'],
      ['metadata-layer', 'Metadata Layer', 'Catalog, lineage, dictionary, entitlements'],
      ['governance-security', 'Governance &amp; Security', 'Access control, privacy, audit, encryption'],
    ]},
    { file: 'intelligence-services.html', num: '5', label: 'Intelligence &amp; Services', anchors: [
      ['identity-profile', 'Identity &amp; Profile Service', 'Unified profile, identity graph'],
      ['query-analytics-engine', 'Query &amp; Analytics Engine', 'DataFusion SQL engine, semantic layer'],
      ['ai-insights', 'AI &amp; Insights', 'Anomaly detection, propensity, copilot'],
      ['operational-services', 'Operational Services', 'Workflow, alerts, data quality, billing'],
    ]},
    { file: 'destinations-activation.html', num: '6', label: 'Destinations &amp; Activation', anchors: [
      ['real-time-activation', 'Real-time Activation', 'Email, SMS/Push, Ad Platforms'],
      ['batch-file-exports', 'Batch / File Exports', 'S3/GCS/Azure, SFTP, Warehouses'],
      ['apis-webhooks', 'APIs &amp; Webhooks', 'Journeys, automation, integrations'],
      ['reverse-etl-cdp-sync', 'Reverse ETL / CDP Sync', 'Sync back to CRM, Support, Marketing'],
    ]},
  ];

  const lis = items.map(it => {
    const active = it.file === activeModuleFile ? ' class="active"' : '';
    const dropdown = it.anchors.map(([id, label, desc]) =>
      `          <a href="../${it.file}#${id}">${label}<span class="desc">${desc}</span></a>`
    ).join('\n');
    return `      <li data-page="${it.file}"${active}>
        <a href="../${it.file}">${it.num} · ${it.label} <span class="nav-caret">&#9662;</span></a>
        <div class="dropdown">
${dropdown}
        </div>
      </li>`;
  }).join('\n');

  return `      <li data-page="index.html"><a href="../../index.html">Overview</a></li>
      <li data-page="brd.html"><a href="../brd.html">BRD</a></li>
${lis}`;
}

function hldNodeHtml(node, isOrigin, accent) {
  const cls = isOrigin ? ` origin" style="--card-accent:${accent}` : '';
  return `      <div class="hld-node${isOrigin ? cls : ''}"><div class="stage-label">${node.label}</div><div class="stage-name">${node.name}</div><div class="stage-detail">${node.detail}</div></div>`;
}

// The six-stage pipeline shown on every page. Each item overrides its own
// module's node with specific content; the other five stay generic/consistent.
const PIPELINE = [
  { key: 'data-sources', label: 'Data Sources', name: 'Customer &amp; Business Data', detail: 'Touchpoints, business systems, files' },
  { key: 'ingestion-layer', label: 'Ingestion', name: '.NET Core Ingestion API', detail: 'Cxos.Ingestion.Client &rarr; Azure API Management' },
  { key: 'transformation-processing', label: 'Processing', name: '.NET Core Stream/Batch Worker', detail: 'Azure Event Hubs / Azure Functions' },
  { key: 'unified-data-foundation', label: 'Foundation', name: 'Data Lakehouse', detail: 'Azure Data Lake Storage Gen2' },
  { key: 'intelligence-services', label: 'Intelligence', name: '.NET Core Analytics/AI API', detail: 'Azure DB for PostgreSQL + Azure OpenAI' },
  { key: 'destinations-activation', label: 'Activation', name: '.NET Core Activation API', detail: 'Azure Service Bus &rarr; downstream destinations' },
];

function buildHld(moduleFile, hldSelf) {
  return PIPELINE.map(stage => {
    if (stage.key === moduleFile) {
      return { label: hldSelf.label || stage.label, name: hldSelf.name, detail: hldSelf.detail, origin: true };
    }
    return { label: stage.label, name: stage.name, detail: stage.detail, origin: false };
  });
}

function renderItem(moduleFile, submoduleAnchor, submoduleName, item) {
  const mod = MODULES[moduleFile];
  const accent = mod.accent;
  const nav = navHtml(moduleFile + '.html');

  const hldNodes = item.hld ? item.hld : buildHld(moduleFile, item.hldSelf);
  const hldParts = [];
  hldNodes.forEach((node, i) => {
    hldParts.push(hldNodeHtml(node, !!node.origin, accent));
    if (i < hldNodes.length - 1) hldParts.push(`      <div class="hld-arrow">&rarr;</div>`);
  });

  const chipsBlock = item.chips ? `
    <div class="handbook-block">
      <h3>${item.chipsLabel || 'Typical Events'}</h3>
      <div class="tag-row">
        ${item.chips.map(c => `<span class="tag">${c}</span>`).join('\n        ')}
      </div>
    </div>` : '';

  const li = arr => arr.map(x => `      <li>${x}</li>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${item.name} — ${submoduleName} — CXOS Reference Documentation</title>
<link rel="stylesheet" href="../../css/style.css">
</head>
<body>

<header class="site-header">
  <a class="brand" href="../../index.html">
    <span class="brand-mark">CX</span>
    CXOS <span class="brand-sub">— Customer Experience Operating System</span>
  </a>
  <button class="nav-toggle" aria-label="Toggle navigation">&#9776;</button>
  <nav class="main-nav">
    <ul class="nav-list">
${nav}
    </ul>
  </nav>
</header>

<main class="page">
  <div class="breadcrumb">
    <a href="../../index.html">Overview</a><span class="sep">/</span>
    <a href="../${moduleFile}.html">${mod.title}</a><span class="sep">/</span>
    <a href="../${moduleFile}.html#${submoduleAnchor}">${submoduleName}</a><span class="sep">/</span>
    <span class="current">${item.name}</span>
  </div>

  <div class="module-intro" style="--card-accent:${accent}">
    <div class="step">${mod.title.replace('&amp;', '&amp;')} &rarr; ${submoduleName}</div>
    <h1>${item.name}</h1>
    <p>${item.tagline}</p>
  </div>

  <section class="section" style="margin-top:20px;">
    <div class="section-head"><div><h2>High-Level Design</h2><p>${item.hldCaption}</p></div></div>
    <div class="hld-diagram">
${hldParts.join('\n')}
    </div>
  </section>

  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#128188;</span> Business Context</h2>
    <ul class="feature-list">
${li(item.business)}
    </ul>
  </section>

  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#128268;</span> Technical Overview</h2>
    <p>${item.technical}</p>${chipsBlock}
  </section>

  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#128190;</span> ${item.artifactTitle}</h2>
    <pre class="code-block">${item.artifactCode}</pre>
  </section>

  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#128279;</span> Integration Points</h2>
    <ul class="feature-list">
${li(item.integration)}
    </ul>
  </section>

  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#9888;&#65039;</span> Non-Functional Considerations</h2>
    <ul class="feature-list">
${li(item.nfr)}
    </ul>
  </section>

  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#127919;</span> Enterprise Example</h2>
    <p>${item.example}</p>
  </section>

  <p style="margin-top:28px;"><a href="../${moduleFile}.html#${submoduleAnchor}">&larr; Back to ${submoduleName}</a></p>
</main>

<script src="../../js/main.js"></script>
</body>
</html>
`;
}

function generateModule(docRoot, moduleFile, submodules) {
  const outDir = path.join(docRoot, 'pages', moduleFile);
  fs.mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const sub of submodules) {
    for (const item of sub.items) {
      const html = renderItem(moduleFile, sub.anchor, sub.name, item);
      const outPath = path.join(outDir, item.slug + '.html');
      fs.writeFileSync(outPath, html, 'utf8');
      count++;
    }
  }
  console.log(`Wrote ${count} pages to ${outDir}`);
}

module.exports = { generateModule, MODULES };

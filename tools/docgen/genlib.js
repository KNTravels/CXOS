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

// Module + submodule-anchor catalog backing the collapsible "All Modules" tree in every page's
// side-nav. This replaced the header dropdown nav entirely (2026-08-02) — there is no more
// top-of-page nav, this tree is the only cross-module navigation on the site now.
const MODULE_ANCHORS = {
  'data-sources.html': { num: '1', label: 'Data Sources', anchors: [
    ['customer-touchpoints', 'Customer Touchpoints'],
    ['business-systems', 'Business Systems'],
    ['files-integrations', 'Files &amp; Integrations'],
    ['platform-connectors', 'Platform Connectors'],
  ]},
  'ingestion-layer.html': { num: '2', label: 'Ingestion Layer', anchors: [
    ['client-sdks', 'Client SDKs'],
    ['edge-network', 'Edge Network'],
    ['streaming-ingestion', 'Streaming Ingestion'],
    ['connectors', 'Connectors'],
    ['protocols-supported', 'Protocols Supported'],
    ['platform-connectors', 'Platform Connectors'],
  ]},
  'transformation-processing.html': { num: '3', label: 'Transformation &amp; Processing', anchors: [
    ['stream-processing', 'Stream Processing'],
    ['batch-processing', 'Batch Processing'],
    ['event-schema-registry', 'Event Schema &amp; Registry'],
    ['platform-connectors', 'Platform Connectors'],
  ]},
  'unified-data-foundation.html': { num: '4', label: 'Unified Data Foundation', anchors: [
    ['data-lakehouse', 'CXOS Data Lakehouse'],
    ['metadata-layer', 'Metadata Layer'],
    ['governance-security', 'Governance &amp; Security'],
    ['platform-connectors', 'Platform Connectors'],
  ]},
  'intelligence-services.html': { num: '5', label: 'Intelligence &amp; Services', anchors: [
    ['identity-profile', 'Identity &amp; Profile Service'],
    ['query-analytics-engine', 'Query &amp; Analytics Engine'],
    ['ai-insights', 'AI &amp; Insights'],
    ['operational-services', 'Operational Services'],
    ['platform-connectors', 'Platform Connectors'],
  ]},
  'destinations-activation.html': { num: '6', label: 'Destinations &amp; Activation', anchors: [
    ['real-time-activation', 'Real-time Activation'],
    ['batch-file-exports', 'Batch / File Exports'],
    ['apis-webhooks', 'APIs &amp; Webhooks'],
    ['reverse-etl-cdp-sync', 'Reverse ETL / CDP Sync'],
    ['platform-connectors', 'Platform Connectors'],
  ]},
};
const MODULE_ORDER = Object.keys(MODULE_ANCHORS);

// Collapsible "All Modules" side-nav tree — the current module's submodule list ships
// pre-expanded (aria-expanded="true" + .open) so there's no flash-of-collapsed-content; the
// current submodule anchor within it is marked .active too. `main.js`'s click handler makes
// every module's toggle expandable/collapsible, not just the active one.
function sideModulesNavHtml(activeModuleFile, activeSubmoduleAnchor) {
  const modules = MODULE_ORDER.map(file => {
    const mod = MODULE_ANCHORS[file];
    const isActive = file === activeModuleFile;
    const linkClass = isActive ? ' class="nav-tree-link active"' : ' class="nav-tree-link"';
    const subItems = mod.anchors.map(([id, label]) => {
      const itemActive = (isActive && id === activeSubmoduleAnchor) ? ' class="active"' : '';
      return `          <li><a href="../${file}#${id}"${itemActive}>${label}</a></li>`;
    }).join('\n');
    return `      <li class="nav-tree-module">
        <div class="nav-tree-row">
          <a href="../${file}"${linkClass}>${mod.num} &middot; ${mod.label}</a>
          <button class="nav-tree-toggle" aria-expanded="${isActive}" aria-label="Toggle ${mod.label} submodules"><span class="caret">&#8250;</span></button>
        </div>
        <ul class="nav-tree-sub${isActive ? ' open' : ''}">
${subItems}
        </ul>
      </li>`;
  }).join('\n');

  return `    <aside class="side-nav">
      <div class="label">All Modules</div>
      <ul class="nav-tree">
        <li><a class="nav-tree-link" href="../../index.html">Overview</a></li>
        <li><a class="nav-tree-link" href="../brd.html">BRD</a></li>
        <li><a class="nav-tree-link" href="../lld.html">LLD</a></li>
${modules}
      </ul>
    </aside>`;
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

  const servicesConsumedBlock = item.servicesConsumed ? `
  <section class="submodule" style="--card-accent:${accent}">
    <h2><span class="icon">&#129520;</span> Services Consumed</h2>
    <ul class="feature-list">
${li(item.servicesConsumed)}
    </ul>
  </section>
` : '';

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
</header>

<main class="page">
  <div class="breadcrumb">
    <a href="../../index.html">Overview</a><span class="sep">/</span>
    <a href="../${moduleFile}.html">${mod.title}</a><span class="sep">/</span>
    <a href="../${moduleFile}.html#${submoduleAnchor}">${submoduleName}</a><span class="sep">/</span>
    <span class="current">${item.name}</span>
  </div>

  <div class="module-page">
${sideModulesNavHtml(moduleFile + '.html', submoduleAnchor)}

    <div>
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
${servicesConsumedBlock}
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
    </div>
  </div>
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

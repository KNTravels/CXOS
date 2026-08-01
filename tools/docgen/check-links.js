const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith('.html')) results.push(full);
  }
  return results;
}

const root = process.argv[2] || '.';
const files = walk(root).map(f => f.split(path.sep).join('/'));
const idsByFile = {};
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  idsByFile[f] = new Set([...content.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
}

const errors = [];
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const baseDir = path.dirname(f);

  for (const m of content.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith('http') || href.startsWith('mailto')) continue;
    let targetFile, anchor;
    if (href.startsWith('#')) {
      targetFile = f; anchor = href.slice(1);
    } else if (href.includes('#')) {
      const parts = href.split('#');
      targetFile = path.normalize(path.join(baseDir, parts[0])).split(path.sep).join('/');
      anchor = parts[1];
    } else {
      targetFile = path.normalize(path.join(baseDir, href)).split(path.sep).join('/');
      anchor = null;
    }
    if (!targetFile.endsWith('.html')) continue;
    if (!fs.existsSync(targetFile)) {
      errors.push(f + ': BROKEN FILE LINK -> ' + href + ' (resolved ' + targetFile + ')');
      continue;
    }
    if (anchor) {
      let ids = idsByFile[targetFile];
      if (!ids) ids = new Set([...fs.readFileSync(targetFile, 'utf8').matchAll(/id="([^"]+)"/g)].map(x => x[1]));
      if (!ids.has(anchor)) errors.push(f + ': BROKEN ANCHOR -> ' + href + " (missing id='" + anchor + "' in " + targetFile + ')');
    }
  }

  for (const m of content.matchAll(/src="([^"]+)"/g)) {
    const src = m[1];
    if (src.startsWith('http') || src === '') continue;
    const target = path.normalize(path.join(baseDir, src)).split(path.sep).join('/');
    if (!fs.existsSync(target)) errors.push(f + ': BROKEN SRC -> ' + src + ' (resolved ' + target + ')');
  }
}

if (errors.length) {
  console.log('ISSUES FOUND:');
  errors.forEach(e => console.log(' -', e));
  process.exitCode = 1;
} else {
  console.log('All internal links, anchors, and asset references check out OK. Files scanned: ' + files.length);
}

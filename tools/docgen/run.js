const path = require('path');
const { generateModule } = require('./genlib');

const moduleFile = process.argv[2];
const dataPath = process.argv[3];
const docRoot = process.argv[4] || path.join(__dirname, '..', '..', 'doc');

if (!moduleFile || !dataPath) {
  console.error('Usage: node run.js <module-file-slug> <path-to-data.js> [docRoot]');
  console.error('Example: node run.js ingestion-layer ./data/ingestion-layer.js');
  process.exit(1);
}

const submodules = require(path.resolve(dataPath));
generateModule(docRoot, moduleFile, submodules);

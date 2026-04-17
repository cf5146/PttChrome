const fs = require('node:fs');
const path = require('node:path');

const targetPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'http-proxy',
  'lib',
  'http-proxy',
  'index.js'
);

const deprecatedSnippet = "    extend    = require('util')._extend,";
const replacementSnippet = '    extend    = Object.assign,';

if (!fs.existsSync(targetPath)) {
  console.warn('[patch:http-proxy] http-proxy is not installed; skipping patch.');
  process.exit(0);
}

const source = fs.readFileSync(targetPath, 'utf8');

if (source.includes(replacementSnippet)) {
  console.log('[patch:http-proxy] http-proxy is already patched.');
  process.exit(0);
}

if (!source.includes(deprecatedSnippet)) {
  console.warn('[patch:http-proxy] Expected http-proxy source was not found; skipping patch.');
  process.exit(0);
}

fs.writeFileSync(
  targetPath,
  source.replace(deprecatedSnippet, replacementSnippet),
  'utf8'
);

console.log('[patch:http-proxy] Patched http-proxy to use Object.assign.');
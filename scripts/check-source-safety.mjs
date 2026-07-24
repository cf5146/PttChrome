import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceRoots = ['src'];
const ignoredDirectories = new Set(['node_modules', 'dist', '.git', '.yarn']);
const checks = [
  {
    pattern: /dangerouslySetInnerHTML|insertAdjacentHTML|document\.write/,
    message: 'HTML parsing sink found in source'
  },
  {
    pattern: /c8c95356e465b8d7398ff2847152740e/,
    message: 'Known provider credential found in source'
  }
];

const files = [];
const visit = directory => {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      visit(path);
    } else if (/\.(?:js|mjs|ts|tsx|html|yml|yaml)$/.test(entry)) {
      files.push(path);
    }
  }
};

for (const root of sourceRoots) {
  visit(root);
}

const failures = [];
for (const path of files) {
  const source = readFileSync(path, 'utf8');
  for (const check of checks) {
    if (check.pattern.test(source)) {
      failures.push(`${relative('.', path)}: ${check.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Source safety checks passed for ${files.length} files.`);
}

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const includeRoots = [
  'entrypoints',
  'public/_locales',
  'assets',
  'scripts',
  'README.md',
  'README-zh.md',
  'GUIDE.md',
  'GUIDE-zh.md',
  'CONTRIBUTING.md',
  'CONTRIBUTING-zh.md',
  'ARCHITECTURE.md',
  'privacy.html',
  'package.json',
  'wxt.config.ts',
  'tsconfig.json',
];
const textExts = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.html', '.css', '.svg']);
const skippedDirs = new Set(['.git', 'node_modules', '.output', '.wxt', '.pnpm-store']);
const suspiciousPattern = /[\uFFFD\uE000-\uF8FF]/u;
const commonMojibakePattern = /(?:\u00c3.|\u00c2.|\u00e2\u0080.|\u00e6.|\u00e7.|\u00e8.|\u00e9.)/u;

function walk(target, files = []) {
  if (!fs.existsSync(target)) return files;
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    const name = path.basename(target);
    if (skippedDirs.has(name)) return files;
    for (const entry of fs.readdirSync(target)) walk(path.join(target, entry), files);
    return files;
  }
  if (textExts.has(path.extname(target))) files.push(target);
  return files;
}

const files = includeRoots.flatMap(item => walk(path.join(root, item)));
const failures = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  if (suspiciousPattern.test(text)) {
    failures.push(rel + ': contains replacement/private-use Unicode characters');
    continue;
  }
  if (commonMojibakePattern.test(text) && /[\u4e00-\u9fff]/u.test(text)) {
    failures.push(rel + ': contains likely UTF-8 mojibake sequences');
  }
}

if (failures.length) {
  console.error('UTF-8 verification failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}

console.log('UTF-8 verification passed (' + files.length + ' files checked).');

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDirs = [
  resolve(__dirname, '..', '.output', 'chrome-mv3'),
  resolve(__dirname, '..', '.output', 'firefox-mv2'),
];

for (const outDir of outDirs) {
  const manifestPath = resolve(outDir, 'manifest.json');
  try {
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (manifest.chrome_url_overrides) {
      delete manifest.chrome_url_overrides;
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('✓ Removed chrome_url_overrides from ' + manifestPath);
    }
  } catch (e) {
    // skip
  }
}

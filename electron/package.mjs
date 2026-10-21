// Packs the desktop version for Windows into release/, then zips it up as
// release/little-desk-windows.zip, ready to upload to itch.io.
// Run `npm run package:win` (it builds dist/ first).

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { packager } from '@electron/packager';

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'release');

// The app only needs the web build and the Electron entry point. Phaser is
// already bundled into dist/, so node_modules stays behind.
const keep = /^\/(dist|electron|package\.json)(\/|$)/;

const [appDir] = await packager({
  dir: root,
  out,
  name: 'Little Desk',
  executableName: 'Little Desk',
  platform: 'win32',
  arch: 'x64',
  icon: path.join(root, 'electron', 'icon.ico'),
  asar: true,
  overwrite: true,
  prune: false,
  ignore: (file) => file !== '' && !keep.test(file.replaceAll('\\', '/')),
  win32metadata: {
    CompanyName: 'Hoai Phuc',
    FileDescription: 'Little Desk',
    ProductName: 'Little Desk',
  },
});

// Chromium ships its own UI strings in 55 languages (~48 MB). The game only
// speaks English and Vietnamese, and Chromium falls back to en-US anyway.
const locales = path.join(appDir, 'locales');
for (const file of readdirSync(locales)) {
  if (!['en-US.pak', 'vi.pak'].includes(file)) rmSync(path.join(locales, file));
}

const zip = path.join(out, 'little-desk-windows.zip');
if (existsSync(zip)) rmSync(zip);
// Windows' built-in tar writes proper zips (forward-slash paths, unlike Compress-Archive).
execFileSync('tar', ['-a', '-c', '-f', zip, '-C', out, path.basename(appDir)], { stdio: 'inherit' });
console.log(`\nPackaged: ${appDir}\nZipped:   ${zip}`);

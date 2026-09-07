const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'out');
const staticDir = path.join(__dirname, '..', 'web', 'static');

console.log('[postbuild] Synchronizing routing artifacts in:', outDir);

// 1. Ensure CNAME and .nojekyll exist
fs.writeFileSync(path.join(outDir, 'CNAME'), 'getarole.in\n');
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

// 2. Map of routes to guarantee both {route}.html and {route}/index.html exist
const routes = [
  'dashboard',
  'explore',
  'matches',
  'profile',
  'preferences',
  'onboarding',
  'cover-letter',
  'crm',
  'privacy',
  'terms',
  'resume-builder'
];

routes.forEach(route => {
  const dirPath = path.join(outDir, route);
  const dirIndex = path.join(dirPath, 'index.html');
  const flatHtml = path.join(outDir, `${route}.html`);

  if (fs.existsSync(dirIndex) && !fs.existsSync(flatHtml)) {
    fs.copyFileSync(dirIndex, flatHtml);
    console.log(`[postbuild] Created ${route}.html from ${route}/index.html`);
  } else if (fs.existsSync(flatHtml) && !fs.existsSync(dirIndex)) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    fs.copyFileSync(flatHtml, dirIndex);
    console.log(`[postbuild] Created ${route}/index.html from ${route}.html`);
  }
});

// 3. Aliases: /settings -> /preferences, /candidate -> /crm
const aliases = [
  { from: 'preferences', to: 'settings' },
  { from: 'crm', to: 'candidate' }
];

aliases.forEach(({ from, to }) => {
  const fromIndex = path.join(outDir, from, 'index.html');
  if (fs.existsSync(fromIndex)) {
    const toDir = path.join(outDir, to);
    if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });
    fs.copyFileSync(fromIndex, path.join(toDir, 'index.html'));
    fs.copyFileSync(fromIndex, path.join(outDir, `${to}.html`));
    console.log(`[postbuild] Created alias ${to} -> ${from}`);
  }
});

// 4. Ensure 404.html exists in root for GitHub Pages SPA client routing
const notFoundSrc = path.join(outDir, '_not-found', 'index.html');
const notFoundDest = path.join(outDir, '404.html');
if (fs.existsSync(notFoundSrc) && !fs.existsSync(notFoundDest)) {
  fs.copyFileSync(notFoundSrc, notFoundDest);
  console.log('[postbuild] Created 404.html from _not-found/index.html');
}

// 5. Mirror complete outDir into web/static so web/static is always fully populated
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyDirRecursive(outDir, staticDir);
  console.log('[postbuild] Successfully mirrored outDir to web/static');
} catch (err) {
  console.warn('[postbuild] Could not mirror to web/static:', err.message);
}

console.log('[postbuild] Static export post-processing complete.');

// First Load JS per prerendered route: sum raw + gzip of every /_next/static/*.js referenced by the HTML.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = 'C:/Users/Corse/.antigravity/projects/RoughCut/roughcut-bbq/.next';
const appDir = path.join(root, 'server/app');
const pick = ['index', 'calculator', 'results', 'gallery', 'gear', 'ideas', 'recipes', 'rubs', 'wood-chart', 'techniques', 'guides', 'guides/how-to-smoke-a-brisket', 'cook', 'cook/smoker/pork-shoulder', 'recipes/' , 'saves', 'login', 'signup', 'admin', 'admin/gallery', 'admin/gear', 'privacy', 'account/delete'];
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) files.push(p); } })(appDir);
const cache = {};
function sz(src) {
  if (cache[src]) return cache[src];
  const p = path.join(root, src.replace(/^\/_next\//, ''));
  if (!fs.existsSync(p)) return (cache[src] = { raw: 0, gz: 0 });
  const b = fs.readFileSync(p);
  return (cache[src] = { raw: b.length, gz: zlib.gzipSync(b).length });
}
const out = [];
for (const f of files) {
  const rel = path.relative(appDir, f).replace(/\\/g, '/').replace(/\.html$/, '');
  if (rel.startsWith('cook/') && rel !== 'cook/smoker/pork-shoulder') continue;
  if (rel.startsWith('recipes/') && out.some(o => o.route.startsWith('/recipes/'))) continue;
  const html = fs.readFileSync(f, 'utf8');
  const srcs = [...new Set([...html.matchAll(/\/_next\/static\/[^"'\s)]+?\.js/g)].map(m => m[0]))];
  let raw = 0, gz = 0; for (const s of srcs) { const z = sz(s); raw += z.raw; gz += z.gz; }
  out.push({ route: '/' + (rel === 'index' ? '' : rel), chunks: srcs.length, raw, gz, html: fs.statSync(f).size });
}
out.sort((a, b) => b.gz - a.gz);
console.log('route'.padEnd(40), 'js chunks', ' JS raw KB', ' JS gzip KB', ' HTML KB');
for (const o of out) console.log(o.route.padEnd(40), String(o.chunks).padStart(9), (o.raw / 1024).toFixed(1).padStart(10), (o.gz / 1024).toFixed(1).padStart(11), (o.html / 1024).toFixed(1).padStart(8));
// biggest chunks overall + what's in them
const all = Object.entries(cache).sort((a, b) => b[1].raw - a[1].raw).slice(0, 8);
console.log('\nlargest referenced chunks:');
for (const [s, z] of all) {
  const txt = fs.readFileSync(path.join(root, s.replace(/^\/_next\//, '')), 'utf8');
  const hints = ['framer-motion', 'motion', 'supabase', 'react-dom', 'posthog', 'zod', 'nanoid', 'resend', 'meats'].filter(h => txt.includes(h === 'meats' ? 'pork_shoulder' : h));
  console.log(' ', s.split('/').pop().padEnd(34), (z.raw / 1024).toFixed(1).padStart(7), 'KB raw', (z.gz / 1024).toFixed(1).padStart(6), 'KB gz', hints.join(','));
}

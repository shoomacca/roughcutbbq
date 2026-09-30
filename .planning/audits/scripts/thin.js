// Duplicate/thin content check across built /cook pages: visible <main> text, word count, 5-gram shingle Jaccard.
const fs = require('fs'), path = require('path');
const dir = 'C:/Users/Corse/.antigravity/projects/RoughCut/roughcut-bbq/.next/server/app/cook';
const pages = [];
for (const m of fs.readdirSync(dir)) {
  const md = path.join(dir, m); if (!fs.statSync(md).isDirectory()) continue;
  for (const f of fs.readdirSync(md)) if (f.endsWith('.html')) {
    const html = fs.readFileSync(path.join(md, f), 'utf8');
    const main = (html.match(/<main[^>]*>([\s\S]*?)<\/main>/) || [, html])[1];
    const text = main.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
    pages.push({ id: `${m}/${f.replace('.html', '')}`, words: text.split(' ').length, text, title });
  }
}
const sh = t => { const w = t.split(' '); const s = new Set(); for (let i = 0; i + 5 <= w.length; i++) s.add(w.slice(i, i + 5).join(' ')); return s; };
pages.forEach(p => p.sh = sh(p.text));
const jac = (a, b) => { let i = 0; for (const x of a) if (b.has(x)) i++; return i / (a.size + b.size - i); };
const wc = pages.map(p => p.words).sort((a, b) => a - b);
console.log(`pages=${pages.length}  visible words in <main>: min=${wc[0]} median=${wc[wc.length >> 1]} max=${wc[wc.length - 1]}`);
// all-pairs jaccard
let sims = []; for (let i = 0; i < pages.length; i++) for (let j = i + 1; j < pages.length; j++) sims.push(jac(pages[i].sh, pages[j].sh));
sims.sort((a, b) => a - b);
const q = p => sims[Math.floor(p * (sims.length - 1))].toFixed(2);
console.log(`all-pairs 5-gram Jaccard: median=${q(0.5)} p90=${q(0.9)} p99=${q(0.99)} max=${q(1)}  pairs>=0.5: ${sims.filter(s => s >= 0.5).length} of ${sims.length}`);
// same cut, different method
const byCut = {}; pages.forEach(p => (byCut[p.id.split('/')[1]] = byCut[p.id.split('/')[1]] || []).push(p));
let sc = []; for (const ps of Object.values(byCut)) for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) sc.push({ s: jac(ps[i].sh, ps[j].sh), a: ps[i].id, b: ps[j].id });
sc.sort((a, b) => b.s - a.s);
console.log(`same cut / different method: pairs=${sc.length} median=${sc[sc.length >> 1].s.toFixed(2)} top:`); sc.slice(0, 5).forEach(x => console.log(`   ${x.s.toFixed(2)} ${x.a} <-> ${x.b}`));
// template share: shingles present in >50% of pages
const freq = new Map(); pages.forEach(p => p.sh.forEach(x => freq.set(x, (freq.get(x) || 0) + 1)));
const common = [...freq].filter(([, n]) => n > pages.length / 2).length;
const avg = pages.reduce((a, p) => a + p.sh.size, 0) / pages.length;
console.log(`boilerplate: ${common} shingles appear on >50% of pages; avg shingles/page=${avg.toFixed(0)} -> ~${(100 * common / avg).toFixed(0)}% of a typical page is shared template`);
const titles = new Map(); pages.forEach(p => titles.set(p.title, (titles.get(p.title) || 0) + 1));
console.log('duplicate <title>s among /cook pages:', [...titles].filter(([, n]) => n > 1).length, '; title length max', Math.max(...pages.map(p => p.title.length)), 'chars; >60 chars:', pages.filter(p => p.title.length > 60).length);

// Read-only data-integrity check for data/meats.json. Mirrors lib/calculator.ts:56-62 exactly.
const path = 'C:/Users/Corse/.antigravity/projects/RoughCut/roughcut-bbq/data/meats.json';
const d = require(path);
const issues = {};
const add = (k, s) => (issues[k] = issues[k] || []).push(s);
const PER = ['timeMode', 'applianceTempC', 'internalTempC', 'hasStall', 'wrapTempC'];
const ALL_METHODS = ['smoker', 'oven', 'rotisserie', 'dehydrator', 'kamado', 'charcoal_kettle', 'wood_fire', 'slow_cooker', 'pressure_cooker'];
// Safe minimums (C). USDA: poultry 74 (165F), ground meat 71 (160F), whole pork/beef/lamb/fish 63 (145F).
// FSANZ (AU consumer advice): poultry, mince, sausages, rolled/stuffed meats 75C.
const POULTRY = /chicken|turkey|duck|quail|poultry|wing|thigh|drumstick|spatchcock|goose|pheasant/i;
const MINCE = /mince|ground|burger|sausage|snag|meatball|kofta|patty|patties/i;
function calc(cut, m, kg) {
  const mode = cut.timeMode[m] ?? 'flat';
  return mode === 'flat' ? (cut.flatCookHours[m] ?? 0) : (cut.hoursPerKg[m] ?? 0) * kg;
}
const rows = [];
let pairs = 0;
for (const cat of d) for (const cut of cat.cuts) {
  const id = `${cat.id}/${cut.id}`;
  const cc = cut.cutCategory ?? 'bbq';
  const name = `${cut.id} ${cut.name}`;
  const isPoultry = cat.id === 'chicken' || POULTRY.test(name);
  const isMince = MINCE.test(name);
  if (isPoultry && cc !== 'veggie' && cut.safeMinTempC < 74) add('POULTRY safeMinTempC < 74', `${id} safeMin=${cut.safeMinTempC}`);
  if (cc === 'jerky' && (cut.preheatTempC ?? 0) < 71) add('jerky preheatTempC < 71 (USDA 160F beef / 165F poultry)', `${id} preheat=${cut.preheatTempC}`);
  for (const m of cut.methods) {
    pairs++;
    if (!ALL_METHODS.includes(m)) add('unknown method (not in CookingMethod type)', `${id} ${m}`);
    for (const f of PER) if (!(m in (cut[f] || {}))) add(`missing ${f}[method]`, `${id} ${m}`);
    const mode = cut.timeMode[m];
    if (mode === 'per_kg' && !(cut.hoursPerKg || {})[m]) add('per_kg but no/zero hoursPerKg', `${id} ${m}`);
    if (mode === 'flat' && !(cut.flatCookHours || {})[m]) add('flat but no/zero flatCookHours', `${id} ${m}`);
    if (mode === 'per_kg' && (cut.flatCookHours || {})[m] != null) add('per_kg but also has flatCookHours (dead value)', `${id} ${m}`);
    if (mode === 'flat' && (cut.hoursPerKg || {})[m] != null) add('flat but also has hoursPerKg (dead value)', `${id} ${m}`);
    const it = cut.internalTempC[m], wt = cut.wrapTempC?.[m], at = cut.applianceTempC[m];
    if (wt != null && it != null && wt > it) add('wrapTemp > internalTemp', `${id} ${m} wrap=${wt} internal=${it}`);
    if (cut.hasStall?.[m] && cut.stallTempC == null) add('hasStall true but stallTempC null (stall milestone silently dropped)', `${id} ${m}`);
    if (cut.hasStall?.[m] && wt != null && cut.stallTempC != null && wt < cut.stallTempC) add('wrapTemp below stallTemp (wrap before stall)', `${id} ${m} wrap=${wt} stall=${cut.stallTempC}`);
    if (it != null && at != null && at > 0 && at < it && m !== 'dehydrator') add('applianceTemp below target internal (target unreachable)', `${id} ${m} appliance=${at} internal=${it}`);
    if (it != null && it < cut.safeMinTempC) add("internalTemp below the cut's own safeMinTempC", `${id} ${m} internal=${it} safeMin=${cut.safeMinTempC}`);
    if ((cc === 'bbq' || cc === 'fish') && it == null) add('meat/fish with null/missing internalTemp (no rest milestone, no pull temp)', `${id} ${m}`);
    if (it != null && cc !== 'veggie') {
      if (isPoultry && it < 74) add('POULTRY internal < 74C (USDA 165F / FSANZ 75C)', `${id} ${m} internal=${it}`);
      else if (isPoultry && it < 75) add('poultry internal = 74 (below FSANZ 75C advice, meets USDA)', `${id} ${m} internal=${it}`);
      if (isMince && !isPoultry && it < 71) add('MINCE/SAUSAGE internal < 71C (USDA 160F; FSANZ 75C)', `${id} ${m} internal=${it}`);
      else if (isMince && !isPoultry && it < 75) add('mince/sausage internal 71-74 (meets USDA, below FSANZ 75C)', `${id} ${m} internal=${it}`);
      if (cat.id === 'pork' && it < 63) add('PORK internal < 63C (USDA 145F)', `${id} ${m} internal=${it}`);
      if (cat.id === 'fish' && it < 63) add('fish internal < 63C (USDA 145F; chefs often go lower for salmon/tuna)', `${id} ${m} internal=${it}`);
    }
    for (const kg of [0.5, 8]) rows.push({ id, m, mode, kg, h: calc(cut, m, kg), rate: cut.hoursPerKg?.[m], flat: cut.flatCookHours?.[m], it });
  }
  for (const f of ['timeMode', 'hoursPerKg', 'flatCookHours', 'applianceTempC', 'internalTempC', 'hasStall', 'wrapTempC'])
    for (const k of Object.keys(cut[f] || {})) if (!cut.methods.includes(k)) add(`${f} has key for a method not in methods[] (orphan)`, `${id} ${k}`);
}
console.log(`categories=${d.length} cuts=${d.reduce((a, c) => a + c.cuts.length, 0)} cut-method pairs=${pairs}\n`);
for (const [k, v] of Object.entries(issues)) { console.log(`## ${k}: ${v.length}`); v.forEach(s => console.log('   ' + s)); }
if (!Object.keys(issues).length) console.log('no structural issues');
const fmt = r => `${r.id.padEnd(34)} ${r.m.padEnd(16)} ${String(r.mode).padEnd(7)} ${String(r.kg).padStart(4)}kg -> ${r.h.toFixed(2).padStart(6)} h  (rate=${r.rate ?? '-'} flat=${r.flat ?? '-'})`;
console.log('\n## 15 longest computed cook times (0.5 kg and 8 kg inputs)');
[...rows].sort((a, b) => b.h - a.h).slice(0, 15).forEach(r => console.log('   ' + fmt(r)));
console.log('\n## 15 shortest per_kg cook times at 0.5 kg');
rows.filter(r => r.mode === 'per_kg' && r.kg === 0.5).sort((a, b) => a.h - b.h).slice(0, 15).forEach(r => console.log('   ' + fmt(r)));
console.log('\n## low-and-slow per_kg at 0.5 kg (smoker/kamado/kettle, internal >= 90C)');
rows.filter(r => r.mode === 'per_kg' && r.kg === 0.5 && ['smoker', 'kamado', 'charcoal_kettle'].includes(r.m) && (r.it ?? 0) >= 90).forEach(r => console.log('   ' + fmt(r)));
console.log('\n## pairs > 24 h at 8 kg:', rows.filter(r => r.h > 24).length, ' > 16 h:', rows.filter(r => r.h > 16).length);
console.log('## flat-mode pairs (weight ignored entirely):', rows.filter(r => r.mode === 'flat' && r.kg === 8).length, 'of', pairs);
function formatCookTime(hours) { const h = Math.floor(hours); const m = Math.round((hours - h) * 60); if (h === 0) return `${m} min`; if (m === 0) return `${h} hr${h !== 1 ? 's' : ''}`; return `${h} hr${h !== 1 ? 's' : ''} ${m} min`; }
console.log('\n## formatCookTime rollover (mirrors lib/calculator.ts:12-18): 1.995h ->', JSON.stringify(formatCookTime(1.995)), '| 0.999h ->', JSON.stringify(formatCookTime(0.999)));
let n = 0; for (let w = 0.1; w <= 30; w = Math.round((w + 0.1) * 10) / 10) for (const r of rows.filter(r => r.kg === 8 && r.mode === 'per_kg')) if (/60 min/.test(formatCookTime(r.rate * w))) n++;
console.log('   per_kg pairs x weights 0.1..30 (step 0.1) that render "60 min":', n);
const shoulder = d.find(c => c.id === 'pork').cuts.find(c => c.id === 'pork_shoulder');
console.log('## calculateCook has no weight bounds: pork_shoulder smoker kg=1000 ->', calc(shoulder, 'smoker', 1000), 'h; kg=-2 ->', calc(shoulder, 'smoker', -2), 'h; kg=NaN ->', calc(shoulder, 'smoker', NaN));
console.log('\n## milestone offsets are fixed fractions of cookTimeHours (lib/calculator.ts:85,106,111,119,127): jerky dry-check 0.50, stall 0.60, wrap 0.65, rest/pull 1.00');
const st = calc(shoulder, 'smoker', 6); console.log(`   e.g. pork_shoulder smoker 6kg: total ${st.toFixed(1)}h, stall @ ${(st * 0.6).toFixed(1)}h, wrap @ ${(st * 0.65).toFixed(1)}h`);
const st2 = calc(shoulder, 'smoker', 0.5); console.log(`   pork_shoulder smoker 0.5kg: total ${st2.toFixed(2)}h, stall "1-3 hours" text shown @ ${(st2 * 0.6).toFixed(2)}h - stall duration alone exceeds whole cook`);

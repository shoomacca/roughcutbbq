import { GEAR } from 'C:/Users/Corse/.antigravity/projects/RoughCut/roughcut-bbq/data/gear';
import { RUBS } from 'C:/Users/Corse/.antigravity/projects/RoughCut/roughcut-bbq/data/rubs';
import fs from 'fs';
const live = JSON.parse(fs.readFileSync('C:/Users/Corse/AppData/Local/Temp/claude/C--Users-Corse--antigravity-projects-RoughCut/12e45d79-bc30-45cb-8a12-ce704849c2a5/scratchpad/g.json','utf8')).gear;
console.log('static gear',GEAR.length,'rubs',RUBS.length,'live rows',live.length,'keys',Object.keys(live[0]).join(','));
const st=[...GEAR.map(g=>({slug:g.slug,name:g.name,cat:g.category,desc:g.description,url:g.affiliateUrl})),...RUBS.map(r=>({slug:r.slug,name:r.name,cat:r.category,desc:r.tagline,url:r.affiliateUrl}))];
const L:any=Object.fromEntries(live.map((x:any)=>[x.slug,x]));
let diffs=0;
for(const s of st){const d=L[s.slug];if(!d){console.log('MISSING IN DB',s.slug);continue;}
 for(const [a,b] of [['name','name'],['cat','category'],['desc','description'],['url','affiliate_url']] as const) if((s as any)[a]!==d[b]){diffs++;console.log('DIFF',s.slug,a);}}
for(const d of live) if(!st.find(s=>s.slug===d.slug)) console.log('DB ONLY',d.slug);
console.log('field diffs',diffs, 'rf non-null', live.filter((x:any)=>x.recommended_for).length);
const urls:any={};for(const s of st){(urls[s.url]=urls[s.url]||[]).push(s.slug)};for(const u in urls) if(urls[u].length>1) console.log('DUP URL',urls[u]);

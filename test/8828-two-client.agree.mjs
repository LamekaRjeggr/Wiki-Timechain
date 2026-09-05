// Two-client agreement: lab modular.html (:8778) and the ported index.html (:8779, relay-
// swapped copy from test/serve-port.sh) fold the same lab relay; the node reducer is the third.
// All three must print one projection hash.
import puppeteer from '/Users/alkemagreg/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { fold8828 } from '/Users/alkemagreg/Documents/Playground/wiki-timechain/lib/fold-8828.mjs';
import { createHash } from 'node:crypto';
const b = await puppeteer.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const Q='?c=us-israel-defense-tech-2026-lab&k=93a2e6405477';
const grab = async url => { const p=await b.newPage(); await p.goto(url,{waitUntil:'domcontentloaded'}); await new Promise(r=>setTimeout(r,6000));
  const r = await p.evaluate(()=>{ const x=window.__wtc.labProjection(); return {proj:x.projections, acts:window.__wtc.labSnapshot().acts, rej:x.rejectedActs.map(r=>r.id+':'+r.code).sort()}; }); await p.close(); return r; };
const A = await grab('http://127.0.0.1:8778/modular.html'+Q);   // lab client
const B = await grab('http://127.0.0.1:8779/index.html'+Q);     // ported upstream client
const h = o => createHash('sha256').update(JSON.stringify(o)).digest('hex').slice(0,16);
const norm = pr => pr.map(x=>({context:x.context,slot:x.slot,registers:Object.fromEntries(Object.entries(x.registers).map(([f,r])=>[f,[r.state,r.sourceActId||null,r.sourceEventId||null,JSON.stringify(r.value??null)]]))}));
console.log('lab   projections', A.proj.length, 'hash', h(norm(A.proj)), 'acts', A.acts.length, 'rejected', A.rej.length);
console.log('port  projections', B.proj.length, 'hash', h(norm(B.proj)), 'acts', B.acts.length, 'rejected', B.rej.length);
console.log('rejected sets equal:', JSON.stringify(A.rej)===JSON.stringify(B.rej));
// third client: the node reducer over the same raw acts (signature already vetted by client A's gate)
for (const [name,acts] of [['lab',A.acts],['port',B.acts]]) {
  const r = fold8828(acts, {verifyEvent:()=>true});
  const pj = r.projections;
  console.log('node reducer over', name, 'acts → projections', pj.length, 'hash', h(norm(pj)), 'rejected', r.rejectedActs.length);
  globalThis['R_'+name]=r;
}
await b.close();

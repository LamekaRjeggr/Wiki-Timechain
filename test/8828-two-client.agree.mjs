// Two-client agreement: lab modular.html (:8778) and the ported index.html (:8779, relay-
// swapped copy from test/serve-port.sh) fold the same lab relay; the node reducer is the third,
// the blind reducer (rule 7, written from the spec alone) the fourth. All must print one hash.
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
// puppeteer lives in the user's home node_modules, not the repo; Chrome path is the macOS cask.
const puppeteer = (await import(createRequire(homedir()+'/').resolve('puppeteer'))).default;
import { fold8828 } from '../lib/fold-8828.mjs';
import { foldBlind } from '../lib/fold-8828-blind.mjs';
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
// third + fourth client: both node reducers over the same raw acts (signature already vetted by client A's gate)
for (const [rname,fold] of [['node ',fold8828],['blind',foldBlind]]) for (const [name,acts] of [['lab',A.acts],['port',B.acts]]) {
  const r = fold(acts, {verifyEvent:()=>true});
  const pj = r.projections;
  console.log(rname, 'reducer over', name, 'acts → projections', pj.length, 'hash', h(norm(pj)), 'rejected', r.rejectedActs.length);
}
await b.close();

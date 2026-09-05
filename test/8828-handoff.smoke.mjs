// Real-browser handoff smoke test against the LAB relay only: modular.html → add.html → back.
// Needs relay :7777 + viewer :8778 up (lab-relay/README.md). Leaves two signed 8828s in lab history.

import puppeteer from '/Users/alkemagreg/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import fs from 'node:fs';
const SK = fs.readFileSync('/Users/alkemagreg/lab-relay/keys/fable/sk.hex','utf8').trim();
const BASE='http://127.0.0.1:8778/';
const TL = BASE+'modular.html?c=us-israel-defense-tech-2026-lab&k=93a2e6405477';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const b = await puppeteer.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const p = await b.newPage();
p.on('console',m=>{const t=m.text(); if(/error|refus|reject|fail/i.test(t)) log('  console:',t.slice(0,200));});
p.on('pageerror',e=>log('  PAGEERROR',e.message));

async function signIn(){
  await p.waitForSelector('#nsec-in');
  await p.type('#nsec-in', SK);
  await p.click('#b-nsec');
  await sleep(500);
  return p.evaluate(()=>localStorage.getItem('wtc:pk'));
}
async function buttons(){
  return p.$$eval('.abtn', bs=>bs.map(b=>({t:b.textContent.trim(),d:b.dataset.d,pk:b.dataset.pk,wpk:b.dataset.wpk,dis:b.disabled})));
}
async function actPage(){
  // add.html?act=1 — sign in (nsec is tab-only), wait for gate, click, wait tally
  await p.waitForSelector('#b-act');
  log('act-what:', (await p.$eval('#act-what',e=>e.textContent)).split('\n').slice(0,3).join(' | '));
  await signIn();
  for (let i=0;i<40;i++){ if(!(await p.$eval('#b-act',b=>b.disabled))) break; await sleep(500); }
  log('gate msg:', await p.$eval('#act-msg',e=>e.textContent));
  if (await p.$eval('#b-act',b=>b.disabled)) throw new Error('b-act still disabled');
  await p.click('#b-act');
  for (let i=0;i<40;i++){ const m=await p.$eval('#act-msg',e=>e.textContent); if(/published|refused|bad|not/.test(m)) break; await sleep(500); }
  log('result:', await p.$eval('#act-msg',e=>e.textContent));
  const j = await p.$eval('#act-json',e=>e.textContent).catch(()=>''); 
  if (j) { const ev=JSON.parse(j); log('act id', ev.id, 'tags', JSON.stringify(ev.tags.map(t=>[t[0],(t[1]||'').slice(0,20),t[2]||'',t[3]||''])), 'bytes', j.length); }
}
async function projection(){
  return p.evaluate(()=>{ const pr=window.__wtc.labProjection(); const me='93a2e6405477aec127347a59e30b3c93ba49e9082e375ab328e6c18de3cd540e';
    const out={}; for (const [k,v] of Object.entries(pr.projections||{})) if(k.includes(me)) out[k]=JSON.stringify(v).slice(0,300);
    return {acts:pr.acceptedActs.length, rejected:pr.rejectedActs.map(r=>r.code), mine:out}; });
}

log('1. sign in on add.html');
await p.goto(BASE+'add.html',{waitUntil:'domcontentloaded'});
log('   wtc:pk =', await signIn());

log('2. open modular');
await p.goto(TL,{waitUntil:'domcontentloaded'});
await p.waitForSelector('.abtn',{timeout:20000}).catch(()=>log('   no .abtn appeared'));
await sleep(3000);
let bs = await buttons(); log('   buttons:', JSON.stringify(bs.slice(0,6)), 'total', bs.length);
log('   projection before:', JSON.stringify(await projection()));

const TARGET = process.env.D;
const acc = bs.find(x=>x.pk && !x.dis && (!TARGET || x.d===TARGET));
if (!acc) { log('NO accept button — stop'); await b.close(); process.exit(1); }
log('3. accept', acc.d);
await Promise.all([p.waitForNavigation({waitUntil:'domcontentloaded'}), p.evaluate(d=>document.querySelector(`.abtn[data-pk][data-d="${d}"]`).click(), acc.d)]);
log('   url', p.url());
await actPage();

log('4. back to modular');
await p.goto(TL,{waitUntil:'domcontentloaded'});
await p.waitForSelector('.abtn',{timeout:20000}).catch(()=>{});
await sleep(4000);
bs = await buttons(); log('   buttons:', JSON.stringify(bs.filter(x=>x.d===acc.d)));
log('   projection after accept:', JSON.stringify(await projection()));

const w = bs.find(x=>x.wpk && x.d===acc.d);
if (!w) { log('NO withdraw button — stop'); await b.close(); process.exit(1); }
log('5. withdraw');
await Promise.all([p.waitForNavigation({waitUntil:'domcontentloaded'}), p.evaluate(d=>document.querySelector(`.abtn[data-wpk][data-d="${d}"]`).click(), acc.d)]);
await actPage();

log('6. back to modular');
await p.goto(TL,{waitUntil:'domcontentloaded'});
await p.waitForSelector('.abtn',{timeout:20000}).catch(()=>{});
await sleep(4000);
bs = await buttons(); log('   buttons:', JSON.stringify(bs.filter(x=>x.d===acc.d)));
log('   projection after revoke:', JSON.stringify(await projection()));
await b.close();

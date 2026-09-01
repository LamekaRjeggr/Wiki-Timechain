// Closed-dossier protocol durability replay. Publishes nothing.
// Usage: node .htest/protocol-lab/replay.mjs
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const page = readFileSync(join(root, "index.html"), "utf8");
const cryptoBlock = page.match(/const CURVE_P = [^]*?async function signWithMint\(tmpl, skHex\)\{[^]*?\n\}/);
if (!cryptoBlock) throw new Error("could not extract the shipped signing implementation");
const cryptoMod = await import("data:text/javascript," + encodeURIComponent(
  cryptoBlock[0] + "\nexport { signWithMint, schnorrVerify, eventId };"
));
const { signWithMint, schnorrVerify, eventId } = cryptoMod;

const N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
const secret = () => { let n, h; do { h = randomBytes(32).toString("hex"); n = BigInt("0x" + h); } while (!n || n >= N); return h; };
const keys = { sparse:secret(), second:secret(), detailed:secret(), notaryA:secret(), main:secret() };
let clock = 1788220800;
const sign = (key, kind, tags, content="") => signWithMint({ kind, created_at:clock++, tags, content }, keys[key]);
const coord = ev => `30828:${ev.pubkey}:${ev.tags.find(t => t[0] === "d")?.[1]}`;
const tag = (ev, name) => ev.tags.find(t => t[0] === name)?.[1];
const cardTags = (d, date, title, summary, notary) => [
  ["d",d], ["event_date",date], ["title",title], ["summary",summary],
  ["a",notary]
];

const notaryA = await sign("notaryA", 30829, [["d","community"],["title","Notary A"],["t","wikitimechain"]]);
const main = await sign("main", 30829, [["d","main"],["title","Main"],["t","wikitimechain"]]);
const nA = `30829:${notaryA.pubkey}:community`, nMain = `30829:${main.pubkey}:main`;

// Author cards: the sparse pair, malformed second-author proposals, and four detailed cards.
const A1 = await sign("sparse",30828,cardTags("tl-7q4m","2026-05-13","House introduces FY2027 NDAA","The House introduced H.R. 8800 with a U.S.–Israel defense-technology initiative.",nA));
const A2 = await sign("sparse",30828,cardTags("tl-k9x2","2026-05-29","Critics raise concerns about provision later numbered Section 224","Early descriptions alleged a military merger; that characterization was an allegation.",nA));
const B1 = await sign("second",30828,[["d","tl-v3m8"],["date","2026-06-04"],["title","House provision identified as Section 219"],["a",nA]],"House provision scope clarification.");
const B2 = await sign("second",30828,[["d","tl-p6w1"],["date","2026-06-04"],["title","Massie and Khanna seek removal of House Section 219"],["a",nA]],"An undated removal effort combined with the dated Senate discovery.");
const C1 = await sign("detailed",30828,cardTags("tl-c-20260529-criticism","2026-05-29","Critics focus on House defense-technology provision","It was Section 224 at this point and was later renumbered Section 219; ‘military merger’ was an allegation, not the stated legal effect.",nA),"Critics discussed the provision. Its described scope concerned defense-technology cooperation and did not establish joint command or transfer U.S. military authority.");
const C2 = await sign("detailed",30828,cardTags("tl-c-20260604-senate","2026-06-04","Similar Senate provision identified","A similar Senate initiative was known as Section 1217.",nA),"The similar Senate provision created a parallel legislative track; similarity does not establish textual identity or passage.");
const C3 = await sign("detailed",30828,cardTags("tl-c-20260722-house-passage","2026-07-22","House passes NDAA with Section 219","The House passed the whole NDAA 216–212; Section 219 had no standalone floor vote and passage did not make it law.",nA),"The removal amendment received no floor vote. The recorded vote was on H.R. 8800 as a whole, with Section 219 included.");
const C4 = await sign("detailed",30828,cardTags("tl-c-20260901-status","2026-09-01","FY2027 NDAA provisions remain unfinished","The measure was not law as of 2026-09-01.",nA),"There was no final Senate passage, bicameral agreement, or presidential signature by the dossier cutoff.");

const validCard = ev => ev.kind === 30828 && /^\d{4}-\d{2}-\d{2}$/.test(tag(ev,"event_date") || "") && !!tag(ev,"d");
const snapOf = card => JSON.stringify({ tags:card.tags, content:card.content });
const acceptWhole = async (key, context, slot, card, upstream=null, credit=true) => {
  const tags = [["a",coord(card)],["e",card.id,"","source"],["context",context],["slot",slot],["scope","card"],["snapshot",snapOf(card)]];
  if (upstream) tags.push(["e",upstream.id,"","provenance"]);
  if (credit) tags.push(["p",card.pubkey]);
  return sign(key,8828,tags,card.content);
};
const revoke = (key, context, target) => sign(key,8828,[["e",target.id,"","revoke"],["context",context]],"");

const aA1 = await acceptWhole("notaryA",nA,"intro",A1);
// R1 is an ordinary derived card: unlike a whole pass, this creates a new 30828.
const R1 = await sign("notaryA",30828,cardTags("tl-a-20260529-correction","2026-05-29","Critics focus on House defense-technology provision","The provision was Section 224 and was later renumbered Section 219; ‘military merger’ remained an allegation.",nA),"Editorial derivation from the sparse criticism card, correcting the numbering sequence.");
const aR1 = await acceptWhole("notaryA",nA,"criticism",R1,null,false);
const rR1 = await revoke("notaryA",nA,aR1);
const aC1 = await acceptWhole("notaryA",nA,"criticism",C1);
const aC2 = await acceptWhole("notaryA",nA,"senate",C2);
const aC3 = await acceptWhole("notaryA",nA,"passage",C3);
const aC4 = await acceptWhole("notaryA",nA,"status",C4);

// Main independently signs the exact card snapshots and cites A's decisions as provenance.
const mA1 = await acceptWhole("main",nMain,"intro",A1,aA1);
const mC1 = await acceptWhole("main",nMain,"criticism",C1,aC1);
const mC2 = await acceptWhole("main",nMain,"senate",C2,aC2);
const mC3 = await acceptWhole("main",nMain,"passage",C3,aC3);
const mC4 = await acceptWhole("main",nMain,"status",C4,aC4);

// Later conditions: source coordinate changes and upstream withdraws C3.
const A1v2 = await sign("sparse",30828,cardTags("tl-7q4m","2026-05-14","House introduces FY2027 NDAA — revised date","A later replacement changes load-bearing bytes.",nA));
const rC3 = await revoke("notaryA",nA,aC3);

const events = [notaryA,main,A1,A2,B1,B2,C1,C2,C3,C4,aA1,R1,aR1,rR1,aC1,aC2,aC3,aC4,mA1,mC1,mC2,mC3,mC4,A1v2,rC3];
const isRevoke = ev => ev.kind === 8828 && ev.tags.some(t => t[0] === "e" && t[3] === "revoke");
const projection = (input, context) => {
  const byId = new Map(input.map(e => [e.id,e]));
  const revoked = new Set();
  for (const ev of input.filter(isRevoke)) {
    const target = ev.tags.find(t => t[0] === "e" && t[3] === "revoke")?.[1], prior = byId.get(target);
    if (prior && prior.pubkey === ev.pubkey) revoked.add(target);
  }
  const out = new Map();
  for (const ev of input.filter(e => e.kind === 8828 && tag(e,"context") === context && tag(e,"scope") === "card" && !revoked.has(e.id))) {
    const slot = tag(ev,"slot"), prior = out.get(slot);
    if (!prior || ev.created_at > prior.created_at || (ev.created_at === prior.created_at && ev.id < prior.id)) out.set(slot,ev);
  }
  return [...out].sort(([a],[b]) => a.localeCompare(b)).map(([slot,act]) => ({ slot, act:act.id, snapshot:JSON.parse(tag(act,"snapshot")) }));
};
const digestProjection = p => JSON.stringify(p.map(x => [x.slot,x.act,x.snapshot]));

let checks=0;
const ok = (condition, message) => { checks++; if (!condition) throw new Error("FAIL: " + message); };
for (const ev of events) {
  ok(await eventId(ev) === ev.id, "event id matches payload");
  ok(await schnorrVerify(ev.id,ev.pubkey,ev.sig), "BIP-340 signature verifies");
}
ok(validCard(A1) && validCard(C1) && !validCard(B1) && !validCard(B2), "card validation catches malformed second-author envelopes");
ok(events.filter(e => e.kind === 30828).length === 10, "whole passes create no extra 30828; only R1 and A1 replacement add cards");
const mainP = projection(events,nMain), upstreamP = projection(events,nA);
ok(mainP.length === 5, "Main retains five independently accepted slots");
ok(upstreamP.length === 4 && !upstreamP.some(x => x.slot === "passage"), "A's own C3 revoke removes only A's active passage slot");
ok(mainP.some(x => x.slot === "passage"), "upstream revoke does not revoke Main's passage decision");
const intro = mainP.find(x => x.slot === "intro");
ok(intro.snapshot.tags.some(t => t[0] === "event_date" && t[1] === "2026-05-13"), "accepted date survives a live source replacement");
const withoutA1 = events.filter(e => e.id !== A1.id);
ok(projection(withoutA1,nMain).find(x => x.slot === "intro").snapshot.content === A1.content, "accepted bytes survive source loss");
ok(digestProjection(mainP) === digestProjection(projection([...events].reverse(),nMain)), "derivation is independent of arrival order");
ok(events.filter(e => e.kind === 8828 && tag(e,"scope") === "field").length === 0, "modular assembly was available but not used artificially");

const report = {
  generated_at:new Date().toISOString(), events:events.length, cards:events.filter(e => e.kind === 30828).length,
  acts:events.filter(e => e.kind === 8828).length, checks,
  active:{ notaryA:upstreamP.map(x => x.slot), main:mainP.map(x => x.slot) },
  observations:[
    "A whole-card pass required one 8828 and no new 30828.",
    "The correction R1 required a new 30828 because its bytes differed.",
    "A revoked upstream act remained in history and did not erase Main's independent act.",
    "The embedded canonical snapshot preserved event_date and content after replacement and source loss.",
    "No modular card was manufactured where complete valid cards sufficed."
  ]
};
const outDir = mkdtempSync(join(tmpdir(),"wtc-protocol-lab-"));
writeFileSync(join(outDir,"events.json"),JSON.stringify(events,null,2));
writeFileSync(join(outDir,"events-source-missing.json"),JSON.stringify(withoutA1,null,2));
writeFileSync(join(outDir,"events-reversed.json"),JSON.stringify([...events].reverse(),null,2));
writeFileSync(join(outDir,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,temporary_output:outDir},null,2));

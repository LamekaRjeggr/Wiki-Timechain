#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// Convention v2 migration tool — the durable "how" behind CONVENTION.md.
// Self-contained (node built-ins only; needs global WebSocket → node 22+).
// Always reads LIVE from relays, never a snapshot, so it can't go stale.
//
//   node tools/migrate-v2.mjs fetch  <slug>   # pull a collection's cards live
//   node tools/migrate-v2.mjs gen    <slug>   # write v2 JSON per card -> out/<d>.v2.json
//   node tools/migrate-v2.mjs verify <slug>   # confirm published cards are clean v2
//
// The recipe (proven on the tonopah collection, 2026-07-23):
//   keep d/title/content/event_date/published_at verbatim; DROP the legacy `c`
//   tag; add marker + collection label + date buckets + location ladder; BUMP
//   created_at strictly past the stored value (else the addressable replace is
//   silently ignored). Then publish each out/*.json via Forge RAW·JSON,
//   bunker-signed by the SAME key that owns the card, and run `verify`.
//   An OK frame alone can mean "accepted but ignored as older" — verify tags.
// ────────────────────────────────────────────────────────────────────────────

const RELAYS = ["wss://relay.damus.io","wss://nos.lol","wss://relay.primal.net",
                "wss://relay.mostr.pub","wss://relay.nostr.band","wss://nostr.wine"];
const KIND = 30818, MARKER = "wikitimechain";

// Per-collection location policy (CONVENTION.md, jurisdiction ladder). Location is CATALOG data:
// only add rungs that are TRUE for the card. Placeless collections get none.
const LOCATION = {
  "bitcoin-arbitrary-data": null,                                   // placeless
  "tonopah-310ac-411th-camelback-z260019-cpa260008":
    { iso1:"US", iso2:"US-AZ", ladder:["us-az-maricopa","us-az-maricopa-tonopah"] },
  // hcr2001: statewide acts stop at US-AZ (ladder:[]); a genuine point event
  // gets deeper rungs — JUDGE PER CARD, edit this or the emitted file by hand.
  "hcr2001-fast-election-results": { iso1:"US", iso2:"US-AZ", ladder:[] },
};

const tag = (ev,n) => (ev.tags.find(t=>t[0]===n)||[])[1] || "";

// pull newest event per d for a filter, merged across all relays
async function pull(filter){
  const newest = new Map(), pk = new Set();
  await Promise.all(RELAYS.map(url => new Promise(res => {
    let ws; try { ws = new WebSocket(url); } catch { return res(); }
    const done = () => { try{ws.close()}catch{}; res(); };
    const to = setTimeout(done, 7000);
    ws.onopen = () => ws.send(JSON.stringify(["REQ","q",filter]));
    ws.onmessage = m => { let d; try{d=JSON.parse(m.data)}catch{return}
      if (d[0]==="EVENT"){ const ev=d[2], k=tag(ev,"d");
        pk.add(ev.pubkey);
        const cur=newest.get(k); if(!cur||cur.created_at<ev.created_at) newest.set(k,ev); }
      if (d[0]==="EOSE"){ clearTimeout(to); done(); } };
    ws.onerror = done;
  })));
  return { cards:[...newest.values()], pubkeys:[...pk] };
}

// a collection's live cards, found by legacy #c OR v2 collection label #l
const fetchCollection = slug => pull({ kinds:[KIND], "#c":[slug] })
  .then(async r => r.cards.length ? r : pull({ kinds:[KIND], "#l":[slug] }));

// build the v2 event template (unsigned; Forge/bunker adds pubkey/id/sig)
function toV2(src, slug){
  const ed = tag(src,"event_date");                      // YYYY-MM-DD
  const [y,m] = ed.split("-");
  const yearOnly = /APPROXIMATE DATE:\s*known to the year/i.test(src.content) || /-01-01$/.test(ed);
  const dateBuckets = yearOnly ? [["l",y,`${MARKER}.date`]]
                               : [["l",y,`${MARKER}.date`], ["l",`${y}-${m}`,`${MARKER}.date`]];
  const loc = LOCATION[slug];
  const locTags = !loc ? [] : [
    ["L","ISO-3166-1"], ["l",loc.iso1,"ISO-3166-1"],
    ["L","ISO-3166-2"], ["l",loc.iso2,"ISO-3166-2"],
    ...(loc.ladder.length ? [["L",`${MARKER}.location`],
        ...loc.ladder.map(v => ["l",v,`${MARKER}.location`])] : []),
  ];
  return {
    kind: KIND,
    created_at: Math.floor(Date.now()/1000),             // bump: strictly > stored
    content: src.content,                                // verbatim
    tags: [
      ...src.tags.filter(t => t[0] !== "c"),             // keep all but legacy c
      ["t", MARKER],
      ["L",`${MARKER}.collection`], ["l",slug,`${MARKER}.collection`],
      ["L",`${MARKER}.date`], ...dateBuckets,
      ...locTags,
    ],
  };
}

const [cmd, slug] = process.argv.slice(2);
if (!cmd || !slug){ console.error("usage: migrate-v2.mjs <fetch|gen|verify> <slug>"); process.exit(1); }

if (cmd === "fetch"){
  const { cards, pubkeys } = await fetchCollection(slug);
  console.log(`${cards.length} cards, author(s): ${pubkeys.map(p=>p.slice(0,16)+"…").join(", ")}`);
  for (const e of cards.sort((a,b)=>tag(a,"event_date")<tag(b,"event_date")?-1:1))
    console.log(`  ${tag(e,"event_date")}  ${tag(e,"d")}  (created_at ${e.created_at}, c?=${!!tag(e,"c")})`);
}

else if (cmd === "gen"){
  const { cards } = await fetchCollection(slug);
  const fs = await import("node:fs"); fs.mkdirSync("out",{recursive:true});
  if (LOCATION[slug] === undefined)
    console.log(`! no LOCATION policy for "${slug}" — emitting placeless; edit LOCATION[] if it has a place.`);
  for (const src of cards){
    const v2 = toV2(src, slug);
    if (v2.created_at <= src.created_at){ console.error(`SKIP ${tag(src,"d")}: clock not ahead of stored`); continue; }
    const f = `out/${tag(src,"d")}.v2.json`;
    fs.writeFileSync(f, JSON.stringify(v2,null,2));
    const buckets = v2.tags.filter(t=>t[0]==="l"&&t[2]===`${MARKER}.date`).map(t=>t[1]);
    console.log(`wrote ${f}  buckets=[${buckets}] created_at ${src.created_at}->${v2.created_at}`);
  }
  console.log(`\nPublish each out/*.json via Forge RAW·JSON (bunker-sign as the card's own key), then: verify ${slug}`);
}

else if (cmd === "verify"){
  const { cards, pubkeys } = await fetchCollection(slug);
  let clean = 0;
  for (const e of cards.sort((a,b)=>tag(a,"event_date")<tag(b,"event_date")?-1:1)){
    const marker = e.tags.some(t=>t[0]==="t"&&t[1]===MARKER);
    const coll = (e.tags.find(t=>t[0]==="l"&&t[2]===`${MARKER}.collection`)||[])[1];
    const hasC = !!tag(e,"c");
    const ok = marker && coll===slug && !hasC;
    if (ok) clean++;
    console.log(`${ok?"✓":"✗"} ${tag(e,"d")}  marker=${marker} c?=${hasC} collection=${coll||"—"}`);
  }
  console.log(`\n${clean}/${cards.length} pure v2 across ${pubkeys.length} author(s).`);
}

else { console.error("unknown command:", cmd); process.exit(1); }

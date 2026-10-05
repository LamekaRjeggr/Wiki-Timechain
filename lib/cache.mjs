// One saved copy of what the relays last sent, per relay set, in this browser (IndexedDB), so the next visit draws before they answer.
// A page saves once every relay has sent all it has. After a whole-history visit the save replaces the copy (what no relay sent leaves with it); a page that asked only for what is new adds to it.
// Saved events passed the signature check before they were saved; a page feeds them straight in. Entries are [event, relays that sent it].
const ST = "snap", RANK = { 5:0, 30829:1, 30828:2, 8828:3 };   // deletes first, then heads before the cards and acts that point at them
const db = () => new Promise((ok, no) => { const r = indexedDB.open("wtc-cache", 1); r.onupgradeneeded = () => r.result.createObjectStore(ST); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const run = (mode, f) => db().then(d => new Promise((ok, no) => { const t = d.transaction(ST, mode), r = f(t.objectStore(ST)); t.oncomplete = () => ok(r.result); t.onerror = () => no(t.error); }));
export const keyOf = relays => [...relays].sort().join(" ");
export const load = key => run("readonly", s => s.get(key)).then(v => (v?.evs || []).sort((a, b) => (RANK[a[0].kind] ?? 4) - (RANK[b[0].kind] ?? 4)), () => []);
export const meta = key => run("readonly", s => s.get(key)).then(v => ({ at:v?.at || 0, full:v?.full ?? v?.at ?? 0 }), () => ({ at:0, full:0 }));   // when it was saved; full = when a relay last sent the whole history (a save without one was whole)
export const save = (key, evs, full = Date.now()) => run("readwrite", s => s.put({ at:Date.now(), full, evs }, key)).catch(() => {});
// what the pages keep only as derived state: the newest profile and follow list per key, every delete
export const extra = new Map();
export const note = ev => { const k = ev.kind === 5 ? ev.id : ev.kind + ":" + ev.pubkey, cur = extra.get(k); if (!cur || cur.created_at < ev.created_at) extra.set(k, ev); };

// A relay's whole history for a filter. A relay answers a REQ with at most its own cap (ditto 100, most 500),
// then EOSE, and never says it cut the answer short. So every ask for stored events pages back through time,
// PAGE at a time, until a page comes back short. Live events ride the page's own subs, opened `since: T0`.
// Sub ids are `name~n`: the page routes EVENTs by the name before the ~.
export const PAGE = 100, T0 = Math.floor(Date.now() / 1000);
let seq = 0;

// pull `keys` (values of filter tag k, e.g. "#a") from one open relay, only the ones it has not pulled yet
export function pull(ws, name, base, k, keys, then){
  const got = (ws.pulled ||= {})[name] ||= new Map(), fresh = [...new Set(keys)].filter(x => !got.has(x));
  for (let i = 0; i < fresh.length; i += PAGE){   // a long key list goes in parts: some relays cap a filter's size too
    const p = { ws, name, f:{ ...base, [k]:fresh.slice(i, i + PAGE) }, ids:new Set(), tries:0, done:null, then };
    p.f[k].forEach(x => got.set(x, p)); page(p);
  }
}
function page(p){
  if (p.ws.readyState !== 1) return end(p, "fail");
  if ((p.ws.pages?.size || 0) >= 2) return (p.ws.q ||= []).push(p);   // two pages in flight per relay: nos.lol drops a REQ past its limit with only a NOTICE
  const sub = p.name + "~" + ++seq; p.sub = sub; p.n = p.fresh = 0;
  (p.ws.pages ||= new Map()).set(sub, p);
  p.ws.send(JSON.stringify(["REQ", sub, { ...p.f, limit:PAGE, ...(p.until ? { until:p.until } : {}) }]));
  p.t = setTimeout(() => retry(p), 8000);   // no EOSE in 8s: a stuck relay cannot hold the count forever
}
function stop(p){ clearTimeout(p.t); p.ws.pages.delete(p.sub); if (p.ws.readyState === 1) p.ws.send(JSON.stringify(["CLOSE", p.sub])); const n = p.ws.q?.shift(); if (n) page(n); }
function retry(p){ stop(p); if (p.tries++) return end(p, "fail"); setTimeout(() => page(p), 1000); }   // once more, then this relay is left out
function end(p, how){ p.done = how; p.then?.(); }

// every message from a relay passes here first; a page's EVENTs are counted and still go on to the page
export function route(ws, d){
  const p = ws.pages?.get(d[1]); if (!p) return;
  if (d[0] === "EVENT" && d[2]?.id){ p.n++; if (!p.ids.has(d[2].id)){ p.ids.add(d[2].id); p.fresh++; p.old = Math.min(p.old ?? Infinity, d[2].created_at); } }
  if (d[0] === "CLOSED") retry(p);
  if (d[0] !== "EOSE") return;
  stop(p);
  if (p.n < PAGE) return end(p, "ok");   // a short page: the relay had no more
  if (!p.fresh) return end(p, "fail");   // a whole page inside one second: no way past it, so no claim
  p.until = p.old; page(p);   // `until` takes that second again; the ids already seen drop out
}

// still pulling on some open relay: a count now would be a guess
export const busy = sockets => sockets.some(w => w.readyState === 1 && Object.values(w.pulled || {}).some(m => [...m.values()].some(p => !p.done)));

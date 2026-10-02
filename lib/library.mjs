// The Library: the one menu both readers open with. My collection = the timelines you keep as a
// notary; Follows = the ones people you follow keep (only when the page passes folState); Everyone = every name, newest activity first, 25 shown (only when the page passes everyone); Search everyone = all of them, and typing filters. Timetrees first, or last when the page passes treesLast.
// The page owns the data and hands rows over: { d, title, text, n, nTl, tree, mine, fol, copies, at, span, where }. fol = how many you follow keep it; copies = how many keep it at all; at = its newest activity.
// n = null: count not known yet, shown as "…" while loading — a page passes a count only once every relay has sent all it has; span = the years it covers, when the page knows them; where = words that take the event count's place (the dots page on local: N waiting). Colors are the page's own: --bg --panel --line --t0 --t1 --t2, and --pick (orange) for the tab you chose.
const CSS = `
#lib{width:100%;max-width:720px;margin:8px auto 60px;font:18px/1.45 var(--sans,ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);color:var(--t1)}
#lib button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
#lib .ltabs{display:flex;margin-bottom:14px} #lib .ltabs button{flex:1 1 0;min-width:0;padding:12px 4px;font-size:clamp(15px,4vw,19px);color:var(--t2);border-bottom:4px solid var(--line)}
#lib .ltabs button[aria-selected="true"]{color:var(--pick);font-weight:700;border-color:var(--pick)} #lib .ltabs button:disabled{opacity:.4;cursor:default}
#lib h3{margin:22px 0 0;font-size:20px;color:var(--t0);letter-spacing:0;text-transform:none} #lib h3 i{font-style:normal;font-weight:400;color:var(--t2)} #lib .lplain{margin:0 0 4px;font-size:16px;color:var(--t2)}
#lib .lrow{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:6px 14px;margin-top:8px;border:2px solid var(--line);border-radius:10px;background:var(--panel);text-align:left}
#lib .lrow:hover,#lib .lrow:focus-visible{border-color:var(--t1);outline:none} #lib .lrow b{display:block;font-size:19px;font-weight:600;color:var(--t0)} #lib .lrow small{display:block;font-size:15px;color:var(--t2)}
#lib .lbig{margin:22px 0 0;font-weight:600;font-size:17px;color:var(--bg);background:var(--t1);border-radius:8px;padding:8px 18px}
#lib input{box-sizing:border-box;width:100%;font-family:inherit;font-size:19px;padding:12px 14px;border:2px solid var(--line);border-radius:10px;background:var(--panel);color:var(--t0)} #lib input:focus{outline:none;border-color:var(--t1)}
#lib .lnote{margin:24px 0 0;font-size:18px} #lib .lnote i{font-style:normal;color:var(--t2)} #lib .lnote button:enabled{text-decoration:underline}`;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

// mount once; returns update({ rows, signedIn, loading, onNew, signIn, treesLast, folState, everyone }) — call it on every render
export function mountLibrary(el, onOpen){
  if (!document.getElementById("libcss")) document.head.insertAdjacentHTML("beforeend", `<style id="libcss">${CSS}</style>`);
  el.innerHTML = `<div class="ltabs" role="tablist"><button id="tmine" role="tab">My collection</button><button id="tfol" role="tab">Follows</button><button id="tall" role="tab">Everyone</button><button id="tfind" role="tab">Search everyone</button></div>
    <p class="lnote" id="nosign" hidden><i><button id="lsign">Sign in</button> to keep your own collection.</i></p>
    <div id="pmine" role="tabpanel"></div>
    <div id="pfol" role="tabpanel" hidden></div>
    <div id="pall" role="tabpanel" hidden>
      <input id="qa" type="search" placeholder="Search every timeline…" aria-label="Search every timeline">
      <div id="ares"></div>
    </div>
    <div id="pfind" role="tabpanel" hidden>
      <input id="q" type="search" placeholder="Filter by place, person or topic…" aria-label="Search everyone">
      <div id="fres"></div>
    </div>`;
  const $ = id => el.querySelector("#" + id), q = $("q"), qa = $("qa");
  let tab = null, key = "", o = null, was = false;
  const row = x => `<button class="lrow" data-d="${esc(x.d)}"><span><b>${esc(x.title)}</b><small>${esc(x.n == null ? (o.loading ? "…" : "") : [x.span, x.nTl ? plural(x.nTl, "timeline") : "", x.where ?? (x.n ? plural(x.n, "event") : "")].filter(Boolean).join(" · ") || (o.loading ? "…" : "empty"))}</small></span></button>`;
  const list = (xs, n) => { const w = xs.filter(x => x.tree), t = xs.filter(x => !x.tree), c = k => n ? ` <i>(${k})</i>` : "";
    const a = w.length ? `<h3>Timetrees${c(w.length)}</h3><p class="lplain">Groups of timelines</p>${w.map(row).join("")}` : "",
      b = t.length ? `<h3>Timelines${c(t.length)}</h3><p class="lplain">Lists of events</p>${t.map(row).join("")}` : "";
    return o.treesLast ? b + a : a + b; };
  function draw(){
    if (o.signedIn && !was) tab = null; was = o.signedIn;   // signing in lands on your own collection
    const cur = o.signedIn ? tab || "mine" : tab === "all" && o.everyone ? "all" : "find", s = q.value.trim().toLowerCase(), words = s.split(/\s+/).filter(Boolean);
    const has = (x, ws) => { const h = (x.title + " " + x.text).toLowerCase(); return ws.every(w => h.includes(w)); }, sa = qa.value.trim().toLowerCase();
    const byT = (a, b) => a.title.localeCompare(b.title), mine = o.rows.filter(x => x.mine).sort(byT);
    const added = o.rows.filter(x => x.wrote && !x.mine).sort(byT).map(x => ({ ...x, n:x.n ?? 0, where:plural(x.wrote, "card") + " by you" }));
    const fols = o.rows.filter(x => x.fol).sort(byT).map(x => ({ ...x, n:x.n ?? 0, where:`held by ${x.fol} you follow` }));
    const hits = o.rows.filter(x => has(x, words)).sort(byT);
    const alls = o.everyone ? o.rows.filter(x => has(x, sa.split(/\s+/).filter(Boolean))).sort((a, b) => b.at - a.at) : [];
    const top = alls.slice(0, 25).map(x => ({ ...x, n:x.n ?? 0, where:[x.copies === 1 ? "held by 1 person" : `held by ${x.copies} people`, x.n ? plural(x.n, "event") : ""].filter(Boolean).join(" · ") }));
    const k = cur + s + "\n" + sa + alls.length + !!o.onNew + o.loading + o.folState + [...mine, ...added, ...fols, ...hits, ...top].map(x => x.d + x.title + x.n + x.where + x.nTl + x.span).join("|"); if (k === key) return; key = k;   // same list → leave the DOM alone, hover and focus survive
    el.querySelector(".ltabs").style.display = o.signedIn || o.everyone ? "" : "none";   // signed out: only the lists of everyone's
    $("tmine").hidden = !o.signedIn; $("tall").hidden = !o.everyone; $("tall").setAttribute("aria-selected", cur === "all"); $("pall").hidden = cur !== "all";
    $("tmine").setAttribute("aria-selected", cur === "mine"); $("tfind").setAttribute("aria-selected", cur === "find"); $("tfol").setAttribute("aria-selected", cur === "fol");
    $("tfol").hidden = !o.folState || !o.signedIn;
    $("pmine").hidden = cur !== "mine"; $("pfind").hidden = cur !== "find"; $("pfol").hidden = cur !== "fol"; $("nosign").hidden = o.signedIn; $("lsign").disabled = !o.signIn;
    $("pmine").innerHTML = (mine.length || added.length ? list(mine) : `<p class="lnote"><i>None yet.</i></p>`) + (added.length ? `<h3>Cards you added</h3><p class="lplain">Timelines you wrote on, without a copy of your own</p>${added.map(row).join("")}` : "") + (o.onNew ? `<button class="lbig" id="newtl">New timeline</button>` : "");
    $("pfol").innerHTML = o.folState === "nokey" ? `<p class="lnote"><i>Sign in with your nostr key to see the timelines people you follow keep.</i></p>`
      : fols.length ? list(fols) : `<p class="lnote"><i>${o.folState === "loading" ? "Looking…" : "None of the people you follow keep a timeline yet."}</i></p>`;
    $("ares").innerHTML = top.length ? top.map(row).join("") + (alls.length > 25 ? `<p class="lnote"><i>Newest 25 of ${alls.length}. Type to find the rest.</i></p>` : "")
      : `<p class="lnote">${o.loading ? "Looking…" : sa ? `Nothing found for “${esc(sa)}”.` : "No timelines yet."}</p>`;
    $("fres").innerHTML = hits.length ? list(hits, true) : `<p class="lnote">${o.loading ? "Looking…" : s ? `Nothing found for “${esc(s)}”.` : "No timelines yet."}</p>`;
  }
  $("tmine").onclick = () => { tab = "mine"; draw(); }; $("tfol").onclick = () => { tab = "fol"; draw(); }; $("tall").onclick = () => { tab = "all"; draw(); }; $("tfind").onclick = () => { tab = "find"; draw(); q.focus(); };
  q.oninput = qa.oninput = draw;
  el.addEventListener("click", e => { const b = e.target.closest(".lrow"); if (b) return onOpen(b.dataset.d, b.closest("[role=tabpanel]").id.slice(1));   // which tab: mine · fol · all · find
    if (e.target.id === "newtl") o.onNew(); if (e.target.id === "lsign") o.signIn(); });
  return opts => { o = opts; draw(); };
}

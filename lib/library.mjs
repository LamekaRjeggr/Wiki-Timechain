// The Library: the one menu both readers open with. My collection = the timelines you keep as a
// notary; Search everyone = all of them, and typing filters. Timetrees always first.
// The page owns the data and hands rows over: { d, title, text, n, nTl, tree, mine }.
// n = null: count not known yet. Colors are the page's own: --bg --panel --line --t0 --t1 --t2.
const CSS = `
#lib{width:100%;max-width:720px;margin:8px auto 60px;font:18px/1.45 var(--sans,ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);color:var(--t1)}
#lib button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
#lib .ltabs{display:flex;margin-bottom:14px} #lib .ltabs button{flex:1;padding:12px;font-size:19px;color:var(--t2);border-bottom:4px solid var(--line)}
#lib .ltabs button[aria-selected="true"]{color:var(--t0);font-weight:700;border-color:var(--t0)} #lib .ltabs button:disabled{opacity:.4;cursor:default}
#lib h3{margin:22px 0 0;font-size:20px;color:var(--t0);letter-spacing:0;text-transform:none} #lib h3 i{font-style:normal;font-weight:400;color:var(--t2)} #lib .lplain{margin:0 0 4px;font-size:16px;color:var(--t2)}
#lib .lrow{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:6px 14px;margin-top:8px;border:2px solid var(--line);border-radius:10px;background:var(--panel);text-align:left}
#lib .lrow:hover,#lib .lrow:focus-visible{border-color:var(--t1);outline:none} #lib .lrow b{display:block;font-size:19px;font-weight:600;color:var(--t0)} #lib .lrow small{display:block;font-size:15px;color:var(--t2)}
#lib .lgo,#lib .lbig{margin-left:auto;flex:none;font-weight:600;font-size:17px;color:var(--bg);background:var(--t1);border-radius:8px;padding:8px 18px} #lib .lbig{margin:22px 0 0}
#lib form{display:flex;gap:10px} #lib input{flex:1;min-width:0;font-family:inherit;font-size:19px;padding:12px 14px;border:2px solid var(--line);border-radius:10px;background:var(--panel);color:var(--t0)} #lib input:focus{outline:none;border-color:var(--t1)}
#lib .lnote{margin:24px 0 0;font-size:18px} #lib .lnote i{font-style:normal;color:var(--t2)} #lib .lnote button:enabled{text-decoration:underline}`;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

// mount once; returns update({ rows, signedIn, loading, onNew, signIn }) — call it on every render
export function mountLibrary(el, onOpen){
  if (!document.getElementById("libcss")) document.head.insertAdjacentHTML("beforeend", `<style id="libcss">${CSS}</style>`);
  el.innerHTML = `<div class="ltabs" role="tablist"><button id="tmine" role="tab">My collection</button><button id="tfind" role="tab">Search everyone</button></div>
    <p class="lnote" id="nosign" hidden><i><button id="lsign">Sign in</button> to keep your own collection.</i></p>
    <div id="pmine" role="tabpanel"></div>
    <div id="pfind" role="tabpanel" hidden>
      <form id="sform"><input id="q" type="search" placeholder="Filter by place, person or topic…" aria-label="Search everyone"><button class="lbig" style="margin:0">Search</button></form>
      <div id="fres"></div>
    </div>`;
  const $ = id => el.querySelector("#" + id), q = $("q");
  let tab = null, key = "", o = null, was = false;
  const row = x => `<button class="lrow" data-d="${esc(x.d)}"><span><b>${esc(x.title)}</b><small>${esc(x.n == null ? "" : [x.nTl ? plural(x.nTl, "timeline") : "", x.n ? plural(x.n, "event") : ""].filter(Boolean).join(" · ") || (o.loading ? "…" : "empty"))}</small></span><span class="lgo">Open</span></button>`;
  const list = (xs, n) => { const w = xs.filter(x => x.tree), t = xs.filter(x => !x.tree), c = k => n ? ` <i>(${k})</i>` : "";
    return (w.length || !n ? `<h3>Timetrees${c(w.length)}</h3><p class="lplain">Groups of timelines</p>${w.map(row).join("") || `<p class="lnote"><i>None yet.</i></p>`}` : "")
      + (t.length || !n ? `<h3>Timelines${c(t.length)}</h3><p class="lplain">Lists of events</p>${t.map(row).join("") || `<p class="lnote"><i>None yet.</i></p>`}` : ""); };
  function draw(){
    if (o.signedIn && !was) tab = null; was = o.signedIn;   // signing in lands on your own collection
    const cur = o.signedIn ? tab || "mine" : "find", s = q.value.trim().toLowerCase(), words = s.split(/\s+/).filter(Boolean);
    const byT = (a, b) => a.title.localeCompare(b.title), mine = o.rows.filter(x => x.mine).sort(byT);
    const hits = o.rows.filter(x => { const h = (x.title + " " + x.text).toLowerCase(); return words.every(w => h.includes(w)); }).sort(byT);
    const k = cur + s + !!o.onNew + o.loading + [...mine, ...hits].map(x => x.d + x.title + x.n + x.nTl).join("|"); if (k === key) return; key = k;   // same list → leave the DOM alone, hover and focus survive
    $("tmine").disabled = !o.signedIn; $("tmine").setAttribute("aria-selected", cur === "mine"); $("tfind").setAttribute("aria-selected", cur === "find");
    $("pmine").hidden = cur !== "mine"; $("pfind").hidden = cur !== "find"; $("nosign").hidden = o.signedIn; $("lsign").disabled = !o.signIn;
    $("pmine").innerHTML = list(mine) + (o.onNew ? `<button class="lbig" id="newtl">New timeline</button>` : "");
    $("fres").innerHTML = hits.length ? list(hits, true) : `<p class="lnote">${o.loading ? "Looking…" : s ? `Nothing found for “${esc(s)}”.` : "No timelines yet."}</p>`;
  }
  $("tmine").onclick = () => { tab = "mine"; draw(); }; $("tfind").onclick = () => { tab = "find"; draw(); q.focus(); };
  q.oninput = draw; $("sform").onsubmit = e => { e.preventDefault(); draw(); };
  el.addEventListener("click", e => { const b = e.target.closest(".lrow"); if (b) return onOpen(b.dataset.d);
    if (e.target.id === "newtl") o.onNew(); if (e.target.id === "lsign") o.signIn(); });
  return opts => { o = opts; draw(); };
}

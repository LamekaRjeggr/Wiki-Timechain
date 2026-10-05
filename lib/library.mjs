// The Library: the one menu both readers open with. My collection = the timelines you keep as a
// notary; Follows = the ones people you follow keep; Everyone = every name, newest activity first, 25 shown, typing searches all. Timetrees first.
// here = this page's name; other = { name, url(d, tab), lit } the other view, so a tap can open there instead (the switch under the list; lit = the person came from it, so it starts on). onNew({ title, summary }, away) = the page makes the timeline; the Library asks for both in its own form. pick = { title, self, has(d), was } turns a tap into add/remove for that timetree (bar + Done on top, onDone(away); was = the names it held when picking began, listed first as "In this tree"). onEdit(d) = an edit button on your own timetrees in My collection. away = the switch is on the other view: the page opens what it made there. The page owns the data and hands rows over: { d, title, text, n, nTl, tree, mine, wrote, fol, copies, at, span, where }. wrote = cards you added to it; fol = how many you follow keep it; copies = how many keep it at all; at = its newest activity.
// n = null: count not known yet, shown as "…" while loading — a page passes a count only once every relay has sent all it has, or with checking = true while counts from the saved copy wait on the relays (grayed); span = the years it covers, when the page knows them; where = words that take the event count's place (the dots page on local: N waiting); tab = { mine, fol } of { tree, nTl, n } — a timetree as that tab counts its picks, when it differs. Colors are the page's own: --bg --panel --line --t0 --t1 --t2, and --pick (orange) for the tab you chose.
const CSS = `
#lib{width:100%;max-width:720px;margin:8px auto 60px;font:18px/1.45 var(--sans,ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif);color:var(--t1)}
#lib button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
#lib .ltabs{display:flex;margin-bottom:14px} #lib .ltabs button{flex:1 1 0;min-width:0;padding:12px 4px;font-size:clamp(15px,4vw,19px);color:var(--t2);border-bottom:4px solid var(--line)}
#lib .ltabs button[aria-selected="true"]{color:var(--pick);font-weight:700;border-color:var(--pick)} #lib .ltabs button:disabled{opacity:.4;cursor:default}
#lib h3{margin:22px 0 0;font-size:20px;color:var(--t0);letter-spacing:0;text-transform:none} #lib h3 i{font-style:normal;font-weight:400;color:var(--t2)} #lib .lplain{margin:0 0 4px;font-size:16px;color:var(--t2)}
#lib .lrow{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:6px 14px;margin-top:8px;border:2px solid var(--line);border-radius:10px;background:var(--panel);text-align:left}
#lib .lrow:hover,#lib .lrow:focus-visible{border-color:var(--t1);outline:none} #lib .lrow b{display:block;font-size:19px;font-weight:600;color:var(--t0)} #lib .lrow small{display:block;font-size:15px;color:var(--t2)}
#lib .lg{color:var(--pick);width:1em;text-align:center;flex:none} #lib .lok{margin-left:auto;font:600 15px inherit;color:var(--pick);font-style:normal;white-space:nowrap}
#lib .lrw{display:flex;gap:8px} #lib .lrw .lrow{flex:1} #lib .ledit{margin-top:8px;padding:0 14px;border:2px solid var(--line);border-radius:10px;font-size:16px;color:var(--t2)} #lib .ledit:hover{border-color:var(--t1);color:var(--t1)}
#lib .lpick{display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:14px;border:2px solid var(--pick);border-radius:10px} #lib .lpick span{flex:1} #lib .lpick .lbig{margin:0}
.lform{display:grid;gap:8px;margin:0 0 14px;font:18px/1.45 var(--sans,ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif)} .lform div{display:flex;gap:16px;align-items:center}
.lform button{font:inherit;cursor:pointer;border:0;background:none;color:var(--t1);padding:0}
#lib .lbig,.lform .lbig{margin:0 0 14px;font-weight:600;font-size:17px;color:var(--bg);background:var(--t1);border-radius:8px;padding:8px 18px} .lform .lbig{margin:0}
#lib input,.lform input{box-sizing:border-box;width:100%;font-family:inherit;font-size:19px;padding:12px 14px;border:2px solid var(--line);border-radius:10px;background:var(--panel);color:var(--t0)} #lib input:focus,.lform input:focus{outline:none;border-color:var(--t1)}
#lib .lview{display:flex;align-items:center;gap:8px;margin:24px 0 0;font-size:16px;color:var(--t2)} #lib .lview button{padding:4px 12px;border:2px solid var(--line);border-radius:8px}
#lib .lview button[aria-pressed="true"]{color:var(--pick);border-color:var(--pick);font-weight:700}
#lib.lchk .lrow small{opacity:.5} #lib .lchk{margin:0 0 10px;font-size:15px;color:var(--t2)}
#lib:not([hidden]){display:flex;flex-direction:column} #lib #nosign{order:1}   /* sign-in waits under the list: read first */
#lib .lnote{margin:24px 0 0;font-size:18px} #lib .lnote i{font-style:normal;color:var(--t2)} #lib .lnote button:enabled{text-decoration:underline}`;

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`, css = () => document.getElementById("libcss") || document.head.insertAdjacentHTML("beforeend", `<style id="libcss">${CSS}</style>`);   // the styles go in once, whichever part mounts first

// the title + one-line summary form: New timeline in the Library, retitle in a page's header. done({ title, summary }) on save, done(null) on cancel
export function headForm(host, { title = "", summary = "", save = "Create" }, done){
  css();
  host.innerHTML = `<form class="lform"><input name="t" placeholder="Title" aria-label="Title" required value="${esc(title)}"><input name="s" placeholder="One line: what it gathers" aria-label="Summary" value="${esc(summary)}">
    <div><button class="lbig">${save}</button><button type="button" class="lx">Cancel</button></div></form>`;
  const f = host.firstChild; f.t.focus();
  f.onsubmit = e => { e.preventDefault(); const t = f.t.value.trim(); if (t) done({ title:t, summary:f.s.value.trim() }); };
  f.querySelector(".lx").onclick = () => done(null);
}

// mount once; returns update({ rows, signedIn, loading, checking, signIn, folState, here, other, onNew, pick, onDone, onEdit }) — call it on every render
export function mountLibrary(el, onOpen){
  css();
  el.innerHTML = `<div id="ltop"></div><div id="lin"></div><p class="lchk" id="lchk" hidden>Saved copy · checking the relays…</p><div class="ltabs" role="tablist"><button id="tmine" role="tab">My collection</button><button id="tfol" role="tab">Follows</button><button id="tall" role="tab">Everyone</button></div>
    <p class="lnote" id="nosign" hidden><i><button id="lsign">Sign in</button> to keep your own collection.</i></p>
    <div id="pmine" role="tabpanel"></div>
    <div id="pfol" role="tabpanel" hidden></div>
    <div id="pall" role="tabpanel" hidden>
      <input id="qa" type="search" placeholder="Search every timeline…" aria-label="Search every timeline">
      <div id="ares"></div>
    </div>
    <div class="lview" id="lview" hidden>Open in <button id="vhere" aria-pressed="true"></button><button id="vother" aria-pressed="false"></button></div>
`;
  const $ = id => el.querySelector("#" + id), qa = $("qa");
  let tab = null, key = "", o = null, was = false, wasPick = false, making = false, topK = "", away = false;   // away: a tap opens the other view   // making: the New timeline form is open
  const row = x => (x.edit ? `<div class="lrw">` : "") + `<button class="lrow" data-d="${esc(x.d)}"><span class="lg" aria-hidden="true">${x.tree ? "▲" : "●"}</span><span><b>${esc(x.title)}</b><small>${esc(x.n == null ? (o.loading ? "…" : "") : [x.span, x.nTl ? plural(x.nTl, "timeline") : "", x.where ?? (x.n ? plural(x.n, "event") : "")].filter(Boolean).join(" · ") || (o.loading ? "…" : "empty"))}</small></span>${o.pick?.has(x.d) ? `<em class="lok">✓ added</em>` : ""}</button>` + (x.edit ? `<button class="ledit" data-edit="${esc(x.d)}">edit</button></div>` : "");
  const group = (xs, h, p) => xs.length ? `<h3>${h}</h3><p class="lplain">${p}</p>${xs.map(row).join("")}` : "";
  const list = xs => group(xs.filter(x => x.tree), "Timetrees", "Groups of timelines") + group(xs.filter(x => !x.tree), "Timelines", "Lists of events");
  function draw(){
    if (o.signedIn && !was) tab = null; was = o.signedIn; if (o.pick && !wasPick) tab = "all"; wasPick = !!o.pick;   // picking opens on every timeline   // signing in lands on your own collection, or on Everyone while it is empty
    const cur = !o.signedIn ? "all" : tab || (o.loading || o.rows.some(x => x.mine || x.wrote) ? "mine" : "all"), sa = qa.value.trim().toLowerCase(), words = sa.split(/\s+/).filter(Boolean);
    const byT = (a, b) => a.title.localeCompare(b.title), rows = o.pick ? o.rows.filter(x => x.d !== o.pick.self) : o.rows, mine = rows.filter(x => x.mine).map(x => ({ ...x, ...x.tab?.mine })).map(x => ({ ...x, edit:x.tree && !!o.onEdit && !o.pick })).sort(byT);
    const inT = o.pick ? rows.filter(x => o.pick.was?.has(x.d) || o.pick.has(x.d)).sort(byT) : [];   // what the tree holds, on top: one tap takes one out
    const added = rows.filter(x => x.wrote && !x.mine).sort(byT).map(x => ({ ...x, n:x.n ?? 0, where:plural(x.wrote, "card") + " by you" }));
    const fols = rows.filter(x => x.fol).sort(byT).map(x => ({ ...x, ...x.tab?.fol, n:(x.tab?.fol ?? x).n ?? 0, where:`held by ${x.fol} you follow` }));
    const alls = rows.filter(x => { const h = (x.title + " " + x.text).toLowerCase(); return words.every(w => h.includes(w)); }).sort((a, b) => (b.at || 0) - (a.at || 0) || byT(a, b));
    const top = alls.slice(0, 25).map(x => x.copies > 1 ? { ...x, n:x.n ?? 0, where:[`held by ${x.copies} people`, x.where ?? (x.n ? plural(x.n, "event") : "")].filter(Boolean).join(" · ") } : x);
    const k = cur + making + away + o.other?.name + sa + alls.length + !!o.onNew + o.loading + o.checking + o.folState + [...inT, ...mine, ...added, ...fols, ...top].map(x => x.d + x.title + x.n + x.where + x.nTl + x.span + !!o.pick?.has(x.d) + !!x.edit).join("|") + (o.pick?.title ?? ""); if (k === key) return; key = k;   // same list → leave the DOM alone, hover and focus survive
    el.classList.toggle("lchk", !!o.checking); $("lchk").hidden = !o.checking;
    el.querySelector(".ltabs").style.display = o.signedIn ? "" : "none";   // signed out, the only list is everyone's
    $("tall").setAttribute("aria-selected", cur === "all"); $("pall").hidden = cur !== "all";
    $("tmine").setAttribute("aria-selected", cur === "mine"); $("tfol").setAttribute("aria-selected", cur === "fol");
    $("pmine").hidden = cur !== "mine"; $("pfol").hidden = cur !== "fol"; $("nosign").hidden = o.signedIn; $("lsign").disabled = !o.signIn;
    $("lview").hidden = !o.other || !!o.pick; if (o.other){ $("vhere").textContent = o.here; $("vother").textContent = o.other.name;
      $("vhere").setAttribute("aria-pressed", !away); $("vother").setAttribute("aria-pressed", away); }
    const tk = o.pick ? "p" + o.pick.title : making && o.onNew ? "f" : o.onNew ? "n" : ""; if (tk !== topK){ topK = tk;   // the form is drawn once: a redraw would wipe what is typed
      if (tk === "f") headForm($("ltop"), {}, v => { making = false; if (v) o.onNew(v, away); draw(); });
      else $("ltop").innerHTML = o.pick ? `<div class="lpick"><span>Editing <b>▲ ${esc(o.pick.title)}</b></span><button class="lbig" id="ldone">Done</button></div>` : o.onNew ? `<button class="lbig" id="newtl">+ New timeline</button>` : ""; }
    $("lin").innerHTML = inT.length ? `<h3>In this tree</h3><p class="lplain">Tap one to take it out</p>${inT.map(row).join("")}<h3>Add more</h3>` : "";
    $("pmine").innerHTML = (mine.length || added.length ? list(mine) : `<p class="lnote"><i>None yet.</i></p>`) + (added.length ? `<h3>Cards you added</h3><p class="lplain">Timelines you wrote on, without a copy of your own</p>${added.map(row).join("")}` : "");
    $("pfol").innerHTML = o.folState === "nokey" ? `<p class="lnote"><i>Sign in with your nostr key to see the timelines people you follow keep.</i></p>`
      : fols.length ? list(fols) : `<p class="lnote"><i>${o.folState === "loading" ? "Looking…" : "None of the people you follow keep a timeline yet."}</i></p>`;
    $("ares").innerHTML = top.length ? list(top) + (alls.length > 25 ? `<p class="lnote"><i>Newest 25 of ${alls.length}. Type to find the rest.</i></p>` : "")
      : `<p class="lnote">${o.loading ? "Looking…" : sa ? `Nothing found for “${esc(sa)}”.` : "No timelines yet."}</p>`;
  }
  $("tmine").onclick = () => { tab = "mine"; draw(); }; $("tfol").onclick = () => { tab = "fol"; draw(); }; $("tall").onclick = () => { tab = "all"; draw(); };
  qa.oninput = draw;
  el.addEventListener("click", e => { const b = e.target.closest(".lrow"); const tab = b?.closest("[role=tabpanel]")?.id.slice(1); if (b && away && o.other && !o.pick) return void (location.href = o.other.url(b.dataset.d, tab)); if (b) return onOpen(b.dataset.d, tab);   // which tab: mine · fol · all
    if (e.target.id === "vhere" || e.target.id === "vother"){ away = e.target.id === "vother"; draw(); }
    if (e.target.id === "newtl"){ making = true; draw(); } if (e.target.id === "ldone") o.onDone(away); if (e.target.id === "lsign") o.signIn(); if (e.target.dataset.edit) o.onEdit(e.target.dataset.edit); });
  return opts => { if (!o && opts.other?.lit) away = true; o = opts; draw(); };
}

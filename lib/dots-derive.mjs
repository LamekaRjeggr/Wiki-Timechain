// What a dot is. One notary context → a list of dots: gold = the notary's projection for a
// slot (its selected registers, the snapshot filling what was never selected), blue = a live
// card under that context whose bytes the projection does not carry. Pure; no DOM, no relay.

const val = (r, snap, f) => r[f]?.state === "selected" ? r[f].value : blockOf(snap, f);
const blockOf = (snap, f) => f === "content" ? snap.content : snap.tags.filter(t => t[0] === f).map(t => t.slice());
const text = (v) => typeof v === "string" ? v : (v[0]?.[1] ?? "");

// projections: fold8828().projections; cards: live 30828 events (newest per pubkey:d)
export function dotsOf(context, projections, cards){
  const out = [], taken = new Set();
  for (const p of projections){
    if (p.context !== context) continue;
    const regs = p.registers, sel = Object.values(regs).filter(r => r.state === "selected");
    if (!sel.length) continue;
    const snap = sel[sel.length - 1].snapshot;                 // any selected snapshot names the subject
    sel.forEach(r => taken.add(r.sourceEventId));
    out.push({ kind:"acc", d:p.slot, id:snap.id, author:snap.pubkey, created_at:snap.created_at,
      date:text(val(regs, snap, "event_date")), time:text(val(regs, snap, "event_time")),
      title:text(val(regs, snap, "title")), summary:text(val(regs, snap, "summary")),
      content:text(val(regs, snap, "content")), tags:snap.tags });
  }
  for (const ev of cards){
    const sub = ev.tags.find(t => t[0] === "a" && t[1] === context);
    if (!sub || taken.has(ev.id)) continue;
    const t = f => (ev.tags.find(x => x[0] === f) || [])[1] || "";
    out.push({ kind:"sub", d:t("d"), id:ev.id, author:ev.pubkey, created_at:ev.created_at,
      date:t("event_date"), time:t("event_time"), title:t("title"), summary:t("summary"),
      content:ev.content, tags:ev.tags });
  }
  return out.filter(x => /^\d{4}-\d{2}-\d{2}/.test(x.date))
            .sort((a, b) => a.date.localeCompare(b.date) || a.created_at - b.created_at);
}

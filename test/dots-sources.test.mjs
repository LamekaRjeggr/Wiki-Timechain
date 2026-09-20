import assert from "node:assert/strict";
import test from "node:test";
import { sourcesOf, viaOf } from "../lib/dots-derive.mjs";

const PK = "a".repeat(64), PS = "b".repeat(64), PT = "c".repeat(64);
const ME = "30829:" + PK + ":tl", S1 = "30829:" + PS + ":tl", S2 = "30829:" + PT + ":other";
const notary = (pk, d, a = []) => ({ id: pk.slice(0, 8), pubkey: pk, kind: 30829, created_at: 1, content: "", tags: [["d", d], ["title", d], ...a.map(c => ["a", c])], sig: "" });
const card = (id, d, date, title, ctx) => ({ id, pubkey: PT, created_at: 1, kind: 30828, tags: [["d", d], ["event_date", date], ["title", title], ["a", ctx]], content: "body", sig: "" });
const sel = (snapshot, f) => ({ state: "selected", value: snapshot.tags.filter(t => t[0] === f), sourceActId: "x", sourceEventId: snapshot.id, snapshot });
const unset = { state: "unset" };
const proj = (context, c) => ({ context, slot: c.tags[0][1], registers: { title: sel(c, "title"), summary: unset, content: unset, event_date: sel(c, "event_date"), event_time: unset, g: unset } });

test("sourcesOf: 30829 coords on `a`, deduped, self and card coords dropped", () => {
  const n = notary(PK, "tl", [S1, S1, S2, ME, "30828:" + PT + ":x"]);
  assert.deepEqual(sourcesOf(n), [S1, S2]);
  assert.deepEqual(sourcesOf(notary(PK, "tl")), []);
});

test("viaOf: a source's accepted card is a via dot naming the source; its submissions are not", () => {
  const c1 = card("1".repeat(64), "d1", "2026-01-02", "Held", S1), c2 = card("2".repeat(64), "d2", "2026-01-03", "Only submitted", S1);
  const notaries = new Map([[ME, notary(PK, "tl", [S1])], [S1, notary(PS, "tl")]]);
  const dots = viaOf(ME, notaries, [proj(S1, c1)], [c1, c2]);
  assert.deepEqual(dots.map(x => [x.kind, x.title, x.via]), [["via", "Held", [S1]]]);
});

test("viaOf: two sources holding one card = one dot, both named; an id the context shows itself is skipped", () => {
  const c1 = card("1".repeat(64), "d1", "2026-01-02", "Held", S1);
  const notaries = new Map([[ME, notary(PK, "tl", [S1, S2])], [S1, notary(PS, "tl")], [S2, notary(PT, "other")]]);
  const ps = [proj(S1, c1), proj(S2, c1)];
  assert.deepEqual(viaOf(ME, notaries, ps, [c1]).map(x => x.via), [[S1, S2]]);
  assert.deepEqual(viaOf(ME, notaries, ps, [c1], new Set([c1.id])), []);
});

test("viaOf: one hop only — a source's source is not walked; unknown context = nothing", () => {
  const c1 = card("1".repeat(64), "d1", "2026-01-02", "Far", S2);
  const notaries = new Map([[ME, notary(PK, "tl", [S1])], [S1, notary(PS, "tl", [S2])], [S2, notary(PT, "other")]]);
  assert.deepEqual(viaOf(ME, notaries, [proj(S2, c1)], [c1]), []);
  assert.deepEqual(viaOf("30829:" + PS + ":nope", notaries, [], []), []);
});

import assert from "node:assert/strict";
import test from "node:test";
import { dotsOf } from "../lib/dots-derive.mjs";

const PK = "a".repeat(64), CTX = "30829:" + PK + ":tl";
const card = (id, d, date, title, extra = {}) => ({ id, pubkey: extra.pk || PK, created_at: extra.at || 1, kind: 30828,
  tags: [["d", d], ["event_date", date], ["title", title], ["a", CTX]], content: extra.content || "body " + id, sig: "" });
const sel = (snapshot, f) => ({ state: "selected", value: f === "content" ? snapshot.content : snapshot.tags.filter(t => t[0] === f), sourceActId: "x", sourceEventId: snapshot.id, snapshot });
const unset = { state: "unset" };

test("accepted version is one gold dot, its live card does not double as blue", () => {
  const c1 = card("1".repeat(64), "d1", "2026-01-02", "First");
  const regs = { title: sel(c1, "title"), summary: unset, content: sel(c1, "content"), event_date: sel(c1, "event_date"), event_time: unset, g: unset };
  const dots = dotsOf(CTX, [{ context: CTX, slot: "d1", registers: regs }], [c1]);
  assert.deepEqual(dots.map(x => x.kind), ["acc"]);
  assert.equal(dots[0].title, "First"); assert.equal(dots[0].content, "body " + c1.id);
});

test("a revised live card under an accepted d is a blue dot beside the gold one", () => {
  const c1 = card("1".repeat(64), "d1", "2026-01-02", "First");
  const c2 = card("2".repeat(64), "d1", "2026-01-02", "First, edited", { at: 5 });
  const regs = { title: sel(c1, "title"), summary: unset, content: unset, event_date: sel(c1, "event_date"), event_time: unset, g: unset };
  const dots = dotsOf(CTX, [{ context: CTX, slot: "d1", registers: regs }], [c2]);
  assert.deepEqual(dots.map(x => [x.kind, x.title]), [["acc", "First"], ["sub", "First, edited"]]);
  assert.equal(dots[0].content, "body " + c1.id, "unselected field falls back to the snapshot");
});

test("cards under another context or without a date are not dots", () => {
  const other = card("3".repeat(64), "d3", "2026-03-03", "Elsewhere"); other.tags[3] = ["a", "30829:" + PK + ":zz"];
  const undated = card("4".repeat(64), "d4", "soon", "No date");
  assert.deepEqual(dotsOf(CTX, [], [other, undated]), []);
});

test("sorted by event_date, then by created_at", () => {
  const a = card("5".repeat(64), "da", "2026-02-01", "B", { at: 9 }), b = card("6".repeat(64), "db", "2026-01-01", "A"), c = card("7".repeat(64), "dc", "2026-02-01", "C", { at: 3 });
  assert.deepEqual(dotsOf(CTX, [], [a, b, c]).map(x => x.title), ["A", "C", "B"]);
});

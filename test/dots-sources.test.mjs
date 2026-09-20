import assert from "node:assert/strict";
import test from "node:test";
import { sourcesOf, sourceSubjects } from "../lib/dots-derive.mjs";

const PK = "a".repeat(64), PS = "b".repeat(64), PT = "c".repeat(64);
const ME = "30829:" + PK + ":tl", S1 = "30829:" + PS + ":tl", S2 = "30829:" + PT + ":other";
const notary = (pk, d, a = []) => ({ id: pk.slice(0, 8), pubkey: pk, kind: 30829, created_at: 1, content: "", tags: [["d", d], ["title", d], ...a.map(c => ["a", c])], sig: "" });

test("sourcesOf: 30829 coords on `a`, deduped, self and card coords dropped", () => {
  const n = notary(PK, "tl", [S2, S2, ME, "30828:" + PT + ":x"]);
  assert.deepEqual(sourcesOf(n), [S2]);
  assert.deepEqual(sourcesOf(notary(PK, "tl")), []);
});

test("sourcesOf: a coord with my own d is not a source, whoever signed it", () => {
  assert.deepEqual(sourcesOf(notary(PK, "tl", [S1, S2])), [S2]);
});

test("sourceSubjects: the distinct subjects my notaries tether, one hop, self dropped", () => {
  const D2 = "30829:" + PS + ":other", MID = "30829:" + PS + ":mid";
  assert.deepEqual(sourceSubjects([notary(PK, "tl", [S2, D2, S1]), notary(PS, "tl", [MID, S2])]), ["other", "mid"]);
  assert.deepEqual(sourceSubjects([]), []);
});

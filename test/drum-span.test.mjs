import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = html.match(/function spanOf\(raw, raw2 = null\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(source, "spanOf must remain extractable from index.html");
const spanOf = Function(`${source}; return spanOf`)();

test("spanOf combines mixed year and month precision", () => {
  assert.equal(spanOf("2003", "2004-06"), "2003-01-01/2004-06-30");
});

test("spanOf combines month and day precision", () => {
  assert.equal(spanOf("2003-02", "2004-06-15"), "2003-02-01/2004-06-15");
});

test("spanOf combines day and year precision", () => {
  assert.equal(spanOf("2003-02-03", "2004"), "2003-02-03/2004-12-31");
});

test("spanOf rejects an end whose upper bound is before the start lower bound", () => {
  assert.equal(spanOf("2003-06-15", "2003-05"), "");
});

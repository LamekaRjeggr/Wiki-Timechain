import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = html.match(/function spanOf\(raw, raw2 = null\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(source, "spanOf must remain extractable from index.html");
const spanOf = Function(`${source}; return spanOf`)();
const coverSource = html.match(/function rangeCover\(dates, i\)\{[\s\S]*?\n\}/)?.[0];
assert.ok(coverSource, "rangeCover must remain extractable from index.html");
const rangeCover = Function(`${coverSource}; return rangeCover`)();

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

test("rangeCover leaves a single day at its own index", () => {
  assert.equal(rangeCover(["2003-01-01", "2003-02-01"], 0), 0);
});

test("rangeCover includes following cards whose starts fall within a year range", () => {
  const dates = ["2003-01-01/2003-12-31", "2003-03-01/2003-03-31", "2003-11-01", "2004-01-01"];
  assert.equal(rangeCover(dates, 0), 2);
});

test("rangeCover leaves a range with no following card inside at its own index", () => {
  assert.equal(rangeCover(["2003-01-01/2003-01-31", "2003-02-01"], 0), 0);
});

test("rangeCover leaves the last entry at its own index", () => {
  assert.equal(rangeCover(["2003-01-01", "2003-02-01/2003-02-28"], 1), 1);
});

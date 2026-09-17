import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { fold8828 } from "../lib/fold-8828.mjs";
import { foldBlind } from "../lib/fold-8828-blind.mjs";
import { arrivalOrders } from "./fixtures/8828-fold-vector.mjs";
import { valid, invalid, expectedRefusals } from "./fixtures/8828-refusal-vector.mjs";

const verifyFixtureEvent = () => true;
const hash = x => createHash("sha256").update(JSON.stringify(x)).digest("hex");
const reducers = [["fold8828", fold8828], ["foldBlind", foldBlind]];

for (const [name, fold] of reducers) {
  const baseline = fold(arrivalOrders.chronological, { verifyEvent: verifyFixtureEvent });

  test(`${name}: refusals fold as a set and touch no register`, () => {
    const result = fold(valid, { verifyEvent: verifyFixtureEvent });
    assert.deepEqual(result.rejectedActs, []);
    assert.deepEqual(result.refusals, expectedRefusals);
    assert.equal(hash(result.projections), hash(baseline.projections), "a refusal changed a projection");
  });

  test(`${name}: refusal result is arrival-order independent`, () => {
    const forward = fold(valid, { verifyEvent: verifyFixtureEvent });
    const backward = fold([...valid].reverse(), { verifyEvent: verifyFixtureEvent });
    assert.equal(hash(forward.refusals), hash(backward.refusals));
  });

  test(`${name}: no refusals means an empty set`, () => {
    assert.deepEqual(baseline.refusals, []);
  });

  for (const vector of invalid) {
    test(`${name} rejects ${vector.name} (${vector.spec})`, () => {
      const result = fold([...valid, vector.event], { verifyEvent: verifyFixtureEvent });
      assert.ok(result.rejectedActs.some(r => r.event.id === vector.event.id), `${vector.name} was not rejected`);
      assert.deepEqual(result.refusals, expectedRefusals, `${vector.name} changed the refusal set`);
      assert.equal(hash(result.projections), hash(baseline.projections), `${vector.name} changed a projection`);
    });
  }
}

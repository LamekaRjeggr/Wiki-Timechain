import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { fold8828 } from "../lib/fold-8828.mjs";
import { foldBlind } from "../lib/fold-8828-blind.mjs";
import { arrivalOrders } from "./fixtures/8828-fold-vector.mjs";
import { invalid } from "./fixtures/8828-reject-vector.mjs";

const verifyFixtureEvent = () => true;
const reducers = [
  ["fold8828", fold8828],
  ["foldBlind", foldBlind],
];

function projectionHash(projections) {
  return createHash("sha256").update(JSON.stringify(projections)).digest("hex");
}

for (const [reducerName, fold] of reducers) {
  const baseline = fold(arrivalOrders.chronological, {
    verifyEvent: verifyFixtureEvent,
  });
  const baselineHash = projectionHash(baseline.projections);

  for (const vector of invalid) {
    test(`${reducerName} rejects ${vector.name} (${vector.spec})`, () => {
      const result = fold([...arrivalOrders.chronological, vector.event], {
        verifyEvent: verifyFixtureEvent,
      });
      const rejectedIds = result.rejectedActs.map(rejection => rejection.event.id);

      assert.ok(
        rejectedIds.includes(vector.event.id),
        `${reducerName} did not reject ${vector.name}`,
      );
      assert.equal(
        projectionHash(result.projections),
        baselineHash,
        `${vector.name} changed the valid acts' projection`,
      );
    });
  }
}

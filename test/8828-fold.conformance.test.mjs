import assert from "node:assert/strict";
import test from "node:test";

import { fold8828 } from "../lib/fold-8828.mjs";
import {
  CONTEXT,
  SLOT,
  acts,
  arrivalOrders,
  expectedRegisters,
} from "./fixtures/8828-fold-vector.mjs";

// The fixture uses deterministic placeholder ids/signatures. Cryptographic event
// verification belongs to separate NIP-01 tests; this injected verifier keeps this
// vector narrowly about validation shape, causal ordering, and register reduction.
const verifyFixtureEvent = () => true;

function observableRegisters(registers) {
  return Object.fromEntries(Object.entries(registers).map(([field, register]) => {
    if (register.state === "unset") return [field, { state: "unset", source: null }];
    return [field, {
      state: register.state,
      value: register.value,
      source: register.sourceActId,
    }];
  }));
}

for (const [orderName, events] of Object.entries(arrivalOrders)) {
  test(`8828 fold converges for ${orderName} arrival`, () => {
    const result = fold8828(events, { verifyEvent: verifyFixtureEvent });

    assert.deepEqual(result.rejectedActs, []);
    assert.equal(result.acceptedActs.length, 6);
    assert.deepEqual(result.ignoredEvents.map(event => event.id), [acts.K5.id]);
    assert.equal(result.projections.length, 1);

    const projection = result.projections[0];
    assert.equal(projection.context, CONTEXT);
    assert.equal(projection.slot, SLOT);
    assert.deepEqual(observableRegisters(projection.registers), expectedRegisters);
  });
}

test("vector pins the equal-time id tie-break and causal backdated revoke", () => {
  assert.equal(acts.B.created_at, acts.C.created_at);
  assert.ok(acts.B.id < acts.C.id, "C must sort after B at the shared timestamp");
  assert.ok(
    acts.RF.created_at < acts.F.created_at,
    "the revoke must be timestamped before its target acceptance",
  );

  const { projections: [projection] } = fold8828(arrivalOrders.adversarial, {
    verifyEvent: verifyFixtureEvent,
  });

  // C wins B's summary register by event-id order and selects exact absence.
  assert.deepEqual(projection.registers.summary.value, []);
  assert.equal(projection.registers.summary.sourceActId, acts.C.id);

  // RB clears B's still-current title but cannot clear the summary replaced by C.
  assert.deepEqual(projection.registers.title, { state: "unset" });

  // RF is effective through its target edge even though its timestamp is earlier.
  assert.deepEqual(projection.registers.event_time, { state: "unset" });

  // A whole-card value remains when no later act names its register.
  assert.equal(projection.registers.g.sourceActId, acts.A.id);
});

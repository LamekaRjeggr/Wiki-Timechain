import test from "node:test";
import assert from "node:assert/strict";

import { foldBlind } from "../lib/fold-8828-blind.mjs";
import {
  CONTEXT,
  SLOT,
  arrivalOrders,
  expectedRegisters,
} from "./fixtures/8828-fold-vector.mjs";

function comparableRegisters(registers) {
  return Object.fromEntries(Object.entries(registers).map(([name, register]) => [
    name,
    register.state === "unset"
      ? { state: "unset", source: null }
      : { state: register.state, value: register.value, source: register.sourceActId },
  ]));
}

for (const [name, events] of Object.entries(arrivalOrders)) {
  test(`blind fold is conformant for ${name} arrival`, () => {
    const { projections, rejectedActs } = foldBlind(events, { verifyEvent: () => true });
    const projection = projections.find(item => item.context === CONTEXT && item.slot === SLOT);

    assert.ok(projection, "expected context and slot projection");
    assert.deepEqual(comparableRegisters(projection.registers), expectedRegisters);
    assert.deepEqual(rejectedActs, []);
  });
}

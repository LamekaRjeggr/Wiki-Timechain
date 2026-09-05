// This vector isolates reducer semantics. IDs and signatures are deterministic
// placeholders, accepted by the injected verifier in the conformance test; it is
// deliberately not a cryptographic NIP-01 fixture.

export const NOTARY = "11".repeat(32);
export const CONTEXT = `30829:${NOTARY}:test-lens`;
export const SLOT = "slot-x";

const sig = "aa".repeat(64);
const id = byte => byte.repeat(64);
const sourceKey = byte => byte.repeat(64);

function card(cardId, pubkey, created_at, tags, content) {
  return { id: cardId, pubkey, created_at, kind: 30828, tags, content, sig };
}

const base = card(id("a"), sourceKey("a"), 10, [
  ["d", SLOT],
  ["title", "Alpha"],
  ["summary", "Base summary"],
  ["event_date", "2026-01-01"],
  ["event_time", "09:00"],
  ["g", "9"],
  ["g", "9q"],
], "Base body");

const bravo = card(id("b"), sourceKey("b"), 20, [
  ["d", SLOT],
  ["title", "Bravo"],
  ["summary", "Bravo summary"],
], "Unused Bravo body");

const charlie = card(id("c"), sourceKey("c"), 30, [
  ["d", SLOT],
  // No summary tag: selecting tag:summary records exact selected absence.
], "Charlie body");

const foxtrot = card(id("f"), sourceKey("f"), 40, [
  ["d", SLOT],
  ["event_time", "17:30"],
], "Unused Foxtrot body");

function acceptance(actId, created_at, snapshot, selectors) {
  return {
    id: actId,
    pubkey: NOTARY,
    created_at,
    kind: 8828,
    tags: [
      ["a", CONTEXT, "", "context"],
      ["e", snapshot.id, "", "source"],
      ["snapshot", JSON.stringify(snapshot)],
      ...selectors.map(selector => ["select", selector]),
    ],
    content: "",
    sig,
  };
}

function revoke(actId, created_at, targetId) {
  return {
    id: actId,
    pubkey: NOTARY,
    created_at,
    kind: 8828,
    tags: [
      ["a", CONTEXT, "", "context"],
      ["e", targetId, "", "revoke"],
    ],
    content: "",
    sig,
  };
}

// B and C deliberately share a timestamp; B's id sorts before C's id.
export const acts = {
  A: acceptance(id("1"), 100, base, ["card"]),
  B: acceptance(id("2"), 200, bravo, ["tag:title", "tag:summary"]),
  C: acceptance(id("3"), 200, charlie, ["tag:summary", "content"]),
  RB: revoke(id("4"), 300, id("2")),
  // RF is backdated before its target F. Its target edge, not its timestamp,
  // makes it effective after F under the causal revoke rule.
  RF: revoke(id("5"), 400, id("6")),
  F: acceptance(id("6"), 500, foxtrot, ["tag:event_time"]),
  K5: {
    id: id("7"),
    pubkey: NOTARY,
    created_at: 600,
    kind: 5,
    tags: [["e", id("3")]],
    content: "test deletion that the 8828 fold must ignore",
    sig,
  },
};

export const arrivalOrders = {
  chronological: [acts.A, acts.B, acts.C, acts.RB, acts.RF, acts.F, acts.K5],
  reverse: [acts.K5, acts.F, acts.RF, acts.RB, acts.C, acts.B, acts.A],
  adversarial: [acts.K5, acts.RF, acts.C, acts.F, acts.B, acts.RB, acts.A],
};

export const expectedRegisters = {
  title: { state: "unset", source: null },
  summary: { state: "selected", value: [], source: acts.C.id },
  content: { state: "selected", value: "Charlie body", source: acts.C.id },
  event_date: {
    state: "selected",
    value: [["event_date", "2026-01-01"]],
    source: acts.A.id,
  },
  event_time: { state: "unset", source: null },
  g: {
    state: "selected",
    value: [["g", "9"], ["g", "9q"]],
    source: acts.A.id,
  },
};

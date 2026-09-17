// Refusal vector: same placeholder ids and injected verifier as the fold vector.
// A refusal hides one exact card version in one context and touches no register.
import { CONTEXT, NOTARY, acts } from "./8828-fold-vector.mjs";

const sig = "aa".repeat(64);
const id = byte => byte.repeat(64);
const OTHER_NOTARY = "22".repeat(32);
const base = JSON.parse(acts.A.tags.find(tag => tag[0] === "snapshot")[1]);
const bravo = JSON.parse(acts.B.tags.find(tag => tag[0] === "snapshot")[1]);

const act = (actId, created_at, tags, pubkey = NOTARY) =>
  ({ id: actId, pubkey, created_at, kind: 8828, tags, content: "", sig });
const refusal = (actId, created_at, targetId, selectors, pubkey) =>
  act(actId, created_at, [["a", CONTEXT, "", "context"], ["e", targetId, "", "refuse"], ...selectors.map(s => ["select", s])], pubkey);
const revoke = (actId, created_at, targetId, pubkey) =>
  act(actId, created_at, [["a", CONTEXT, "", "context"], ["e", targetId, "", "revoke"]], pubkey);

export const refusals = {
  R1: refusal(id("d"), 700, base.id, ["card"]),                  // whole-card refusal of the version A accepted: both stand
  R2: refusal(id("e"), 710, bravo.id, ["tag:title"]),            // one block of bravo hidden
  R3: refusal(id("f"), 720, bravo.id, ["tag:summary"]),          // a second refusal of the same version: fields pool
  RR3: revoke(id("9"), 600, id("f")),                            // backdated revoke of R3: order is irrelevant, R3 is lifted
};

export const valid = [...Object.values(acts), ...Object.values(refusals)];

export const expectedRefusals = [
  { context: CONTEXT, eventId: base.id, fields: ["title", "summary", "content", "event_date", "event_time", "g"], actIds: [refusals.R1.id] },
  { context: CONTEXT, eventId: bravo.id, fields: ["title"], actIds: [refusals.R2.id] },
];

const copy = (event, actId) => ({ ...structuredClone(event), id: actId });
export const invalid = [
  { name: "refusal carrying a snapshot", spec: "NIP-DRAFT-ACTS.md Refusal",
    event: (() => { const e = copy(refusals.R1, id("0")); e.tags.push(["snapshot", JSON.stringify(base)]); return e; })() },
  { name: "refusal carrying credit", spec: "NIP-DRAFT-ACTS.md Refusal",
    event: (() => { const e = copy(refusals.R1, id("0")); e.tags.push(["p", NOTARY, "", "credit"]); return e; })() },
  { name: "refusal beside a source edge", spec: "NIP-DRAFT-ACTS.md Validation 4",
    event: (() => { const e = copy(acts.A, id("0")); e.tags.push(["e", base.id, "", "refuse"]); return e; })() },
  { name: "refusal without a selector", spec: "NIP-DRAFT-ACTS.md Refusal",
    event: (() => { const e = copy(refusals.R1, id("0")); e.tags = e.tags.filter(t => t[0] !== "select"); return e; })() },
  { name: "refusal signer differs from context notary", spec: "NIP-DRAFT-ACTS.md Validation 3",
    event: { ...copy(refusals.R1, id("0")), pubkey: OTHER_NOTARY } },
  { name: "revoke of a refusal by another key", spec: "NIP-DRAFT-ACTS.md Validation 7",
    event: revoke(id("0"), 800, refusals.R1.id, OTHER_NOTARY) },
];

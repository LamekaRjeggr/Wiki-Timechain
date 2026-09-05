/**
 * Headless reducer for modular kind-8828 timeline acts.
 *
 * Cryptography is deliberately injected. `verifyEvent(event)` must synchronously
 * verify both the NIP-01 id and signature and return true or false.
 */

export const CORE_FIELDS = Object.freeze([
  "title",
  "summary",
  "content",
  "event_date",
  "event_time",
  "g",
]);

const SELECTOR_TO_FIELD = new Map([
  ["tag:title", "title"],
  ["tag:summary", "summary"],
  ["content", "content"],
  ["tag:event_date", "event_date"],
  ["tag:event_time", "event_time"],
  ["tag:g", "g"],
]);

const HEX_64 = /^[0-9a-f]{64}$/;
const HEX_128 = /^[0-9a-f]{128}$/;
const CONTEXT = /^30829:([0-9a-f]{64}):(.+)$/s;

function fail(code, detail) {
  return { ok: false, code, ...(detail === undefined ? {} : { detail }) };
}

function isStringTag(tag) {
  return Array.isArray(tag) && tag.length >= 1 && tag.every((part) => typeof part === "string");
}

function hasEventShape(event, expectedKind) {
  return event !== null
    && typeof event === "object"
    && !Array.isArray(event)
    && HEX_64.test(event.id)
    && HEX_64.test(event.pubkey)
    && Number.isSafeInteger(event.created_at)
    && event.created_at >= 0
    && event.kind === expectedKind
    && Array.isArray(event.tags)
    && event.tags.every(isStringTag)
    && typeof event.content === "string"
    && HEX_128.test(event.sig);
}

function verified(event, verifyEvent) {
  try {
    return verifyEvent(event) === true;
  } catch {
    return false;
  }
}

function tagsNamed(tags, name) {
  return tags.filter((tag) => tag[0] === name);
}

function oneMarked(tags, name, marker) {
  const matching = tags.filter((tag) => tag[0] === name && tag[3] === marker);
  return matching.length === 1 ? matching[0] : null;
}

function parseContext(tag) {
  if (!tag || tag.length !== 4 || tag[2] === undefined) return null;
  const match = CONTEXT.exec(tag[1]);
  if (!match) return null;
  return { coordinate: tag[1], pubkey: match[1], identifier: match[2] };
}

function snapshotSlot(snapshot) {
  const dTags = tagsNamed(snapshot.tags, "d");
  if (dTags.length !== 1 || dTags[0].length < 2 || dTags[0][1] === "") return null;
  return dTags[0][1];
}

function blockFromSnapshot(snapshot, field) {
  if (field === "content") return snapshot.content;
  return snapshot.tags
    .filter((tag) => tag[0] === field)
    .map((tag) => tag.slice());
}

function compareActs(left, right) {
  return left.createdAt - right.createdAt || left.id.localeCompare(right.id);
}

function emptyRegisters() {
  return Object.fromEntries(CORE_FIELDS.map((field) => [field, { state: "unset" }]));
}

/**
 * Structurally and cryptographically validate one 8828 event.
 *
 * This validates a revoke's own shape, but target-dependent checks are deferred
 * to `fold8828`, where the complete event set is available.
 */
export function validateAct(event, { verifyEvent, strictTags = true } = {}) {
  if (typeof verifyEvent !== "function") return fail("missing-verifier");
  if (!hasEventShape(event, 8828)) return fail("invalid-event-shape");
  if (!verified(event, verifyEvent)) return fail("invalid-event-signature");
  if (event.content !== "") return fail("nonempty-act-content");

  const contextTags = tagsNamed(event.tags, "a");
  const contextTag = oneMarked(event.tags, "a", "context");
  const context = parseContext(contextTag);
  if (contextTags.length !== 1 || !context) return fail("invalid-context");
  if (event.pubkey !== context.pubkey) return fail("context-signer-mismatch");

  const sourceTags = event.tags.filter((tag) => tag[0] === "e" && tag[3] === "source");
  const revokeTags = event.tags.filter((tag) => tag[0] === "e" && tag[3] === "revoke");
  const allETags = tagsNamed(event.tags, "e");
  const snapshots = tagsNamed(event.tags, "snapshot");
  const selects = tagsNamed(event.tags, "select");
  const credits = tagsNamed(event.tags, "p");
  const allowedNames = new Set(["a", "e", "snapshot", "select", "p"]);

  if (strictTags && event.tags.some((tag) => !allowedNames.has(tag[0]))) {
    return fail("unexpected-tag");
  }
  if (credits.some((tag) => tag.length !== 4 || !HEX_64.test(tag[1]) || tag[3] !== "credit")) {
    return fail("invalid-credit");
  }

  const isAcceptance = sourceTags.length === 1 && revokeTags.length === 0;
  const isRevoke = sourceTags.length === 0 && revokeTags.length === 1;
  if (isAcceptance === isRevoke) return fail("hybrid-or-unknown-shape");
  if (allETags.length !== 1) return fail("invalid-e-tags");

  const common = {
    id: event.id,
    pubkey: event.pubkey,
    createdAt: event.created_at,
    context: context.coordinate,
    event,
  };

  if (isRevoke) {
    const target = revokeTags[0];
    if (target.length !== 4 || !HEX_64.test(target[1])) return fail("invalid-revoke-target");
    if (snapshots.length !== 0 || selects.length !== 0 || credits.length !== 0) {
      return fail("revoke-has-acceptance-tags");
    }
    return { ok: true, act: { ...common, type: "revoke", targetActId: target[1] } };
  }

  const source = sourceTags[0];
  if (source.length !== 4 || !HEX_64.test(source[1])) return fail("invalid-source");
  if (snapshots.length !== 1 || snapshots[0].length !== 2) return fail("invalid-snapshot-tag");
  if (selects.length === 0 || selects.some((tag) => tag.length !== 2)) {
    return fail("invalid-select-tags");
  }

  const selectorNames = selects.map((tag) => tag[1]);
  if (new Set(selectorNames).size !== selectorNames.length) return fail("duplicate-selector");
  const wholeCard = selectorNames.length === 1 && selectorNames[0] === "card";
  if (!wholeCard && selectorNames.some((selector) => !SELECTOR_TO_FIELD.has(selector))) {
    return fail("unknown-selector");
  }
  if (selectorNames.includes("card") && !wholeCard) return fail("mixed-card-selector");

  let snapshot;
  try {
    snapshot = JSON.parse(snapshots[0][1]);
  } catch {
    return fail("invalid-snapshot-json");
  }
  if (!hasEventShape(snapshot, 30828)) return fail("invalid-snapshot-shape");
  if (!verified(snapshot, verifyEvent)) return fail("invalid-snapshot-signature");
  if (snapshot.id !== source[1]) return fail("snapshot-source-mismatch");
  const slot = snapshotSlot(snapshot);
  if (slot === null) return fail("invalid-snapshot-d");

  const fields = wholeCard
    ? [...CORE_FIELDS]
    : selectorNames.map((selector) => SELECTOR_TO_FIELD.get(selector));
  const blocks = Object.fromEntries(fields.map((field) => [field, blockFromSnapshot(snapshot, field)]));

  return {
    ok: true,
    act: {
      ...common,
      type: "acceptance",
      slot,
      sourceEventId: source[1],
      snapshot,
      fields,
      blocks,
      wholeCard,
    },
  };
}

/**
 * Fold already-normalized acceptances plus causally resolved revokes.
 *
 * `revokedTargetIds` causes a target's writes to be cleared immediately after
 * that target is applied. This makes revoke timestamp irrelevant, does not
 * resurrect older values, and lets later deterministic writes survive.
 */
export function foldValidatedActs(acceptances, { revokedTargetIds = new Set() } = {}) {
  const projections = new Map();
  const sorted = [...acceptances].sort(compareActs);

  for (const act of sorted) {
    if (act.type !== "acceptance") throw new TypeError("foldValidatedActs accepts only normalized acceptances");
    const key = `${act.context}\u0000${act.slot}`;
    let projection = projections.get(key);
    if (!projection) {
      projection = { context: act.context, slot: act.slot, registers: emptyRegisters() };
      projections.set(key, projection);
    }

    for (const field of act.fields) {
      projection.registers[field] = {
        state: "selected",
        value: act.blocks[field],
        sourceActId: act.id,
        sourceEventId: act.sourceEventId,
        snapshot: act.snapshot,
      };
    }

    if (revokedTargetIds.has(act.id)) {
      for (const field of CORE_FIELDS) {
        if (projection.registers[field].sourceActId === act.id) {
          projection.registers[field] = { state: "unset" };
        }
      }
    }
  }

  return [...projections.values()].sort(
    (left, right) => left.context.localeCompare(right.context) || left.slot.localeCompare(right.slot),
  );
}

/**
 * Validate and reduce an unordered event set.
 *
 * Non-8828 events (including NIP-09 kind 5) are ignored. Duplicate ids are
 * considered once. Revokes are valid only when they target a valid acceptance
 * signed by the same key and in the same context.
 */
export function fold8828(events, options = {}) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");

  const seenIds = new Set();
  const valid = [];
  const rejectedActs = [];
  const ignoredEvents = [];

  for (const event of events) {
    if (!event || event.kind !== 8828) {
      ignoredEvents.push(event);
      continue;
    }
    if (typeof event.id === "string" && seenIds.has(event.id)) continue;
    if (typeof event.id === "string") seenIds.add(event.id);

    const result = validateAct(event, options);
    if (result.ok) valid.push(result.act);
    else rejectedActs.push({ event, code: result.code, detail: result.detail });
  }

  const acceptances = valid.filter((act) => act.type === "acceptance");
  const acceptanceById = new Map(acceptances.map((act) => [act.id, act]));
  const validRevokes = [];
  const revokedTargetIds = new Set();

  for (const revoke of valid.filter((act) => act.type === "revoke")) {
    const target = acceptanceById.get(revoke.targetActId);
    if (!target) {
      rejectedActs.push({ event: revoke.event, code: "invalid-revoke-target" });
      continue;
    }
    if (target.pubkey !== revoke.pubkey || target.context !== revoke.context) {
      rejectedActs.push({ event: revoke.event, code: "revoke-target-mismatch" });
      continue;
    }
    validRevokes.push({ ...revoke, slot: target.slot });
    revokedTargetIds.add(target.id);
  }

  return {
    projections: foldValidatedActs(acceptances, { revokedTargetIds }),
    acceptedActs: [...acceptances, ...validRevokes].sort(compareActs),
    rejectedActs,
    ignoredEvents,
  };
}


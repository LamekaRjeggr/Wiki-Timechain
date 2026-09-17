const REGISTER_SELECTORS = Object.freeze({
  "tag:title": "title",
  "tag:summary": "summary",
  content: "content",
  "tag:event_date": "event_date",
  "tag:event_time": "event_time",
  "tag:g": "g",
});

const REGISTER_NAMES = Object.freeze([
  "title",
  "summary",
  "content",
  "event_date",
  "event_time",
  "g",
]);

function marked(tags, name, marker) {
  return tags.filter(tag => Array.isArray(tag) && tag[0] === name && tag[3] === marker);
}

function isHex(value, length) {
  return typeof value === "string" && value.length === length && /^[0-9a-f]+$/i.test(value);
}

function parseContext(value) {
  if (typeof value !== "string") return null;
  const firstColon = value.indexOf(":");
  const secondColon = value.indexOf(":", firstColon + 1);
  if (firstColon < 0 || secondColon < 0) return null;

  const kind = value.slice(0, firstColon);
  const pubkey = value.slice(firstColon + 1, secondColon);
  if (kind !== "30829" || !isHex(pubkey, 64)) return null;
  return { value, pubkey };
}

function hasEventFields(event, kind) {
  return event !== null
    && typeof event === "object"
    && isHex(event.id, 64)
    && isHex(event.pubkey, 64)
    && Number.isSafeInteger(event.created_at)
    && event.created_at >= 0
    && event.kind === kind
    && Array.isArray(event.tags)
    && event.tags.every(tag => Array.isArray(tag) && tag.every(value => typeof value === "string"))
    && typeof event.content === "string"
    && isHex(event.sig, 128);
}

function verifies(verifyEvent, event) {
  try {
    return verifyEvent(event) === true;
  } catch {
    return false;
  }
}

function contextFor(event) {
  const contexts = marked(event.tags, "a", "context");
  if (contexts.length !== 1 || contexts[0].length !== 4) return null;
  const context = parseContext(contexts[0][1]);
  if (context === null || event.pubkey !== context.pubkey) return null;
  return context.value;
}

function isCredit(tag) {
  return tag.length === 4
    && tag[0] === "p"
    && isHex(tag[1], 64)
    && tag[2] === ""
    && tag[3] === "credit";
}

function parseSnapshot(snapshotText, sourceId, verifyEvent) {
  let snapshot;
  try {
    snapshot = JSON.parse(snapshotText);
  } catch {
    return null;
  }

  if (!hasEventFields(snapshot, 30828) || snapshot.id !== sourceId) return null;
  if (!verifies(verifyEvent, snapshot)) return null;

  const slots = snapshot.tags.filter(tag => Array.isArray(tag) && tag[0] === "d");
  if (slots.length !== 1 || slots[0].length < 2 || typeof slots[0][1] !== "string") return null;
  return { snapshot, slot: slots[0][1] };
}

function parseSelections(event) {
  const selections = event.tags.filter(tag => Array.isArray(tag) && tag[0] === "select");
  if (selections.length === 0 || selections.some(tag => tag.length !== 2 || typeof tag[1] !== "string")) {
    return null;
  }
  const selectors = selections.map(tag => tag[1]);
  if (new Set(selectors).size !== selectors.length) return null;
  if (selectors.includes("card")) {
    if (selectors.length !== 1) return null;
  } else if (selectors.some(selector => !(selector in REGISTER_SELECTORS))) {
    return null;
  }
  return { selections, selectors };
}

function parseRefusal(event, context) {
  const targets = marked(event.tags, "e", "refuse");
  if (targets.length !== 1 || targets[0].length !== 4 || !isHex(targets[0][1], 64)) return null;
  const parsed = parseSelections(event);
  if (parsed === null) return null;
  const contextTag = marked(event.tags, "a", "context")[0];
  const allowedTags = new Set([contextTag, targets[0], ...parsed.selections]);
  if (event.tags.some(tag => !allowedTags.has(tag))) return null;
  return { event, context, targetId: targets[0][1], selectors: parsed.selectors };
}

function parseAcceptance(event, context, verifyEvent) {
  const sources = marked(event.tags, "e", "source");
  const snapshots = event.tags.filter(tag => Array.isArray(tag) && tag[0] === "snapshot");

  if (sources.length !== 1 || sources[0].length !== 4 || !isHex(sources[0][1], 64)) return null;
  if (snapshots.length !== 1 || snapshots[0].length !== 2 || typeof snapshots[0][1] !== "string") return null;
  const selection = parseSelections(event);
  if (selection === null) return null;
  const { selections, selectors } = selection;

  const contextTag = marked(event.tags, "a", "context")[0];
  const allowedTags = new Set([contextTag, sources[0], snapshots[0], ...selections]);
  for (const tag of event.tags) {
    if (!allowedTags.has(tag) && !isCredit(tag)) return null;
  }

  const parsed = parseSnapshot(snapshots[0][1], sources[0][1], verifyEvent);
  if (parsed === null) return null;
  return { event, context, selectors, ...parsed };
}

function parseRevoke(event, context) {
  const targets = marked(event.tags, "e", "revoke");
  if (targets.length !== 1 || targets[0].length !== 4 || !isHex(targets[0][1], 64)) return null;
  const contextTag = marked(event.tags, "a", "context")[0];
  if (event.tags.length !== 2 || !event.tags.includes(contextTag) || !event.tags.includes(targets[0])) {
    return null;
  }
  return { event, context, targetId: targets[0][1] };
}

function selectedValue(snapshot, selector) {
  if (selector === "content") return snapshot.content;
  const tagName = selector.slice(4);
  return snapshot.tags
    .filter(tag => Array.isArray(tag) && tag[0] === tagName)
    .map(tag => [...tag]);
}

function newRegisters() {
  return Object.fromEntries(REGISTER_NAMES.map(name => [name, { state: "unset" }]));
}

function projectionKey(context, slot) {
  return JSON.stringify([context, slot]);
}

export function foldBlind(events, { verifyEvent = () => false } = {}) {
  const rejectedActs = [];
  const acceptances = [];
  const refusals = [];
  const revokeCandidates = [];
  const seenIds = new Set();

  for (const event of events ?? []) {
    if (event?.kind !== 8828) continue;
    if (seenIds.has(event.id)) continue;
    seenIds.add(event.id);

    if (!hasEventFields(event, 8828) || event.content !== "" || !verifies(verifyEvent, event)) {
      rejectedActs.push({ event, code: "invalid-event" });
      continue;
    }
    const context = contextFor(event);
    if (context === null) {
      rejectedActs.push({ event, code: "invalid-context" });
      continue;
    }

    const acceptance = parseAcceptance(event, context, verifyEvent);
    if (acceptance !== null) {
      acceptances.push(acceptance);
      continue;
    }
    const refusal = parseRefusal(event, context);
    if (refusal !== null) {
      refusals.push(refusal);
      continue;
    }
    const revoke = parseRevoke(event, context);
    if (revoke !== null) {
      revokeCandidates.push(revoke);
      continue;
    }
    rejectedActs.push({ event, code: "invalid-shape" });
  }

  const targetById = new Map([...acceptances, ...refusals].map(act => [act.event.id, act]));
  const revokedTargets = new Set();
  for (const revoke of revokeCandidates) {
    const target = targetById.get(revoke.targetId);
    if (target === undefined
      || target.event.pubkey !== revoke.event.pubkey
      || target.context !== revoke.context) {
      rejectedActs.push({ event: revoke.event, code: "invalid-revoke-target" });
      continue;
    }
    revokedTargets.add(revoke.targetId);
  }

  acceptances.sort((left, right) => left.event.created_at - right.event.created_at
    || left.event.id.localeCompare(right.event.id));

  const projectionMap = new Map();
  for (const acceptance of acceptances) {
    const key = projectionKey(acceptance.context, acceptance.slot);
    let projection = projectionMap.get(key);
    if (projection === undefined) {
      projection = { context: acceptance.context, slot: acceptance.slot, registers: newRegisters() };
      projectionMap.set(key, projection);
    }

    const selectors = acceptance.selectors[0] === "card"
      ? Object.keys(REGISTER_SELECTORS)
      : acceptance.selectors;
    for (const selector of selectors) {
      const name = REGISTER_SELECTORS[selector];
      projection.registers[name] = {
        state: "selected",
        value: selectedValue(acceptance.snapshot, selector),
        sourceActId: acceptance.event.id,
      };
    }

    if (revokedTargets.has(acceptance.event.id)) {
      for (const name of REGISTER_NAMES) {
        if (projection.registers[name].sourceActId === acceptance.event.id) {
          projection.registers[name] = { state: "unset" };
        }
      }
    }
  }

  const projections = [...projectionMap.values()].sort((left, right) =>
    left.context.localeCompare(right.context) || left.slot.localeCompare(right.slot));
  const refusalMap = new Map();
  for (const refusal of refusals) {
    if (revokedTargets.has(refusal.event.id)) continue;
    const key = JSON.stringify([refusal.context, refusal.targetId]);
    let entry = refusalMap.get(key);
    if (entry === undefined) {
      entry = { context: refusal.context, eventId: refusal.targetId, fields: new Set(), actIds: [] };
      refusalMap.set(key, entry);
    }
    const selectors = refusal.selectors[0] === "card" ? Object.keys(REGISTER_SELECTORS) : refusal.selectors;
    for (const selector of selectors) entry.fields.add(REGISTER_SELECTORS[selector]);
    entry.actIds.push(refusal.event.id);
  }
  const refusalList = [...refusalMap.values()]
    .map(entry => ({ ...entry, fields: REGISTER_NAMES.filter(name => entry.fields.has(name)), actIds: entry.actIds.sort() }))
    .sort((left, right) => left.context.localeCompare(right.context) || left.eventId.localeCompare(right.eventId));

  rejectedActs.sort((left, right) => String(left.event?.id).localeCompare(String(right.event?.id)));
  return { projections, refusals: refusalList, rejectedActs };
}

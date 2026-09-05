# NIP-XX

## Timeline Acts

`draft` `optional`

A **decision** is an explicit signed choice made by a timeline notary about one card or
some of its fields. Decisions are kind `8828` (provisional), a regular event per NIP-01:
none replaces another and history is append-only.

Cards are replaceable accounts. Decisions are records. A notary changes its projection
by signing another act, never because a source card changed, disappeared, matched another
card, became popular, or was linked by a `30829`.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", and "MAY" are as in RFC 2119.

## Vocabulary

- **Card** — one signed kind `30828` account of an event.
- **Event slot** — `(notary coordinate, card d)`, the subject being decided within one
  notary lens. It is never written as a tag: an acceptance derives it from the verified
  snapshot, a revoke from its target.
- **Field block** — one of the six core blocks defined by Timeline Cards: `title`,
  `summary`, `content`, `event_date`, `event_time`, or `g`.
- **Register** — `(notary coordinate, card d, field block)`, where one notary's current
  field selection is derived.
- **Whole-card acceptance** — one act selecting all six field blocks from one complete
  exact card.
- **Partial-card selection** — one act selecting an explicit set of field blocks from
  one exact source-card version.
- **Projection** — the current field map derived by folding a notary's acts.
- **Provenance** — the exact signed source envelope from which selected bytes are read.
- **Credit** — optional public attribution, separate from provenance.

## Invariants

1. **Only a signed act decides.** Matching, plurality, recency, submission, notary
   configuration, and other notaries' acts are signals or inputs only.
2. **The snapshot is the value store.** Every acceptance embeds the complete exact
   signed source card. Selection tags only name which preserved blocks are operative.
3. **A decision is stable.** Source replacement, deletion, relay loss, or upstream
   withdrawal may change provenance status but cannot change the embedded bytes.
4. **One source per act.** One act MAY select several fields, but all come from the same
   exact source-card event.
5. **Fields are independent.** A partial act changes only the registers it names.
6. **Source and credit are separate.** Credit is optional and does not affect selection
   or validity.
7. **Reversion is explicit.** Revocation never resurrects an older value. Returning to
   old bytes requires another acceptance.

## Acceptance grammar

An acceptance has empty `content` and these tags:

```json
{
  "kind": 8828,
  "content": "",
  "tags": [
    ["a", "30829:<notary-pubkey>:<notary-d>", "", "context"],
    ["e", "<source-event-id>", "", "source"],
    ["snapshot", "<complete signed 30828 JSON>"],
    ["select", "tag:title"],
    ["select", "tag:event_date"]
  ]
}
```

An acceptance MUST contain:

- exactly one marked `a` context;
- exactly one marked source `e`;
- exactly one complete `snapshot`; and
- either exactly one `select:card` or one or more distinct field `select` tags.

There is no duplicate unmarked `context` tag, no source-card `a` tag, and no slot tag. The
verified snapshot supplies the source pubkey and `d`, from which its `30828` coordinate and
the slot are derived.
The source `e` verifies which snapshot was selected and provides a relay index.

There are no separate scope/value pairs. The snapshot already preserves the exact values.
The act's `content` remains empty so there is only one value channel.

### Whole-card acceptance

```json
["select", "card"]
```

This writes all six core registers from the snapshot, including absence. It is shorthand
for selecting every allowed field block in one act; reducers require no separate baseline
or overlay state. Unfamiliar and structural tags remain preserved in the envelope without
becoming partial-selection registers.

One whole-card acceptance creates one `8828` and zero new `30828` events. Materializing
the projection later is a separate optional operation.

### Partial-card selection

The act repeats `select` for every chosen block:

```json
["select", "tag:title"]
["select", "tag:event_date"]
["select", "content"]
```

Allowed core selectors are:

```text
tag:title
tag:summary
content
tag:event_date
tag:event_time
tag:g
```

For `tag:<name>`, the value is the complete ordered list of every matching tag in the
snapshot. For `content`, the value is `snapshot.content` exactly. Selecting a tag block
with no matching tags selects exact absence (`[]`); selecting empty content selects the
empty string. Omitting a selector leaves that register unchanged.

The complete `tag:g` block is selected as one ordered geohash ladder. Individual rungs
cannot be mixed across sources.

Each selector MUST occur at most once. `select:card` MUST NOT appear with another
selector. A multi-source synthesis uses at least one act per source card, not one act per
field.

### Credit

An acceptance MAY repeat:

```json
["p", "<credited-pubkey>", "", "credit"]
```

Credit is optional public attribution. A publisher SHOULD omit it when a contributor
requests anonymity. Provenance remains the signed source envelope; a `p` tag neither
creates nor validates a selection.

## Revocation

A revoke has empty `content`, the same context as its target, and one target:

```json
{
  "kind": 8828,
  "content": "",
  "tags": [
    ["a", "30829:<notary-pubkey>:<notary-d>", "", "context"],
    ["e", "<target-act-id>", "", "revoke"]
  ]
}
```

The target MUST be a valid acceptance signed by the same key and have the same context.
The revoke's slot is the target's slot. The target-id edge is causal: a valid revoke
applies immediately after its target even when the revoke has an earlier `created_at`.
It clears all and only registers whose current source is still the targeted act.
Registers changed by a later acceptance in deterministic order are unaffected. A prior
value does not return.

A revoke contains no source, snapshot, selector, or credit tag.

## Snapshot validation

The snapshot MUST contain the source event's `id`, `pubkey`, `created_at`, `kind`, `tags`,
`content`, and `sig`. It MUST be kind `30828`; its id and signature MUST validate; and its
id MUST equal the marked source `e`.

No canonical JSON spelling is required. Any spelling that decodes to those seven fields,
recomputes to the marked source `e` under NIP-01, and carries a valid signature is a valid
snapshot. Field equality operates on the decoded Nostr strings and ordered tag arrays, not
on incidental JSON escape spelling received from a relay.

Because the exact source envelope is embedded, disappearance of the separately relayed
source event does not make the selected bytes unavailable. If the source event is also
retrieved independently and differs from the verified snapshot, the independent copy is
invalid by event-id validation; it cannot alter the decision.

## Validation

For an act to affect a notary projection:

1. the act's event id and signature MUST validate;
2. it MUST identify exactly one parseable marked notary context;
3. its signer MUST equal the pubkey in that context coordinate;
4. it MUST be exactly one valid acceptance shape or one valid revoke shape;
5. an acceptance snapshot and its source `e` MUST pass Snapshot validation;
6. acceptance selectors MUST be allowed, distinct, and structurally valid;
7. a revoke target MUST be a valid acceptance and pass the same-key and context checks
   above.

Current source-card replacement, present notary-graph reachability, optional credit, and
observed plurality are not validity requirements.

## Deterministic derivation

There is one writer for a notary context: the pubkey in its `30829` coordinate. Valid
acceptances are folded in ascending order by:

```text
(created_at, event id)
```

The event id is the tie-breaker. Each valid revoke is applied immediately after its
target acceptance, irrespective of the revoke's own timestamp; multiple revokes of one
target are equivalent to one. Relay arrival order is irrelevant. Clients with the same
valid event set MUST derive the same projection.

For each `(context, slot)`:

1. `select:card` writes all six registers from its snapshot and records that act as each
   register's current source.
2. A partial acceptance sets each named register to the value in its snapshot and records
   that act as the register's current source. Registers it does not name remain unchanged.
3. A revoke unsets only registers whose current source is its target. It never reveals or
   restores the value underneath.

Same-key races and equivocation remain visible history but do not create multiple
normative register heads. The deterministic order produces one result. The notary may
clarify any unintended race by signing another acceptance.

Relay incompleteness may produce a temporary partial view under any append-only protocol.
Clients SHOULD disclose incomplete queries or later recomputation; they MUST NOT replace
the specified order with arrival order.

The projection is derived state. It is not stored in `30829` and is not itself evidence;
the signed acts and snapshots are.

## Revision, synthesis, and materialization

A **revision** is a new `30828` derived mainly from one earlier card with changed fields.
A **synthesis** is a new `30828` assembled from fields selected from multiple sources.
Both are ordinary cards; these words describe provenance, not distinct event kinds.

A notary MAY materialize its projection as a new signed `30828` submitted to another
notary. The card SHOULD identify, per field, the exact source event and selection act.
Materialization is optional and does not happen merely because fields were selected.
The receiving notary still needs its own explicit decision.

## Convergence and plurality

**Convergence** means several observed candidates contain the same exact field bytes.
**Plurality** is the largest observed exact-match cluster for a field. Both are advisory
client observations. Neither is acceptance, truth, authority, or a protocol winner.

Counts SHOULD disclose their observation basis: relay set, time window, keys or notaries
considered, and excluded unavailable material. Keys are cheap and counts provide no
built-in Sybil resistance.

## Discovery

Readers can query decisions by marked context `#a`, exact source or revoke target `#e`,
notary author, or known event id. Results MUST pass local validation before derivation.
The source-card coordinate is derived from the verified snapshot. Relay filters are
discovery hints only. Multi-character tag names such as `snapshot` and `select` are not
indexed by common relays; nothing in this document needs to filter on them.

## Size

An acceptance is its source card plus a few hundred bytes of framing. Card size is the
budget; this document sets no act-side limit and defines no chunking. A card too large to
embed is a card too large to accept.

Relays cap the whole message, not the tag. `nostr-rs-relay` defaults to 262144 bytes for
the entire `["EVENT", ...]` text; other relays commonly cap at 64 to 128 KB. An oversized
act MAY be refused with a `NOTICE` rather than an `OK false`, so a writer MUST NOT wait
only for `OK` by event id and MUST surface a `NOTICE` as a failed publish.

## Degradation

An ignorant client sees unknown kind `8828` events and leaves the underlying `30828`
cards intact. A partially implementing client SHOULD show an unsupported act rather than
reinterpret it using older live-consent or causal-head rules.

## Open wire questions

Before promotion beyond draft, this document still needs confirmation of the provisional
`snapshot` and `select` tag names. The derivation intentionally requires no `scope`, `value`, `prev`, or `supersede`
machinery.

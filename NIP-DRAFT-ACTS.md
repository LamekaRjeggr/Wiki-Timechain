# NIP-XX

## Timeline Acts

`draft` `optional`

A **decision** is an explicit signed choice made by a timeline notary about a card or
one of its fields. Decisions are kind `8828` (provisional), a regular event per NIP-01:
none replaces another and history is append-only.

Cards are replaceable accounts. Decisions are records. A notary changes its projection
by signing another act, never because a source card changed, disappeared, matched another
card, became popular, or was linked by a `30829`.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", and "MAY" are as in RFC 2119.

## Vocabulary

- **Card** — one signed kind `30828` account of an event.
- **Card address** — `(author pubkey, card d)`, one author's replaceable card lineage.
- **Event slot** — `(notary coordinate, card d)`, the subject being decided within one
  notary lens.
- **Field** — one of the six core modular blocks defined by Timeline Cards: `title`,
  `summary`, `content`, `event_date`, `event_time`, or `g`.
- **Register** — `(event slot, field)`, equivalently `(notary coordinate, card d, field)`,
  the place where one notary's current field selection is derived.
- **Whole-card acceptance** — one decision accepting and preserving a complete exact
  card version.
- **Partial-card selection** — one decision selecting an explicit set of field blocks
  from one exact source-card version in one slot.
- **Baseline** — a complete signed source envelope installed by a whole-card acceptance.
- **Overlay** — a partial-card selection whose named registers take precedence over the
  baseline or earlier selections.
- **Register head** — a current, non-replaced selection for one register. More than one
  head means the register is contested.
- **Supersession** — an explicit decision replacing an earlier decision.
- **Revocation** — an explicit decision withdrawing an earlier decision without silently
  restoring an older value.
- **Projection** — the current field map derived from a notary's effective decisions.
- **Provenance** — references showing where selected bytes were read.
- **Credit** — optional public attribution, separate from provenance.

## Invariants

1. **Only a signed act decides.** Matching, plurality, recency, submission, notary
   configuration, and other notaries' acts are signals or inputs only.
2. **Selected bytes are self-contained.** An act MUST carry the exact bytes it selects.
   A pointer alone is insufficient.
3. **A decision is stable.** Source replacement, deletion, relay loss, or an upstream
   withdrawal may change provenance status but MUST NOT silently change this notary's
   projection.
4. **Fields are independent.** Selecting one field implies nothing about another.
5. **Source and credit are separate.** Provenance MAY disclose a source event without
   requiring a public credit tag. Absence of credit does not erase disclosed provenance.
6. **Reversion is explicit.** Revocation clears the affected register; it does not
   resurrect an older superseded value.
7. **One source per selection.** One act MAY select several fields, but every selected
   block MUST verify against the same exact source-card event.

The central persistence rule is:

> A notary's signed decision preserves the bytes it selected. Source replacement,
> deletion, disappearance, or upstream withdrawal may change provenance status, but
> cannot silently change the decision.

## Operations

There are three conceptual operations:

```text
accept card
select fields from one card
withdraw or replace decision
```

The final tag vocabulary below remains provisional. The semantics and validation
requirements are normative for this draft.

### Whole-card acceptance

One act accepts one complete, exact `30828` without creating a new card.

```json
{
  "kind": 8828,
  "content": "<exact source content>",
  "tags": [
    ["context", "30829:<notary-pubkey>:<notary-d>"],
    ["slot", "<card-d>"],
    ["scope", "card"],
    ["a", "30828:<source-pubkey>:<card-d>", "", "source"],
    ["e", "<source-event-id>", "", "source"],
    ["snapshot", "<JSON serialization of the complete signed source event>"]
  ]
}
```

The complete signed event envelope is installed as the projection baseline. The snapshot
MUST include the source event's `id`, `pubkey`, `created_at`, `kind`, `tags`, `content`,
and `sig`, and its id and signature MUST validate. A reader derives the baseline fields
from that exact snapshot. The baseline preserves fields and unfamiliar/custom tags
without requiring this protocol to enumerate "all fields" in advance.

Structural routing and identity are not projection fields. The card's `d`, notary
context, and submission links do not silently migrate into a different slot or notary
when the baseline is materialized. Context and slot come from the act.

One whole-card acceptance creates one decision and zero new `30828` events. Later
materialization is a separate optional operation.

### Partial-card selection

One act selects one or more exact field blocks from one exact source-card version. The
selection is atomic as evidence, while each selected field updates its own register.

```json
{
  "kind": 8828,
  "content": "<selected bytes when scope is content; otherwise empty>",
  "tags": [
    ["context", "30829:<notary-pubkey>:<notary-d>"],
    ["slot", "<card-d>"],
    ["scope", "tag:<first-field-name>"],
    ["value", "tag:<first-field-name>", "<exact serialized tag block>"],
    ["scope", "tag:<second-field-name>"],
    ["value", "tag:<second-field-name>", "<exact serialized tag block>"],
    ["a", "30828:<source-pubkey>:<card-d>", "", "source"],
    ["e", "<source-event-id>", "", "source"]
  ]
}
```

The `context` and `slot` identify the event slot. Each scope/value pair identifies one
register and carries its selected bytes. A field name MUST occur at most once in an act.
Tag-valued fields preserve the complete ordered list of every source tag with that name;
content preserves the exact content string. The final compact encoding remains open.

Exact absence MUST have an explicit encoding. It is valid only when the exact source
card lacks that tag block, or has the empty content string for `content`. Selecting an
empty block is distinct from leaving a register unset, and absence MUST NOT be inferred
from an omitted scope/value pair.

A partial-card selection overlays only its named registers. Registers not named by the
act retain their current heads or baseline values. Multi-source synthesis therefore uses
at least one act per source card, not one act per field.

This draft is intentionally not opinionated about what selected field bytes mean. A
scope names bytes, not truth. Unknown and custom tags remain preserved by a whole-card
baseline but are not partial-selection blocks unless a future specification defines
their block boundaries.

### Replace a decision

A new selection identifies, for every register it changes, the prior head or heads it
replaces. Conceptually:

```json
["prev", "<field-key>", "<prior-act-id>"]
```

The final encoding for field-to-predecessor edges remains open. The target MUST be signed
by the same notary key and MUST affect the same register.

Replacement is causal, not inferred from `created_at`. No predecessor means a genesis
selection for that register. If two valid acts replace the same head, both become current
heads and the register is contested. A resolving act names every current head it intends
to replace. Missing relays, equal timestamps, or deliberate backdating therefore cannot
silently select a winner.

A whole-card acceptance establishes a baseline across the source envelope. A later
partial selection replaces only its named register heads; the remaining baseline and
overlays stay selected. Replacing a baseline with another whole-card acceptance MUST
causally address the current heads it intends to replace.

### Withdraw a decision

```json
{
  "kind": 8828,
  "content": "<optional reason>",
  "tags": [["e", "<prior-act-id>", "", "revoke"]]
}
```

The target MUST be signed by the same key. Revocation clears all and only registers whose
current head still comes from the target act. Registers subsequently selected by another
act are unaffected. A superseded value or prior baseline value does not return. Returning
to old bytes requires a new selection of those bytes.

## Provenance and credit

A source pointer states where the selected bytes were read. When the source is
retrievable, the reader SHOULD compare the selected bytes against it exactly.

- **verified provenance** — source retrieved and bytes match;
- **unavailable provenance** — source cannot presently be retrieved;
- **mismatched provenance** — source retrieved and bytes do not match.

Unavailable or mismatched provenance does not alter what the notary signed. A client
SHOULD flag the provenance and MAY judge the notary unreliable, but MUST represent the
decision bytes accurately.

An optional credit tag is separate:

```json
["p", "<credited-pubkey>", "", "credit"]
```

A publisher SHOULD omit public credit when the contributor requests anonymity. Gift
wrapping, anonymous publication, and other privacy mechanisms occur before or around
this protocol. This draft does not require a real-world identity.

## Validation

For an act to affect a notary projection:

1. its event id and signature MUST validate;
2. it MUST identify exactly one parseable notary context;
3. its signer MUST equal the pubkey in that notary coordinate;
4. a selection MUST identify one slot and at least one valid, non-duplicated scope;
5. it MUST carry a complete selected value for every scope;
6. all selected blocks in one partial-card act MUST verify against the same exact source
   event;
7. a whole-card snapshot MUST validate as the exact signed event named by its source `e`;
8. a supersede or revoke target MUST be signed by the same key;
9. a supersede target used to change a register MUST address the same context, slot, and
   field, subject to the whole-card rule above.

Source availability, current card replacement, present notary-graph reachability, credit,
and observed plurality are not validity requirements.

Malformed index hints SHOULD be flagged. A reader holding the source event SHOULD derive
its card address from the signed source rather than trust a hand-written `a` value.

## Derivation

All projection state is reader-derived. A field register is keyed by:

```text
(notary coordinate, slot d, field key)
```

It is not keyed merely by signer, source card, or source address. This distinction lets
one notary hold simultaneous decisions for several fields taken from the same card and
lets a field survive changes to unrelated fields.

Derive current heads from the causal, same-key supersede and revoke edges, not timestamp
order. If several non-superseding selections remain effective for one register, the
register is contested. A client MUST NOT silently choose by timestamp, event id, arrival
order, or plurality.

The projection consists of a whole-card baseline, if any, overlaid by the current head
for each field register. A contested register has no single protocol-selected value.
Clients MAY collapse identical displayed bytes, but MUST retain the distinct provenance
heads because matching values may carry different sources and credit histories.

The projection is the map of effective register values. It is not stored in `30829` and
is not itself proof.

## Revision, synthesis, and materialization

A **revision** is a new `30828` derived mainly from one earlier card with changed fields.
A **synthesis** is a new `30828` assembled from fields selected from multiple sources.
Both are ordinary cards; these words describe provenance, not distinct event kinds.

A notary MAY **materialize** its projection as a new signed `30828` submitted to another
notary. The card SHOULD identify, per field, the exact source event and selection act.
Materialization is optional and does not happen merely because fields were selected.
The receiving notary still needs its own explicit decision.

## Convergence and plurality

**Convergence** means several observed candidates contain the same exact field bytes.
**Plurality** is the largest observed exact-match cluster for a field. Both are advisory
client observations. Neither is acceptance, truth, authority, or a protocol winner.

A displayed count SHOULD disclose its observation basis: relay set, time window, keys or
notaries considered, and whether unavailable material was excluded. Keys are cheap and
counts provide no built-in Sybil resistance.

## Discovery

Readers may query acceptances by source card address, exact source event, notary author,
or any finalized indexed context tag. Results MUST pass local validation before
derivation. Relay filters are discovery hints only.

## Degradation

An ignorant client sees unknown kind `8828` events or unfamiliar tags and leaves the
underlying `30828` cards intact. A partially implementing client SHOULD show an act it
cannot derive as unsupported rather than reinterpret it using older live-consent rules.

## Open wire questions

Before promotion beyond draft, this document still needs final names and marker positions
for `context`, `slot`, `scope`, `value`, `snapshot`, source, credit, field provenance,
field-scoped `prev` heads, supersede, and revoke. The semantics above are intentionally
named before those spellings are frozen.

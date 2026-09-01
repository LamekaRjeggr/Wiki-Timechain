# Modular Acceptance Lab

Status: design exploration, not a protocol draft

This document tests a possible next shape for timeline cards, acts, and notaries. It
does not change the three current NIP drafts. Its purpose is to find the smallest
protocol that can preserve historical claims while also recording explicit, modular
decisions about what a notary currently presents.

## The problem

The project began as a way to record events in the past so people can better
understand what happened and make decisions in the present and future.

Permissionless publication produces several versions of the same event. One card may
have the best title, another the best account, and a third the best date or geohash.
Several independent cards may also contain exactly the same value. A useful timeline
needs to express a curator's current reading without pretending that popularity,
recency, or convergence governs the record.

The present model accepts fields on a particular card, but only live `content` moves
the card onto a notary's timeline. Changes to `event_date`, `event_time`, or `g` do not
lapse that passage, even though those fields are load-bearing. Conversely, making all
accepted fields depend on the source card remaining current would let an author erase
a notary's signed historical decision by replacing or deleting the source.

The unit that needs to move is therefore not a whole card. It is an exact field value
within an event slot.

## Working invariants

1. **Only a signed act decides.** A notary's projection changes only through a valid
   kind `8828` signed by that notary's key. Matching cards, counts, recency, notary
   declarations, and upstream results are signals or inputs only.
2. **Acceptance is modular.** The six core card blocks—title, summary, content, event
   date, event time, and geohash—can be selected independently.
3. **Bytes identify the value.** Exact copied values are the protocol fact. Semantic
   similarity, normalization, and factual compatibility are client interpretations.
4. **The act preserves the decision.** A selected value remains readable and selected
   until that notary explicitly changes it. Source replacement, deletion, relay loss,
   or upstream withdrawal may change provenance status but cannot silently change the
   notary's projection.
5. **Source and credit are separate.** A source pointer says where bytes were read.
   Credit is optional, may name several routes, and may be absent. Neither asserts
   originality.
6. **Identical values converge.** Value identity does not include author identity.
   Several cards containing the same exact block produce one candidate value with
   several possible provenance edges.
7. **Plurality never passes anything.** Counts and convergence may be displayed as
   advisory evidence. They are not acceptance, truth, authority, or a protocol winner.
8. **Stacking is not delegation.** A notary chain helps discover candidate material.
   Every downstream notary makes its own explicit field decisions.
9. **Fields stay open.** The protocol should define how a block is copied and compared,
   not prescribe a closed vocabulary or the meaning of every tag.
10. **History is append-only.** Changes, clears, and reversions are new acts. A current
    projection is derived from that history; it is not stored as a mutable list.

## Roles of the three event kinds

### `30828`: candidate bundle

A card remains a signed proposal containing several fields. Its `d` groups rival
candidates for the same event slot when used in the same notary context.

There is no normative `revised` or `synthesized` state. Those descriptions fall out of
field matching:

- blocks matching one earlier candidate plus changed blocks look like a revision;
- blocks matching several candidates look like a synthesis;
- all blocks matching another candidate look like a carry or duplicate;
- unmatched blocks are new candidate material.

A self-declared hint could be shown by a client, but it would not control derivation.
Exact matching proves sameness, not who originated a claim or whether copying occurred.

### `8828`: append-only acceptance decision

An act is the notary's ledger entry. It has two useful scopes:

- **card scope** accepts one complete `30828` unchanged and snapshots its signed field
  bytes in the act. This is the simple, default path;
- **partial-card scope** accepts one or more exact field blocks from one exact source
  card. This is the advanced path used to revise a projection or assemble one from
  several sources.

A card-scoped act atomically sets every field register represented by the card. A later
partial-card act may replace any named subset of those registers without disturbing the others. If a
card-scoped act is revoked, only registers still sourced from that act are cleared; a
later explicit field decision is not rolled back.

The full snapshot is important. A pointer alone would make the accepted history depend
on the original card remaining available. One act per source card keeps
selection, supersession, revocation, validation, and provenance unambiguous.

In the user interface these form a progressive path: pass the whole card, revise when a
small number of fields need judgment, then use modular assembly when several candidate
values need to be reconciled. Revision and assembly are not distinct protocol event
types. Both may produce an ordinary `30828`; clients infer the description from whether
its blocks predominantly derive from one source or several.

### `30829`: identity and discovery

A notary event should carry stable identity and discovery information: `d`, title,
description, corpus topics, a default geohash if retained, and zero or more links to
other notaries. Those links form an unordered source set. Tag order, graph depth, number
of routes, and position in a client must not imply rank, delegation, or authority. Sources
may use different `d` values; sharing a name is not a protocol requirement.

It should not carry the acceptance ledger. A replaceable event is a poor historical
record: an edit rewrites apparent state, old versions may disappear, and every field
decision would churn unrelated identity/configuration data.

The current `passes: manual|auto` setting should be removed. Nothing passes without an
explicit act. A live client may automatically create acts, but that is local behavior
and produces the same wire result as a person signing manually.

A projection hash in `30829` could someday be a cache or checkpoint. It must never be
the evidence beneath the projection and is best omitted initially.

## Semantic slot

An author's card coordinate cannot identify a modular event slot because rival cards
have different pubkeys. A bare `d` is also insufficient because it may be reused in
unrelated timelines.

The proposed slot identity is:

```text
(notary coordinate, card d)
```

For example:

```text
(30829:<notary-pubkey>:hcr2001, proposition-number-assigned)
```

Cards under different keys that use that `d` and submit to that notary contribute
candidates to the same slot. A card submitted to two notaries participates in two
contexts; the two notaries remain free to derive different projections.

This makes `d` opaque but relational: clients derive no meaning from its characters,
only equality inside one notary context.

## Candidate wire shape

This is a sketch to test semantics, not settled tag grammar:

```json
{
  "kind": 8828,
  "content": "",
  "tags": [
    ["a", "30829:<notary-pubkey>:hcr2001", "", "context"],
    ["slot", "proposition-number-assigned"],
    ["scope", "tag:event_date"],
    ["value", "tag:event_date", "[[\"event_date\",\"2026-07-01\"]]"],
    ["a", "30828:<source-pubkey>:proposition-number-assigned", "", "source"],
    ["e", "<source-event-id>", "", "source"]
  ]
}
```

The notary context is explicit because one key may own several notaries. The slot is
explicit because the source is optional and because several sources may contain the
same value.

### Field keys

Two generic shapes are enough:

- `content` for the event's `content` string;
- `tag:<name>` for all card tags whose first element is `<name>`.

A tag-field value is the ordered list of every matching tag, encoded as compact JSON.
This preserves repeated tags, extra elements, duplicates, and order. It makes all
geohash prefix rungs one block rather than allowing a projection to accidentally mix
rungs from different proposals.

Examples:

```json
["scope", "tag:g"],
["value", "tag:g", "[[\"g\",\"xn76urx6\"],[\"g\",\"xn76\"],[\"g\",\"xn7\"]]"]
```

```json
["scope", "tag:event_time"],
["value", "tag:event_time", "[]"]
```

The second example explicitly selects absence. This differs from having no decision
about `event_time`.

For `scope: content`, the act's `content` is the copied value. Explicit scope allows an
empty content string to be selected without confusing it with an out-of-scope field.

The exact encoding still needs a formal canonicalization rule. It should operate on
decoded Nostr strings and UTF-8, not on incidental JSON escape spelling received from a
relay. Preserving tag order is the least opinionated baseline: reordering produces a
different block even when a client believes the tags are semantically equivalent.

### Core selectable fields

The card specification defines exactly these six core blocks:

```text
tag:title
tag:summary
content
tag:event_date
tag:event_time
tag:g
```

Structural and documentary tags such as `d`, `a`, `published_at`, `t`, provenance, and
decision references are not partial-selection blocks. A whole-card envelope preserves
them, but a partial act does not transplant them. A future specification may define
additional blocks; clients do not infer them merely from unfamiliar tag names.

For migration, a new text-field act can also carry the existing native `title` or
`summary` copy, and content remains in event `content`. Old readers then safely see the
positive text acceptance while ignoring the contextual field projection.

## Selection and provenance are different claims

An act makes two separable statements:

1. **Selection:** this notary selects these exact bytes for this field in this slot.
2. **Provenance:** these bytes were read from this exact source event.

The notary signature is sufficient evidence for the first statement within that
notary's lens. Source pointers support the second.

If a pointed-to event is retrieved and matches, provenance is verified. If it cannot be
retrieved, provenance is unverified. If it is retrieved and does not match, provenance
is mismatched. Those states must not erase the selected bytes: otherwise a disappearing
or malicious source could retroactively alter the notary's ledger.

A client should flag mismatched provenance loudly. It may judge the notary unreliable,
but it must describe what the notary actually signed.

Source pointers may be omitted. This supports independently reached conclusions and
privacy-preserving publication paths. A public `e` pointer inherently reveals the
source event's signing key; gift wrapping or anonymous source publication belongs before
this public layer.

A `p` tag, if used, is optional credit routing. It may be repeated or absent. The
protocol must not infer that the first matching card is the original author, nor turn
all exact matches into demanded public credit.

### Minimum validation boundary

For an act to affect a notary projection:

- it must name exactly one `30829` context and the act signer must be the pubkey in
  that coordinate;
- it must name exactly one slot, one source event, and one or more non-duplicated field
  scopes with well-formed copied values;
- a `supersede` or `revoke` target must be signed by the same key;
- a supersede used to change a register must point to an act for the same notary,
  slot, and field.

An act by another key can still be displayed as voice, but it cannot change that
notary's projection. Source availability, candidate-chain reachability, and optional
credit are deliberately outside this validity boundary. They describe context around
the decision rather than permission to make it.

## Current projection

The conceptual state is one independent register for every:

```text
(notary coordinate, slot d, field key)
```

A field-selection act sets one register. A later selection should supersede the prior
current act for that register. A revoke clears the selected act without resurrecting an
older superseded value. Reversion is explicit: the notary signs a new selection of the
old bytes.

If incomplete or malformed history leaves several unsuperseded acts in one register,
the projection is contested. A client must retain that fact rather than silently call
plurality or recency the protocol winner. A deterministic display fallback may be
needed for interoperability, but it must be labeled as client behavior and must not
erase the competing signed positions.

The notary's projection is the map of selected field blocks. It may combine a title
from one card, content from another, and a date from a third. That exact combination may
never have existed in any `30828`; clients should disclose that it is a composite
projection rather than displaying a fictitious author-signed card.

An event with no selected `event_date` cannot be placed on the present timeline. This
does not make content privileged: the requirements for displaying a projection belong
to the timeline client or corpus, not to the generic acceptance operation.

### Optional materialization as a card

A notary may publish its current composite projection as a new `30828` submitted to a
downstream notary. This is an optional snapshot, not an automatic consequence of field
selection. It gives the composite one portable signed address that ordinary card tools
can inspect and cite.

The materialized card is authored by the notary key and should point back to the exact
field acts from which it was assembled. It does not replace those acts as the decision
ledger, and it does not claim that all selected fields came from one original author.
The downstream notary still makes its own explicit selections; receiving the composite
card passes nothing by itself.

Publishing another snapshot after the projection changes is an ordinary `30828`
replacement if the notary deliberately reuses its own snapshot `d`. Historical field
acts preserve how each snapshot was assembled even if relays retain only its newest
card version.

## Plurality and other emergent signals

For display and analysis, a client can derive a value identity such as:

```text
SHA-256("timeline-field-v1" || field-key || canonical-value-bytes)
```

No hash is required on the wire at first. The exact bytes preserve history, while the
derived hash cheaply groups matches. A full Merkle tree adds proof and canonicalization
surface without solving preservation, attribution, or authority.

A client may group candidate values and report:

- how many candidate cards contain the exact value;
- which disclosed keys or notaries selected it;
- whether several independent-looking sources converge;
- whether the value is newest among the material the client has seen.

Every report should identify its lens where practical: candidate cards versus signed
acts, keys considered, relay set, and observation window. Keys are cheap, relays are
incomplete, and copying proves neither independence nor truth.

Therefore a client must not translate plurality into `accepted`, `winner`, `true`, or
`passed`. A notary or its live client may inspect the signal and then sign an act, ignore
it, or treat it as evidence of manipulation. The signed act—not the signal—is the
decision.

## Notary source graphs

Each `30829` `a` link means "look here for candidate material." A notary may name more
than one such source, and clients inspect their union subject to explicit traversal
budgets. A link does not mean:

- accept everything the other notary accepts;
- delegate future decisions;
- inherit the other notary's authority;
- revoke downstream decisions when the upstream state changes;
- assign a global rank from chain depth.

Every downstream projection field requires an act signed by the downstream notary.
The field may be copied directly from a `30828`, or from bytes preserved in an upstream
`8828`. In the latter case the downstream act points to the exact upstream act as its
source; it should not point only to a changing derived projection or projection root.

Once signed, the downstream selection remains its own decision. An upstream revision,
supersession, or revocation changes the displayed provenance context, not downstream
validity. A downstream client that wishes to follow upstream changes can automatically
sign new acts. That is local automation expressed through the same explicit wire events.

Graph reachability should not be a historical validity requirement. `30829` is
replaceable, old link versions may be unavailable, and signer-provided timestamps do
not prove that a path existed when an act was signed. Chaining is discovery; the
downstream signature is authority for the downstream lens.

Clients walking notary links must keep a visited-coordinate set per traversal branch and
may impose depth, event, relay, width, and time budgets. Incomplete traversal is expected
and should be visible. Convergent routes do not create extra weight; duplicate coordinates
are inspected once. Act-id provenance edges are hashes and do not create coordinate loops.

## Scenario table

| Scenario | Required behavior |
|---|---|
| Author changes only the date | The old selected date remains until the notary explicitly selects another value. The new date appears as a candidate. |
| Author reverts to previously selected bytes | No automatic state change is necessary; the selected bytes never left. If previously changed by the notary, returning requires a new act. |
| Source card is deleted or unavailable | Copied bytes keep the projection and history readable; provenance becomes unavailable or unverified. |
| Composite uses title from X, content from Y, date from Z | Three independent acts produce a disclosed composite projection. Each field keeps its own provenance. |
| X and Y publish the same date | One exact value cluster has two possible provenance routes. Neither route is automatically original or owed public credit. |
| Many cheap keys repeat one value | A client may display the raw convergence but cannot promote it to passage or authority. |
| Notary selects no event time | An explicit empty tag block records selected absence; an unset register records no position. |
| Geohash rungs disagree | Each complete ordered `g` block is a candidate. Rungs from different candidates are never merged implicitly. |
| Date, offset time, and geohash conflict | Preserve every signed block and show a compatibility warning; do not silently normalize or invalidate. |
| Upstream notary withdraws a value | Downstream selection survives; its provenance is shown as later withdrawn upstream. |
| Notary wants to follow upstream live | Its client observes upstream changes and signs downstream replacements; no `auto` wire mode is needed. |
| Several current acts remain for one register | Show a contested notary position; do not silently use plurality. |

## Migration from the present drafts

Legacy `8828` events should keep their current card-coordinate, three-text-field meaning.
They lack a `30829` context, explicit semantic slot, and explicit absence, so readers
must not silently reinterpret them as modular notary projections.

A migration can proceed as follows:

1. New readers continue displaying legacy acts as historical card-scoped acceptance.
2. New writers create one contextual act per selected field.
3. For title, summary, and content, writers also preserve the existing copy shapes where
   possible so older readers safely under-read rather than misread.
4. A notary client may offer its operator suggested new acts based on current legacy
   acceptances, but the operator signs the contextual projection explicitly.
5. Only after the contextual model is stable should the normative drafts remove
   `passes`, "only content moves documents," and dynamic byte-live consent from notary
   projection semantics.

## Decisions still to make

The lab direction is coherent, but these details require deliberate choices before a
NIP rewrite:

1. Final names and marker positions for context, slot, scope, value, source, and credit.
2. Exact canonical encoding for content and ordered tag blocks.
3. Final encoding for field-to-predecessor edges when one act selects several fields
   whose registers have different current heads.
4. Whether a register may intentionally retain several heads after a fork, beyond
   displaying them as contested until a resolving act cites them all.
5. How clients display explicit selected absence versus an unset register.
6. How a source reference to an upstream `8828` is distinguished from a card source.
7. Whether mismatched provenance remains a selected but explicitly suspect notary
   statement, as recommended here, or is excluded from projection. Excluding it gives a
   source continuing power over the notary's state.
8. Key rotation and succession for notaries; the present model leaves a new key with an
   empty ledger.
9. Bounded discovery guidance for deep or wide notary graphs.

## Recommended baseline

The smallest model that satisfies the project's first principles is:

```text
30828 publishes candidate bundles.
8828 selects and preserves one or more exact field blocks from one source card in one notary slot.
30829 names a lens and discovers other lenses; it stores no decisions.
Clients derive composites and advisory convergence signals.
Only another 8828 changes the selected projection.
```

This captures emergent decision-making without defining an electorate, threshold,
winner, or automatic governance process. Patterns remain visible. Decisions remain
attributable to the keys that actually made them. Historical material remains legible
even when its original carrier moves on.

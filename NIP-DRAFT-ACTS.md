# NIP-XX

## Timeline Acts

`draft` `optional`

An act is a signed, permanent position toward a timeline card ([Timeline Cards NIP], kind `30828`).
Cards are documents and may be replaced; acts are records and may not. A key changes its
position by publishing a new act, never by removing an old one.

Kind `8828` (provisional), a **regular** event per NIP-01: relays store all of them, none replaces another.

## Operations

Exactly two. The operation is the presence of tags, not a declared field.

### Accept

An acceptance of one exact version of one card, scoped to one or more of the card's
three fields: `title`, `summary`, `content`. REQUIRED tags:

```
["a", "30828:<pubkey>:<d>"]        the document
["e", "<event id of the version>"]  the exact version
["p", "<author pubkey>"]            credit routing
```

**Scope is presence.** The act carries a byte-exact copy of each field it accepts, the
way the card carries it:

```
["title", "<copy of the accepted version's title>"]      title in scope
["summary", "<copy of the accepted version's summary>"]   summary in scope
content = copy of the accepted version's content          content in scope, else ""
```

- A copy present = that field is accepted. Empty or absent = out of scope. A card's
  absent field has nothing to accept, so empty is never ambiguous. An act carrying no
  copy at all accepts nothing.
- Copies are byte-exact — no normalization, no trimming. The copy is both the yardstick
  consent is measured against and the permanent record of what was signed.
- **Fields are independent.** Accepting one implies nothing about another; any
  permutation is a position. Where consensus stops on a card is itself a reading.
- What the fields *mean* is the client's business. This NIP defines three slots that
  mirror the card's own fields, nothing more.
- An act carrying a content copy and no field tags (the pre-scope form) reads as
  content-scope.

An acceptance MAY carry one supersede pointer:

```
["e", "<id of the signer's prior act>", "", "supersede"]
```

meaning: this acceptance replaces that one in the signer's current position.

#### Taking a revision

Requires no act: a fork is taken when the owner's card comes to read as the fork's newer
document, byte for byte (cards NIP, *Taking a revision*). An acceptance of a fork is
ordinary voice, and a client MUST NOT require one before treating a matching fork as
taken. The owner replaces their card with the corrected text in clean words — not the
fork's `content` verbatim, which drags the diff marks onto a card with no `cite` marker,
where they render as nothing.

### Revoke

Withdraws one of the signer's own acts, backing nothing in its place. REQUIRED tag:

```
["e", "<id of the act withdrawn>", "", "revoke"]
```

`content` MAY carry a reason. A revoked act remains visible history.

## Validation

A client MUST apply all of the following; an act failing any is ignored for derivation
(the event itself remains an ordinary event):

1. **Same-key.** A `revoke` or `supersede` target MUST be signed by the same pubkey as
   the act carrying it. Relays cannot enforce this; clients MUST.
2. **Replica check, per field.** When the accepted `e` event is retrievable, compare
   each copy the act carries against that version's same field, byte-for-byte. Three
   states:
   - **verified** — target retrieved, every carried copy equals its field.
   - **unverified** — target unavailable or replaced under its `d`. The act still counts
     as a **record** — its copies are the surviving text — but not as **consent**; the
     two are separated under *Derivation*. Clients SHOULD flag it.
   - **invalid** — target retrieved, any carried copy differs from its field. The act
     lied about what it read and MUST NOT count as an acceptance of anything.
3. **Orphan tolerance.** A pointer to an event the client has not seen is not an error.
   Hold the edge; resolve it if the target arrives.
4. **The `e` id is the truth; the `a` coordinate is an index hint.** When the client
   holds the `e` target, it MUST derive the document coordinate from the target itself
   — the target's own kind, pubkey and `d` — and MUST NOT require the act's `a` tag to
   match it. A missing, unparseable or mismatched `a` SHOULD be flagged, never dropped:
   discovery runs on `#a`, so a bad coordinate costs the act findability, and it must
   not also cost it validity.

A publisher SHOULD parse the `a` value as `<kind>:<64-hex-pubkey>:<d>` before signing
and refuse to publish on mismatch with the accepted target — recovery on the reading
side must not depend on a hand-typed string.

Cycles cannot occur: `supersede` and `revoke` point at event **ids**, which are hashes,
so the reference graph is acyclic by construction. No traversal guard is required.

## Derivation

All state is computed by the reader; none is declared.

**Current position** of a pubkey = its accept acts, minus revoked, minus superseded, minus
invalid. Ties on `created_at` break by lowest id (NIP-01). A key MAY hold current
acceptances on several cards; exclusivity is a rule of a tally, never of this kind.
**Position is total:** one key's current act at a coordinate is its whole position there;
a new act's scope replaces the prior act's entirely.

**Consent is per field, and bytes decide it.** A copy grants consent exactly while it
byte-equals that field on the event now current at the `a` coordinate. A rewritten field
sheds its own consent — no act, no cooperation from the accepting key; a field reverted
to accepted bytes regains it. **The `e` id never gates consent:** it records what version
was read, and a client still holding a superseded version MUST NOT read consent from it.
Consent surviving a rewrite would let an owner collect agreement on one text and serve
another; the inverse edge — a narrow acceptance standing while other fields move — is
open, and clients SHOULD render scope loudly ("title only · content changed since").

**Only the content copy moves documents.** Any derivation that gives a card a place
REQUIRES content in scope and live. Title and summary acceptance is voice: it counts,
renders and tallies, never custody.

Two uses, never conflated: **the record** — this key signed these bytes on this date,
permanent, untouched by replacement — and **the permission** — this card may occupy that
place, lapsing on replacement. A NIP-25 reaction is neither: it carries no copy, pins no
version, and cannot lapse.

**Tallies are views.** A client counts current acceptances through whatever lens it
chooses; two honest clients MAY disagree. Counts are not authority — keys are free to mint.

## Degradation

For a client that implements nothing here, every marker MUST fail harmless:

| dropped | an ignorant client sees | worst effect |
|---|---|---|
| field scope | pre-scope replica check: content differs → invalid | a scoped act is dropped, never miscounted |
| `supersede` | ordinary acceptance | a switcher is double-counted |
| `revoke` marker | ordinary `e` reference | a withdrawal is missed |
| whole kind | nothing (unknown kind) | acts invisible, cards intact |

Over-counting, never corruption.

## Discovery

All acceptances of a card: `{"kinds":[8828], "#a":["30828:<pubkey>:<d>"]}` — or `#e`
for one exact version, `#p` for one author's works. Results MUST pass Validation before
counting.

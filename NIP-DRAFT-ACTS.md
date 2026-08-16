# NIP-XX

## Timeline Acts

`draft` `optional`

An act is a signed, permanent position toward a timeline card ([Timeline Cards NIP], kind `30828`).
Cards are documents and may be replaced; acts are records and may not. A key changes its
position by publishing a new act, never by removing an old one.

Kind `8828` (provisional), a **regular** event per NIP-01: relays store all of them, none replaces another.

## Operations

Exactly two. The operation is the presence of tags, not a declared field.

### Endorse

An endorsement of one exact version of one card. REQUIRED tags:

```
["a", "30828:<pubkey>:<d>"]        the document
["e", "<event id of the version>"]  the exact version
["p", "<author pubkey>"]            credit routing
```

`content` MUST be a byte-exact copy of the endorsed version's `content`. The act is
both a signature over that text and an independent replicated copy of it.

An endorsement MAY carry one supersede pointer:

```
["e", "<id of the signer's prior act>", "", "supersede"]
```

meaning: this endorsement replaces that one in the signer's current position.

#### Taking a revision

When the endorsed card is a fork of the endorser's own card — someone correcting their
record — the endorsement is how the correction is taken, and no card move is needed
beyond the obvious one. The owner replaces their own card with the corrected text in
clean words, an ordinary replacement under their own `d`, and endorses the fork's exact
version. Credit routes on the act's `p` tag.

Nothing new appears on the timeline. **The argument is archived in the act, not pasted
into the record:** the act's byte copy preserves the fork's diff marks, and the card
carries the result without them. A reader derives that the suggestion was taken from
those two facts together — the owner endorsed that version, and the owner's card now
reads as that version's newer document.

Do not instead carry the fork's content verbatim into the card. It is byte-exact and so
drags the marks along, and marks on a card with no `fork` marker render as nothing at
all: the correction becomes unreadable at the very moment it is accepted.

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
2. **Replica check.** When the endorsed `e` event is retrievable, compare `content`
   byte-for-byte (no normalization; tags excluded). Three states:
   - **verified** — target retrieved, contents equal.
   - **unverified** — target unavailable or replaced under its `d`. The act still counts
     as a **record** — its copy is the surviving text — but not as **consent**; the two
     are separated under *Derivation*. Clients SHOULD flag it.
   - **invalid** — target retrieved, contents differ. The act MUST NOT count as an
     endorsement of anything.
3. **Orphan tolerance.** A pointer to an event the client has not seen is not an error.
   Hold the edge; resolve it if the target arrives.
4. **The `e` id is the truth; the `a` coordinate is an index hint.** When the client
   holds the `e` target, it MUST derive the document coordinate from the target itself
   — the target's own kind, pubkey and `d` — and MUST NOT require the act's `a` tag to
   match it. A missing, unparseable or mismatched `a` SHOULD be flagged, never dropped:
   discovery runs on `#a`, so a bad coordinate costs the act findability, and it must
   not also cost it validity. (Found in practice: one dropped colon in a hand-typed
   coordinate silently hid an otherwise valid endorsement.)

A publisher SHOULD parse the `a` value as `<kind>:<64-hex-pubkey>:<d>` before signing
and refuse to publish on mismatch with the endorsed target — recovery on the reading
side must not depend on a hand-typed string.

Cycles cannot occur: `supersede` and `revoke` point at event **ids**, which are hashes,
so the reference graph is acyclic by construction. No traversal guard is required.

## Derivation

All state is computed by the reader; none is declared.

**Current position** of a pubkey = its endorse acts, minus those it revoked, minus those
it superseded, minus invalid. Ties on `created_at` break by lowest event id (as NIP-01).
A key MAY hold several current endorsements at once; exclusivity ("one vote") is a rule
of a particular tally, never of this kind.

**Consent** is what an endorsement grants a *particular version*, and it is not the same
question as whether the act happened. An endorsement grants consent for exactly as long as
the event now current at its `a` coordinate is the event its `e` names. The moment the
owner replaces that card, the coordinate resolves to bytes nobody said yes to, and consent
lapses — with no act, no withdrawal and no cooperation from the endorser, who may be long
gone. Endorsing the new version restores it; nothing else does.

This is deliberately unforgiving, because the alternative is worse: an endorsement that
survived replacement would let an owner collect agreement on one text and then serve
another under it. **Test the coordinate, not the retrievability of the old event.** A
client that still holds a superseded version MUST NOT read consent from it.

Two uses follow, and a client MUST NOT conflate them:

- **The record** — this key signed these bytes on this date. Permanent. Replacement cannot
  touch it; that is why endorsements carry byte copies at all.
- **The permission** — this card may occupy that place in the reader's view. Lapses on
  replacement, as above.

**Accepting a card is an act, never a reaction.** A NIP-25 reaction carries no copy, pins
no version, and so cannot lapse when the text moves — it would keep saying yes to whatever
the address later held. Where a corpus needs an owner or curator to admit a card, the
signal is an endorsement of an exact version.

**Tallies** are views. A client counts current endorsements through whatever lens it
chooses (its follow graph, all keys, anything else). No event declares a result; two
honest clients MAY disagree. Endorsement counts MUST NOT be treated as authority — keys
are free to mint.

## Degradation

For a client that implements nothing here, every marker MUST fail harmless:

| dropped | an ignorant client sees | worst effect |
|---|---|---|
| `supersede` | ordinary endorsement | a switcher is double-counted |
| `revoke` marker | ordinary `e` reference | a withdrawal is missed |
| whole kind | nothing (unknown kind) | acts invisible, cards intact |

Over-counting, never corruption.

## Discovery

All endorsements of a card: `{"kinds":[8828], "#a":["30828:<pubkey>:<d>"]}` — or `#e`
for one exact version, `#p` for one author's works. Results MUST pass Validation before
counting.

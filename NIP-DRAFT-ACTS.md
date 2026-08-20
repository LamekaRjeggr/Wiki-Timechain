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

**Taking a revision requires no act.** A fork is taken when the owner's card comes to
read as the fork's newer document, byte for byte; the words agreeing is the whole
evidence, and credit routes on the fork's own `p` tag. The rule belongs to forks and is
specified there, in the cards NIP under *Taking a revision*.

An acceptance of a fork remains available and is ordinary voice — the accepting key backs
that version. It is not what takes the revision, and a client MUST NOT require one before
treating a matching fork as taken. Waiting on a ceremony leaves the absorbed fork on the
page saying what the card it corrected already says.

The owner replaces their own card with the corrected text in clean words, an ordinary
replacement under their own `d`. Do not instead carry the fork's content verbatim. It is
byte-exact and so drags the diff marks along, and marks on a card with no `fork` marker
render as nothing at all: the correction becomes unreadable at the very moment it is
accepted.

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
   not also cost it validity. (Found in practice: one dropped colon in a hand-typed
   coordinate silently hid an otherwise valid acceptance.)

A publisher SHOULD parse the `a` value as `<kind>:<64-hex-pubkey>:<d>` before signing
and refuse to publish on mismatch with the accepted target — recovery on the reading
side must not depend on a hand-typed string.

Cycles cannot occur: `supersede` and `revoke` point at event **ids**, which are hashes,
so the reference graph is acyclic by construction. No traversal guard is required.

## Derivation

All state is computed by the reader; none is declared.

**Current position** of a pubkey = its accept acts, minus those it revoked, minus those
it superseded, minus invalid. Ties on `created_at` break by lowest event id (as NIP-01).
A key MAY hold current acceptances on several cards at once; exclusivity ("one vote")
is a rule of a particular tally, never of this kind. At one coordinate, the newest
non-revoked act is the position (*Position is total*, below).

**Consent is granted per field, and bytes decide it.** A copy grants consent for its
field exactly while it byte-equals that field on the event now current at the `a`
coordinate. A field the owner rewrites sheds only its own consent — with no act, no
withdrawal and no cooperation from the accepting key, who may be long gone. A field the owner
reverts to previously accepted bytes restores that consent: same bytes, same claim.

**The `e` id never gates consent.** It is the permanent answer to what version this key
actually read; liveness has one authority, the bytes. Test the copies against the
coordinate, never the retrievability of the old event — a client that still holds a
superseded version MUST NOT read consent from it.

The unaccepted remainder is deliberately unforgiving: consent that survived a field's
rewrite would let an owner collect agreement on one text and serve another under it. The
open edge is the inverse — a field accepted narrowly stands while the fields below it
move. Clients SHOULD render scope loudly ("title only · content changed since") rather
than soften lapse.

**Position is total.** One key's current act at a coordinate is its whole position there;
a new act's scope replaces the prior act's entirely. Positions never accumulate across
acts.

**Only the content copy moves documents.** Any derivation that gives a card a place — an
author yielding a contested slot, taking a revision, a reader's own-acts spine — REQUIRES
content in scope and live. Title and summary acceptance is voice: it counts, renders and
tallies, and never carries custody. Nobody hands a slot to text they did not sign.

Two uses follow, and a client MUST NOT conflate them:

- **The record** — this key signed these bytes on this date. Permanent. Replacement cannot
  touch it; that is why acceptances carry byte copies at all.
- **The permission** — this card may occupy that place in the reader's view. Lapses on
  replacement, as above.

**Accepting a card is an act, never a reaction.** A NIP-25 reaction carries no copy, pins
no version, and so cannot lapse when the text moves — it would keep saying yes to whatever
the address later held. Where a corpus needs an owner or curator to admit a card, the
signal is an acceptance of an exact version.

**Tallies** are views. A client counts current acceptances through whatever lens it
chooses (its follow graph, all keys, anything else). No event declares a result; two
honest clients MAY disagree. Acceptance counts MUST NOT be treated as authority — keys
are free to mint.

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

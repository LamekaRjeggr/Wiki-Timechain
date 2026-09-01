# NIP-XX

## Timeline Notaries

`draft` `optional`

A **notary** is a named lens for discovering timeline cards and recording explicit
decisions about them. A notary is kind `30829` (provisional), an addressable event per
NIP-01.

A notary does not declare truth, contain an acceptance ledger, or automatically inherit
another notary's decisions. Its decisions are regular kind `8828` Timeline Acts.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", and "MAY" are as in RFC 2119.

## Vocabulary

- **Card** — a kind `30828` authored account of an event.
- **Notary coordinate** — `30829:<pubkey>:<d>`.
- **Card address** — `(author pubkey, card d)`, the replaceable lineage of one author's
  card.
- **Event slot** — `(notary coordinate, card d)`, the subject within one notary lens for
  which several cards may compete or contribute fields.
- **Notary source** — another `30829` referenced as a place to discover candidate
  material.
- **Source set** — the zero or more notary sources named by a notary. It is unordered.
- **Candidate** — a card available for a notary to inspect. Candidacy is not acceptance.
- **Projection** — the client-derived current set of fields selected by a notary's
  effective acts.

## Event

| Tag | Example | Rule |
|---|---|---|
| `d` | `["d","hcr2001"]` | REQUIRED. Opaque addressable identifier |
| `title` | `["title","HCR 2001 election results"]` | REQUIRED. Display name |
| `t` | `["t","wikitimechain"]` | REQUIRED corpus marker; additional topics allowed |
| `description` | `["description","…"]` | OPTIONAL plain text |
| `g` | `["g","9tbq"]` | OPTIONAL default geohash rung |
| `a` | `["a","30829:<pubkey>:<d>"]` | OPTIONAL and repeatable notary source |

`content` is empty or a plain-text/djot description.

A `30829` carries no card decisions. A client MUST NOT derive acceptance from a card
address placed on the notary event. Replacing a `30829` changes current identity,
description, and discovery configuration; it does not rewrite historical decisions.

There is no `passes` mode. Absence of a decision always means absence of acceptance.
A live client MAY inspect signals and sign decisions automatically, but the resulting
wire event is the same explicit `8828` another client would ask a person to sign.

## Submission and event slots

A card submits to a notary by carrying:

```json
["a", "30829:<notary-pubkey>:<notary-d>"]
```

A card MAY submit to more than one notary. Each submission places it in a different
event slot because a slot is `(notary coordinate, card d)`. The notaries may make
different decisions about the same bytes.

Cards with the same `d` under different author keys are rival or contributing candidates
in the same slot when submitted to the same notary. A bare `d` has no global meaning.

Submission is self-asserted and creates no obligation for the named notary. A card with
no notary submission is still a card, but is not discovered through a notary.

## Source graphs

A notary MAY carry any number of `a` references to other notaries. Each means only:

> Look here for additional candidate material.

The references form an unordered source set, not a hierarchy. Tag order, graph depth,
the number of paths to a card, and position in a user interface MUST NOT imply rank,
weight, delegation, or authority. Referenced notaries MAY use different `d` values.

A notary's candidate pool is the union of:

1. cards submitted directly to it; and
2. material discoverable through its source set, subject to client traversal budgets.

Discovering a card or an upstream decision does not accept it. Every field in a notary's
projection requires an effective `8828` signed by that notary's key. A client that
follows another notary live does so by observing it and signing new local acts; there is
no delegation mode on the wire.

Source graphs may branch, converge, and loop. A client MUST keep a visited-coordinate
set for each traversal branch and MUST stop a branch when it revisits a coordinate. It
MAY impose depth, width, event, relay, and time budgets. Incomplete traversal SHOULD be
shown. Convergent paths confer no extra weight and a duplicate coordinate is inspected
once.

Current graph reachability MUST NOT be required to validate an older decision. A
`30829` is replaceable and old source links may disappear. Removing a source changes
future discovery, not the validity of decisions already signed by this notary.

## Decisions

Only a valid Timeline Act signed by the pubkey in the notary coordinate changes that
notary's projection. In particular, none of the following is a decision:

- submission;
- a notary-source link;
- matching field bytes;
- plurality or recency;
- a reaction, mention, or count;
- another notary's decision.

A whole-card acceptance requires one card-scoped act. A modular projection uses
field-scoped acts. Withdrawal and replacement are explicit acts. See Timeline Acts.

## Discovery

```json
{"kinds":[30829], "#t":["<corpus-marker>"]}
{"kinds":[30828], "#a":["30829:<pubkey>:<d>", "…"]}
{"kinds":[8828],  "authors":["<notary-pubkey>", "…"]}
```

Clients walking a source graph SHOULD add referenced notary coordinates to the card
query and SHOULD validate all returned coordinates and signatures locally. Relay tag
filters are discovery hints, not validation.

## Client behavior

- A client SHOULD distinguish submitted, candidate, and accepted material.
- A source set SHOULD be presented as peer inputs, not a parent chain or ranked stack.
- Conflicting cards and field values SHOULD remain inspectable.
- A projection is derived state and MUST NOT be presented as if the `30829` declared it.
- Plurality and exact-match convergence MAY be displayed as signals, never as a protocol
  winner or automatic decision.

## Security considerations

A notary key is authority only for its own lens. Anyone may mint a notary, copy a title,
or name arbitrary sources. The reader's choice of notary is the trust decision.

Notary-source graphs do not make Sybil resistance. Multiple keys, paths, or matching
values may be controlled by one actor. Clients MUST NOT translate path count or
plurality into truth.

A notary is presently identified by its key and `d`. Key succession and delegation are
not defined by this draft.

## Example

```json
{
  "kind": 30829,
  "content": "",
  "tags": [
    ["d", "regional-record"],
    ["title", "Regional record"],
    ["t", "wikitimechain"],
    ["g", "9tbq"],
    ["a", "30829:<source-one-pubkey>:local-record"],
    ["a", "30829:<source-two-pubkey>:research-desk"]
  ]
}
```

The two `a` tags are unordered discovery inputs. Neither source can change this
notary's projection without a new `8828` signed by this notary's key.

# NIP-XX

## Timeline Notaries

`draft` `optional`

A notary is an addressable event that timeline cards ([Timeline Cards NIP], kind `30828`)
are submitted to, and whose acceptances ([Timeline Acts NIP], kind `8828`) decide which of
them pass on. A notary has a name, a key, and a setting. It holds no list: what a notary
passes on is derived from the acts its key has signed, never declared on the notary.

Kind `30829` (provisional), an **addressable** event per NIP-01.

The key words "MUST", "MUST NOT", "REQUIRED", "SHOULD", "MAY" are as in RFC 2119.

## Motivation

A list on the notary would name addresses, and an address is replaceable, so a revision
would inherit every listing it never earned. An acceptance names an exact version, so the
check runs again on every revision by construction. The acceptance is the listing.

## Event kind

| Tag | Example | Rule |
|---|---|---|
| `d` | `["d","hcr2001"]` | REQUIRED. addressable identifier; opaque |
| `title` | `["title","HCR 2001 election results"]` | REQUIRED. the notary's name |
| `t` | `["t","wikitimechain"]` | REQUIRED. the corpus marker; see *Discovery*. Also freeform topics |
| `passes` | `["passes","manual"]` | REQUIRED. `manual` or `auto`; see *What passes* |
| `description` | `["description","…"]` | OPTIONAL. plain text |
| `g` | `["g","9tbq"]` | OPTIONAL. geohash prefix rungs, as on a card. A card submitted here inherits it when it carries none |
| `a` | `["a","30829:<pubkey>:<d>"]` | OPTIONAL. the notary this one submits to; see *Chaining* |

`content` is empty or a djot description. A notary carries **no `a` tag naming a card**.
A client MUST ignore any it finds; the outbound direction is read from acts alone.

A card is **submitted** to a notary by carrying `["a","30829:<pubkey>:<d>"]`. The kind
prefix of the coordinate is what distinguishes a submission from a citation
(`30828:…` with a `cite` marker); no marker is needed and none is defined. A card MAY be
submitted to two notaries. A card carrying no submission belongs to no notary and is
found only by the whole-kind filter.

## What passes

A notary **passes** a card — makes it visible to whoever reads the notary — under one of
two rules, chosen by `passes`:

- **`auto`** — every card submitted here passes, in its current version. No act is
  involved. Automatic.
- **`manual`** — a card passes while the notary's key holds a current acceptance of it
  whose `content` copy is live: the copy byte-equals the card's current `content`, per
  *Derivation* in the acts NIP. Nothing else passes. Manual: the notary key signs each one.

Under `manual`, the check is the acts NIP's existing consent rule, applied with one key
— the notary's — as the lens. Every consequence follows from there and none is new:

- An author's revision changes the bytes. Consent lapses. The card stops passing until
  the notary reads the new version and signs again. **Every version is checked, because
  no version can inherit a check.**
- A revert to accepted bytes restores consent; same bytes, same claim.
- The acceptance carries the accepted copy, so what was passed remains readable after
  the author moves on. The decision and the text it was about survive together.
- Withdrawing a card is `revoke` on the acceptance. No second shape.
- Title or summary acceptance alone does not pass a card: *Only the content copy moves
  documents*, as the acts NIP already says.

A client MUST NOT let a notary pass a card by any other signal — not a reaction, a
mention, or an `a` tag on the notary itself.

`passes` is read from the notary's current version. Switching `auto` → `manual` makes
existing acceptances count; switching back makes them idle. Acts are not affected.

## Chaining

A notary MAY submit to another notary with an `a` tag, exactly as a card does. The
receiving notary then sees the submitting notary's **passed** cards as candidates, and
applies its own `passes` rule to each card individually — it accepts cards, never
notaries. What one notary passes is the pool the next one draws from; each link checks
the bytes for itself.

There is no root kind and no special tier. A reader's timeline is whichever notary the
reader's client is pointed at: its passed cards, in `event_date` order. A corpus MAY
designate a notary by publishing its coordinate; that is convention, and this NIP defines
nothing for it.

A notary's **candidates** are the cards submitted to it, plus the cards passed by the
notaries submitted to it. A notary passes only candidates. An acceptance of any other card
is voice: it shows on the card and moves nothing, until the author submits — an act on an
unsubmitted card is an invitation, and the author's `a` is the answer. Trust is not
transitive: following an upstream notary's decisions means signing its own acceptances.

Cycles: `a` coordinates are names and can loop. A client walking a chain MUST stop at a
coordinate it has already visited.

## Discovery

Three filters, each on one indexed tag:

```
{"kinds":[30829], "#t":["<marker>"]}                 the corpus's notaries
{"kinds":[30828], "#a":["30829:<pubkey>:<d>", …]}    cards submitted to them
{"kinds":[8828],  "authors":["<notary pubkey>", …]}   the notaries' acceptances
```

The corpus marker lives on the notary. A card need not carry it; a card is found through
the notary it is submitted to.

Acceptances by keys other than notaries' are ordinary voice per the acts NIP and are
read by `#a` as before; they never pass a card.

## Client behavior

- A card belongs to the notary named by its `a` tag. Its `g`, if absent, is the notary's.
- Rival versions (same `d`, different keys, cards NIP) are unchanged: each is submitted,
  accepted, and passed on its own.
- Where a notary under `manual` holds an acceptance whose consent has lapsed, a client
  SHOULD show that the card was passed and is waiting — the accepted copy and the current
  version are both on hand, and the difference is the thing to show.
- A notary's `passes` value MUST be shown to the reader. An automatic notary and a manual one
  look the same otherwise.
- A card submitted but not passed MUST NOT sit on the timeline. A client MAY show that
  such cards exist — a count, a fold — and MAY open them on request.
- The notary's key is the default lens. A client MAY read any key's acceptances as the
  spine instead — the reader's own, or another's — since a notary is a lens and nothing more.

## Degradation

| dropped | an ignorant client sees | worst effect |
|---|---|---|
| `passes` | — | a client MUST treat a notary with no `passes` as `manual`; an automatic notary reads as empty, never as leaky |
| a card's `a` | a card with no notary | invisible through notaries, still found by kind |
| whole kind | nothing | cards intact, acts intact, timelines unassembled |

Nothing here is state a card's meaning depends on. A notary is a lens; cards are the record.

## Security considerations

**A notary key is an authority only over its own reader.** Anyone may mint a notary and
wear any marker. Accepting or refusing a card says nothing about the card, only about
what that key passes on. A reader chooses which notary to read; that choice is the whole
trust decision, and this NIP moves it nowhere else.

**`auto` is a leak by design.** An automatic notary passes whatever is submitted to it,
including junk wearing its coordinate. Clients SHOULD show `passes` for this reason.

**Submission is self-asserted.** A card may name any notary. That costs the notary
nothing under `manual` and is the point under `auto`.

**A notary is its key.** Acceptances are found by `authors`, so a notary that rotates
keys loses every acceptance it has signed; the new key starts empty and must sign again.
There is no delegation and no successor tag. Keep the key.

## Example

```json
{
  "kind": 30829,
  "content": "",
  "tags": [
    ["d", "hcr2001"],
    ["title", "HCR 2001 election results"],
    ["t", "wikitimechain"],
    ["passes", "manual"],
    ["g", "9tbq"],
    ["a", "30829:<main-pubkey>:main"]
  ]
}
```

A card submitted to it carries `["a", "30829:<this-pubkey>:hcr2001"]`. It reaches a
reader of `main` once this key has accepted its current `content` and `main`'s key has
done the same.

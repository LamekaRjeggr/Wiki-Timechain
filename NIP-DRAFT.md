NIP-XX
======

Timeline Cards
--------------

`draft` `optional`

A timeline card is an addressable event placing one dated fact on a shared timeline.
Cards carrying the same collection label form a collection; any key may publish into
any collection, and no key may exclude another. Discovery is a marker in the indexed
`t` tag, plus self-labels carrying date, jurisdiction and geohash query shadows.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119.

## Motivation

Two problems recur wherever events are recorded permissionlessly.

**An open discovery marker is squattable.** Any key may wear any tag. This NIP splits
the roles: a marker for the relay to filter on, and a shape test the client applies to
what comes back.

**A client that does not implement a spec silently drops the tags it does not know**,
so declared state fails to travel. This NIP declares no state a card's meaning depends
on: the load-bearing signal is a field's **presence or absence**, which no client can
drop, and a dropped marker (`fork`, `adopt`, `adapt`) leaves an ordinary card.

## Event kind

A timeline card is kind `30828`, an addressable event as defined in
[NIP-01](01.md). The event is self-labeling per [NIP-32](32.md): every field is a tag
on the card itself. A client MUST ignore external kind `1985` labeling events when
applying this NIP — a card's membership and axes are read from the card alone, so that
no third party can attach a card to a collection its author did not choose.

`content` is [djot](https://djot.net). Clients that do not implement djot SHOULD render
`content` as plain text rather than as another markup language.

### Required tags

| Tag | Example | Meaning |
|---|---|---|
| `d` | `["d","proposition-number-assigned"]` | addressable identifier; republishing under the same `d` replaces |
| `event_date` | `["event_date","2026-07-01"]` | the date the card is *about*, `YYYY-MM-DD` |
| marker | `["t","wikitimechain"]` | discovery marker; see *Discovery* |
| collection | `["L","timeline.collection"]` `["l","example-timeline","timeline.collection"]` | which timeline this card belongs to |
| date buckets | `["L","timeline.date"]` `["l","2026","timeline.date"]` `["l","2026-07","timeline.date"]` | query shadow of `event_date` |

`event_date` MUST be a full `YYYY-MM-DD` date and is the card's position on the
timeline. It is distinct from the event's `created_at`, which records when this version
was signed, and from the OPTIONAL `published_at`; see *Optional tags*.

**`d` is opaque.** How a publisher mints it is their business; a client MUST NOT
derive meaning from it, whatever it appears to encode.

A card MUST carry exactly one collection label. Its value is the collection's
identifier and SHOULD be lowercase kebab-case.

Date buckets are a query shadow of `event_date`, since multi-letter tags are not
indexed by relays. A card MUST emit a `YYYY` bucket, and MUST emit a `YYYY-MM` bucket
when the month is known. **Buckets MUST encode only known precision.** Where the true
date is coarser than a day, the placeholder components of `event_date` MUST NOT be
emitted as buckets — a card known only to the year emits no month bucket.

### Location

A card describing an event with a location SHOULD carry a jurisdiction ladder. If it
does, the ladder MUST run from the top down to the event's true scope, with every rung
present.

```json
["L", "ISO-3166-1"],            ["l", "JP", "ISO-3166-1"],
["L", "ISO-3166-2"],            ["l", "JP-13", "ISO-3166-2"],
["L", "timeline.location"],     ["l", "jp-13-shibuya", "timeline.location"]
```

Relays filter on a label's *value*, not on the (`L`,`l`) pair, so an omitted rung is not
queryable even when a deeper rung implies it. That is why the whole ladder is written
out rather than derived.

- ISO rungs MUST use ISO codes verbatim under the standard namespaces `ISO-3166-1` and
  `ISO-3166-2`.
- Rungs below the ISO-3166-2 level are namespaced `timeline.location` and SHOULD be
  lowercase kebab-case, prefixed by their parent rung.
- The ladder MUST NOT extend deeper than the event's real scope. A national act stops
  at the country rung.

A collection whose events have no location is valid and carries no ladder.

### Optional tags

| Tag | Example | Rule |
|---|---|---|
| `g` | `["g","xn76urx6"]` `["g","xn76"]` `["g","xn7"]` | geohash, point events only. Emitted as prefix rungs for proximity queries. MUST NOT be a jurisdiction's centroid. |
| `t` | `["t","taproot"]` | freeform topic. Unspecified by design: no registry, no controlled vocabulary. |
| `published_at` | `["published_at","1784681375"]` | original publication time as in [NIP-23](23.md). SHOULD be preserved across replacements of the same `d`, while `created_at` changes with each. |
| `event_time` | `["event_time","14:30"]` | UTC time of day refining `event_date`. `HH:MM` or `HH:MM:SS`, 24-hour. MUST encode only known precision. Emits no bucket and MUST NOT affect discovery or dedup. |

## Text fields

Three fields carry a card's text, a gradient of length:

| Field | Example | Role |
|---|---|---|
| `title` tag | `["title","Proposition number assigned"]` | the shortest — names the card |
| `summary` tag | `["summary","The vendor shipped patched firmware for every affected model."]` | the event in plain words, in the publisher's voice; SHOULD be one or two sentences |
| `content` | djot body | the longest — the full statement, where links and sources live |

**None is required.** A card SHOULD carry at least one; a card carrying none is valid
and says nothing. When `summary` and `content` are both present, `summary` MUST NOT
assert anything `content` does not support.

**All three are human-readable free text.** A client MUST NOT parse any of them for
machine-readable state, and MUST NOT require any particular wording or form. The only
machine-readable signal these fields carry is **presence or absence**; see *Motivation*.

What a given combination *means* — a `summary` standing alone, a bare `title` — is
vocabulary, and vocabulary belongs to a corpus, not to this NIP. A publisher MAY build
conventions on these shapes; a conforming client MAY surface a shape distinctly, but
MUST derive it from presence and absence alone, never from wording. Declared states
such as *corroborated* or *disputed* are deliberately absent: no publisher can credibly
make such a claim about their own card. Disagreement is expressed by a second key
publishing the same `d`.

A client MAY render every field a card carries, or use the gradient as tiers of
disclosure — `title` in a list, `summary` in a preview, `content` on open. A client
rendering a subset MUST fall back to the fields the card does carry, so that no card
carrying any text renders blank.

Filling a card in under its own `d` — adding the `content` a `summary` anticipated —
is an ordinary replacement per [NIP-01](01.md), not a revision: no `fork` marker is
involved, because the recorded event never changed. A publisher MUST NOT reuse a `d`
for an unrelated card: reactions and comments address `30828:<pubkey>:<d>` and would
silently reattach.

## Revisions

A card MAY carry a revision of a document that another card records. Such a card MUST
tag its parent with a `fork` marker in both forms:

```json
["a", "30828:<pubkey>:<parent-d>", "", "fork"],
["e", "<event id of the version revised>", "", "fork"]
```

The third element is the relay-hint slot and MUST be present, empty if unknown; the
marker is the fourth element. Both tags are REQUIRED: the `a` coordinate survives an
edit of the parent, while the `e` id pins the exact version this card was built
against.

The change itself is expressed with djot's insert and delete syntax, `{-removed-}` and
`{+added+}`. A client MUST NOT render a card as a diff unless it carries both a `fork`
marker and marks in `content`; either alone is an ordinary card.

A marked card asserts two documents, and both MUST be recoverable from it: stripping the
deletions and unwrapping the insertions yields the newer document exactly, and the
converse yields the older. A publisher SHOULD verify a marked card by performing both
reconstructions rather than by reading it.

## Adoption and adaptation

A card MAY cite another card as its source. Two markers, in the slot the `fork`
marker uses:

- `adopt` — the card carries the source's content verbatim. A card MUST NOT
  carry more than one `adopt`.
- `adapt` — the card's content is its own, built on the source. A card MAY carry
  many.

Each source is cited with three tags, all REQUIRED, carrying the same marker:

```json
["a", "30828:<pubkey>:<source-d>", "", "adopt"],
["e", "<event id of the version carried>", "", "adopt"],
["p", "<pubkey of the source's author>", "", "adopt"]
```

The `a` coordinate survives replacement of the source, the `e` id pins the exact
version cited, and the `p` tag routes credit. The adopting card keeps its own
`d`; a shared `d` under a different key remains the rival-version case, not
adoption.

**The `e` id is a commitment, not a link.** A client MUST NOT dereference it: no
fetching the source, no version comparison, no derived "since edited" state.

An adopting card is an ordinary card. It MUST pass the membership gate on its
own tags, and it deduplicates, replaces and displays like any other.

A reaction ([NIP-25](25.md)) is not an adoption. Citing a source requires
publishing a card.

A client MAY render an attribution line from these tags (for example
`via <npub> · adopted`), derived at read time. No attribution state is stored.

## Discovery

A client discovers cards with a single indexed filter (the limit is illustrative):

```json
{"kinds": [30828], "#t": ["<marker>"], "limit": 500}
```

The marker names a corpus, not this protocol. It is a lowercase single-word `t` value
chosen by whoever starts one; `wikitimechain` is the marker of the first deployed
corpus. A card MUST carry the marker of the corpus it belongs to, and a client is
configured with the marker or markers it reads. A marker is permanent in practice, since
changing it requires re-signing every card.

**The marker and freeform topics share the `t` tag.** A card MAY therefore carry many
`t` values, and nothing distinguishes a marker from a topic by inspection. Two
consequences, both intended:

- A client MUST test for the *presence* of its corpus marker among a card's `t` values,
  and MUST NOT assume a card carries only one.
- A topic value on an unrelated card may coincide with a corpus marker, and that card
  will be returned by the corpus's discovery filter. This is not a defect to be patched
  in the tag layout; it is precisely what the membership gate below exists to absorb.

### The membership gate

**A marker is discovery bait, not proof.** Any key may wear any marker. A client MUST
apply the following test to every event it receives, whatever the source, and MUST
discard events that fail it:

> the marker, **and** a parseable `YYYY-MM-DD` `event_date`, **and** a
> `timeline.collection` label.

The collection identifier is read from that label's value.

### Labels are indexed by value only

Relays index a label by its value; the namespace (the `L` tag, and the label's third
element) is **not** part of the filter. `{"#l":["2026"]}` matches the value `2026` in
any namespace, including an unrelated one.

Implementations MUST NOT substitute an `#l` filter for the membership gate. Value
grammars in this NIP (ISO codes, kebab identifiers, `YYYY` and `YYYY-MM` dates) are
kept mutually distinguishable to make collisions unlikely, but they are not a guarantee
and MUST NOT be relied on as one.

### Axes do not compose

Collection, date and location are all `l` values. A single filter's `#l` array is an
OR, and two constraints sharing the key `l` cannot be AND-ed in one `REQ`. A client
requiring more than one axis MUST fetch on the most selective one and filter the
remainder locally. Implementations MUST NOT assume server-side multi-axis AND.

Exact membership of one collection is:

```json
{"kinds": [30828], "#l": ["<collection>"]}
```

whose results MUST be re-checked against the gate.

## Client behavior

- Cards are deduplicated by the addressable-event rules of [NIP-01](01.md) — newest
  `created_at` per (kind, pubkey, `d`) — which, since this NIP defines a single kind,
  is a key of pubkey and `d`.
- Cards from **different** pubkeys sharing a `d` MUST NOT be collapsed. They are rival
  versions of one entry and a client SHOULD present them as such rather than choosing
  between them silently.
- A card's displayed date MUST be `event_date`. Date buckets are query shadows and MUST
  NOT be used for display.
- Inbound citations of a card are queried with `#a`, `#e` or `#p` filters, and the
  results MUST be filtered to events carrying an `adopt` or `adapt` marker — a bare
  `#p` match is an ordinary mention. Any reputation derived from these edges is
  computed at read time; no score is stored or declared.

### Marginalia is addressed by kind

Reactions ([NIP-25](25.md)) and comments ([NIP-22](22.md)) address a card at
`30828:<pubkey>:<d>`. Republishing a card's content under a different kind therefore
gives it a new address, and every existing reaction and comment on it resolves to
nothing — with no error surfaced to the reader.

## Publishing

A publisher signs a kind `30828` with the required tags and sends it to any relay; a
collection exists once a card carries its identifier, with no registry and no
permission. Whether a client shows every conforming card, or ranks and filters what it
shows, is outside this NIP.

## Security considerations

**The marker is squattable** (see *The membership gate*). The gate discards an unusable
card on shape; it cannot establish authorship or good faith, and it is not intended to.

**There is no author allowlist.** Any key passing the gate is admitted, which is the
point of the scheme and also its cost: junk and forgeries pass a shape test as readily
as records do. Clients expecting adversarial input SHOULD rank rather than gate, using
signals outside this NIP such as the reader's own follow graph. Reaction counts MUST NOT
be treated as authority: keys are free to mint.

**Citation edges are self-asserted and free to mint.** Keys cost nothing: a key may
adopt its own cards under other keys, and copying without an `adopt` tag is
undetectable. Citation counts MUST NOT be treated as authority. A cited `e` id may
reference a version no relay still holds; a dangling id is not an error.

**Self-asserted values MUST NOT be treated as evidence.** `created_at`, `published_at`,
`event_date` and `event_time` are all written by the signer and none is attested.

## Example

A region-scoped card, with no local rung and no geohash:

```json
{
  "kind": 30828,
  "content": "Over the summer the elections authority assigns the measure its proposition number for the November ballot.\n\nSource: [Elections authority — ballot measures](https://example.org/ballot-measures)",
  "tags": [
    ["d", "proposition-number-assigned"],
    ["title", "Proposition number assigned"],
    ["published_at", "1784681375"],
    ["event_date", "2026-07-01"],
    ["event_time", "14:30"],
    ["t", "wikitimechain"],
    ["L", "timeline.collection"],
    ["l", "example-timeline", "timeline.collection"],
    ["L", "timeline.date"],
    ["l", "2026", "timeline.date"],
    ["l", "2026-07", "timeline.date"],
    ["L", "ISO-3166-1"],
    ["l", "JP", "ISO-3166-1"],
    ["L", "ISO-3166-2"],
    ["l", "JP-13", "ISO-3166-2"]
  ]
}
```

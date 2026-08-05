NIP-XX
======

Timeline Cards
--------------

`draft` `optional`

A timeline card is an addressable event placing one dated fact on a shared timeline.
Cards carrying the same collection label form a collection; any key may publish into
any collection, and no key may exclude another. Discovery is a self-label scheme under
a single-letter marker, with date, jurisdiction and geohash query shadows.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119.

## Motivation

Two problems recur wherever events are recorded permissionlessly.

The first is that an open discovery marker is squattable. Any key may wear any tag, so a
marker cannot certify membership. This NIP separates the two roles: a marker for the
relay to filter on, and a shape test the client applies to what comes back.

The second is that a client which does not implement a spec will silently drop the tags
it does not know. Any state declared by a tag therefore fails to travel. Where this NIP
must express a card's state, it does so by the card's *shape* — a field's presence or
absence — which no client can drop.

## Event kind

A timeline card is kind `30828`, an addressable event as defined in
[NIP-01](01.md). The event is self-labeling per [NIP-32](32.md): every field is a tag
on the card itself. Cards MUST NOT be labeled by a separate kind `1985` event.

`content` is [djot](https://djot.net). Clients that do not implement djot SHOULD render
`content` as plain text rather than as another markup language.

### Required tags

| Tag | Example | Meaning |
|---|---|---|
| `d` | `["d","proposition-number-assigned"]` | addressable identifier; republishing under the same `d` replaces |
| `title` | `["title","Proposition number assigned"]` | display title |
| `event_date` | `["event_date","2026-07-01"]` | the date the card is *about*, `YYYY-MM-DD` |
| marker | `["t","wikitimechain"]` | discovery marker; see *Discovery* |
| collection | `["L","timeline.collection"]` `["l","example-timeline","timeline.collection"]` | which timeline this card belongs to |
| date buckets | `["L","timeline.date"]` `["l","2026","timeline.date"]` `["l","2026-07","timeline.date"]` | query shadow of `event_date` |

`event_date` MUST be a full `YYYY-MM-DD` date and is the card's position on the
timeline. It is distinct from the event's `created_at`, which records when this version
was signed, and from `published_at`, which is OPTIONAL and carries the original
publication time as in [NIP-23](23.md).

A card MUST carry exactly one collection label. Its value is the collection's
identifier and SHOULD be lowercase kebab-case.

Date buckets are a query shadow of `event_date`, since multi-letter tags are not
indexed by relays. A card MUST emit a `YYYY` bucket, and MUST emit a `YYYY-MM` bucket
when the month is known. **Buckets MUST encode only known precision.** Where the true
date is coarser than a day, the placeholder components of `event_date` MUST NOT be
emitted as buckets — a card known only to the year emits no month bucket.

### Location

A card describing an event with a location SHOULD carry a jurisdiction ladder: every
rung from the top down to the event's true scope.

```json
["L", "ISO-3166-1"],            ["l", "JP", "ISO-3166-1"],
["L", "ISO-3166-2"],            ["l", "JP-13", "ISO-3166-2"],
["L", "timeline.location"],     ["l", "jp-13-shibuya", "timeline.location"]
```

Every rung MUST be present on the card. Relays filter on a label's *value*, not on the
(`L`,`l`) pair, so an omitted rung is not queryable even when it is implied by a deeper
one.

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
| `summary` | `["summary","The vendor shipped patched firmware for every affected model."]` | the event in plain words, in the publisher's voice. SHOULD be one or two sentences. MUST NOT assert anything `content` does not support. REQUIRED on a card with no `content`; see *Leads*. |

A client MAY offer `summary` in place of `content`. A card without one MUST render in
full rather than render as empty.

## Leads

A card with a `summary` and **no `content`** is a *lead*: an event believed to have
happened, for which no citable record has yet been found. The absent body is the
declaration. A client that does not implement this NIP renders an empty body and the
hedge survives; a status tag would be dropped and the hedge would not.

The `title` of a lead SHOULD open with a short word and an em dash marking the state —
`Lead — ` is RECOMMENDED. The marker word MUST describe the card, not the world: it
must remain true until the card itself changes.

A lead MUST carry every required tag. A lead SHOULD state its date's uncertainty in
`summary`, and `event_date` takes the first day of the stated range.

A lead becomes a record **in place**: same `d`, same `published_at`, with `content`
added. Clients MUST NOT treat this as a revision — no `fork` marker is involved,
because the recorded event never changed. Publishers MUST NOT publish the record under
a new `d`, and MUST NOT reuse a lead's `d` for an unrelated card: reactions and
comments address a card as `30828:<pubkey>:<d>` and would silently reattach.

This NIP defines exactly two states, lead and record. Intermediate states such as
*corroborated* or *disputed* are deliberately absent: each would have to be declared
rather than read off the card, and a declaration does not travel. Disagreement is
expressed by a second key publishing the same `d`.

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
`{+added+}`. A client MAY render such a card as a diff only when it carries both a
`fork` marker and marks in `content`; either alone is an ordinary card.

A marked card asserts two documents. A client or publisher verifying one SHOULD do so
by reconstruction: stripping the deletions and unwrapping the insertions MUST yield the
newer document exactly, and the converse MUST yield the older.

## Discovery

A client discovers cards with a single indexed filter:

```json
{"kinds": [30828], "#t": ["<marker>"], "limit": 500}
```

The marker names a corpus. It is a lowercase single-word `t` value chosen by whoever
starts one; `wikitimechain` is the marker of the first deployed corpus. A card MUST
carry the marker of the corpus it belongs to. A marker is permanent in practice, since
changing it requires re-signing every card.

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

- Cards MUST be deduplicated on `pubkey:d`, newest `created_at` winning. The kind MUST
  NOT form part of that key.
- Cards from **different** pubkeys sharing a `d` MUST NOT be collapsed. They are rival
  versions of one entry and a client SHOULD present them as such.
- A card's displayed date MUST be `event_date`. Date buckets are query shadows and MUST
  NOT be used for display.
- A client SHOULD read `event_date` leniently when rendering a collection it has already
  admitted, and strictly when admitting cards during discovery.

### Marginalia is addressed by kind

Reactions ([NIP-25](25.md)) and comments ([NIP-22](22.md)) address a card at
`30828:<pubkey>:<d>`. Republishing a card's content under a different kind therefore
gives it a new address, and every existing reaction and comment on it resolves to
nothing — with no error surfaced to the reader. Any future change of kind requires
either a migration path for marginalia or an explicit decision to abandon it.

## Publishing

There is no registry to join and no key to be added to. A publisher signs a kind `30828`
with the required tags and sends it to any relay. A collection exists once a card
carries its identifier; a second key publishing into that collection needs no
permission, and republishing another key's `d` produces a coexisting rival version
rather than a collision.

Whether a client shows every conforming card, or ranks and filters what it shows, is
outside this NIP. The event format is fixed here; the reading is not.

## Security considerations

**The marker is squattable and this is not fixable at the tag level.** Single-letter tag
values are open by construction. The membership gate mitigates the consequence — an
unusable card is discarded on shape — but it cannot establish authorship or good faith,
and it is not intended to.

**There is no author allowlist.** Any key passing the gate is admitted, which is the
point of the scheme and also its cost: junk and forgeries pass a shape test as readily
as records do. Clients expecting adversarial input SHOULD rank rather than gate, using
signals outside this NIP such as the reader's own follow graph. Reaction counts MUST NOT
be treated as authority: keys are free to mint.

**Self-asserted values MUST NOT be treated as evidence.** `created_at`, `published_at`
and `event_date` are all written by the signer and none is attested.

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

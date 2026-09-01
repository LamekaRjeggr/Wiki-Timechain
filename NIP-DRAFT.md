NIP-XX
======

Timeline Cards
--------------

`draft` `optional`

A timeline card is an addressable event placing one dated fact on a shared timeline.
A card is submitted to a notary ([Timeline Notaries NIP], kind `30829`) by an `a` tag;
any key may submit to any notary, and what a notary passes on is its own key's
acceptances ([Timeline Acts NIP], kind `8828`). Discovery runs through the notary.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119.

## Motivation

Two problems recur wherever events are recorded permissionlessly.

**Anyone can submit anything.** This NIP splits submission from passing: a card names
the notary it is submitted to, and the notary's own acceptances decide what a reader
sees. No allowlist, and no key may exclude another from submitting.

**A client that does not implement a spec silently drops the tags it does not know.**
So this NIP declares no state a card's meaning depends on: the load-bearing signal is a
field's **presence or absence**, which no client can drop. The one case that degrades
worse — a `cite` marker dropped from a fork holding its parent's `d` — leaves an
unexplained rival at a shared address, bounded by the marks, which travel in `content`.

## Event kind

A timeline card is kind `30828`, an addressable event as defined in
[NIP-01](01.md). Every field is a tag on the card itself; a client MUST ignore external
labeling events (kind `1985`) when applying this NIP, so that no third party can attach
a card to a notary its author did not choose.

`content` is [djot](https://djot.net). Clients that do not implement djot SHOULD render
`content` as plain text rather than as another markup language.

### Required tags

| Tag | Example | Meaning |
|---|---|---|
| `d` | `["d","proposition-number-assigned"]` | addressable identifier; republishing under the same `d` replaces |
| `event_date` | `["event_date","2026-07-01"]` | the date the card is *about*, `YYYY-MM-DD` |

`event_date` MUST be a full `YYYY-MM-DD` date and is the card's position on the
timeline. It is distinct from the event's `created_at`, which records when this version
was signed, and from the OPTIONAL `published_at`; see *Optional tags*. Where the true
date is coarser than a day, the placeholder components are the publisher's convention
and a client MUST NOT read precision from them.

**`d` is opaque.** How a publisher mints it is their business; a client MUST NOT
derive meaning from it, whatever it appears to encode.

### Optional tags

| Tag | Example | Rule |
|---|---|---|
| `a` | `["a","30829:<pubkey>:<d>"]` | submission: the notary this card belongs to. At most two. A card carrying none belongs to no notary and is found only by the whole-kind filter. Distinguished from a citation by the kind prefix; no marker. |
| `g` | `["g","xn76urx6"]` `["g","xn76"]` `["g","xn7"]` | geohash, point events only. Emitted as prefix rungs for proximity queries. MUST NOT be a jurisdiction's centroid. A card carrying none takes its notary's. |
| `t` | `["t","taproot"]` | freeform topic. Unspecified by design: no registry, no controlled vocabulary. A corpus marker MAY ride here too; see *Discovery*. |
| `published_at` | `["published_at","1784681375"]` | original publication time as in [NIP-23](23.md). SHOULD be preserved across replacements of the same `d`, while `created_at` changes with each. |
| `event_time` | `["event_time","14:30"]` `["event_time","06:15:00-07:00"]` | time of day refining `event_date`. `HH:MM` or `HH:MM:SS`, 24-hour. A bare value is UTC. A trailing ISO 8601 offset (`±HH:MM`) marks local civil time at the event as the source stated it; `event_date` is then that local calendar day and the value MUST NOT be converted. MUST encode only known precision. Clients MAY normalize through the offset for sub-day ordering. MUST NOT affect discovery or dedup. |

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

## Modular field blocks

Timeline Acts may select fields from a card without changing the card format. For that
purpose, a kind `30828` has exactly six core modular field blocks:

| Block | Exact bytes |
|---|---|
| `title` | the complete ordered list of every `title` tag |
| `summary` | the complete ordered list of every `summary` tag |
| `content` | the exact `content` string |
| `event_date` | the complete ordered list of every `event_date` tag |
| `event_time` | the complete ordered list of every `event_time` tag |
| `g` | the complete ordered list of every geohash `g` tag |

The complete `g` list is one block. A selector MUST NOT mix individual geohash rungs
from different source cards. An empty list or empty content string is that source card's
absence of the block; Timeline Acts distinguish selecting that absence from leaving a
register unchanged.

The following are structural or documentary metadata, not partial-selection blocks:
`d`, `a`, `published_at`, `t`, and provenance or decision-reference tags. A whole-card
acceptance preserves them inside the complete signed source envelope, but a partial-card
selection does not transplant them into another projection.

This block view adds no required tag and changes no existing `30828` serialization.
Future specifications may define additional selectable blocks; clients MUST NOT infer
new blocks merely from an unfamiliar tag name.

Filling a card in under its own `d` — adding the `content` a `summary` anticipated —
is an ordinary replacement per [NIP-01](01.md), not a revision: no `cite` marker is
involved, because the recorded event never changed. A publisher MUST NOT reuse a `d`
for an unrelated card: reactions and comments address `30828:<pubkey>:<d>` and would
silently reattach.

## Citations

A card built from a version another card records — a revision, an extract, a verbatim
carry, a new text drawing on it — MUST tag its source with a `cite` marker in both forms:

```json
["a", "30828:<pubkey>:<source-d>", "", "cite"],
["e", "<event id of the version cited>", "", "cite"]
```

The third element is the relay-hint slot and MUST be present, empty if unknown; the
marker is the fourth. Both tags are REQUIRED: `a` survives an edit of the source, `e` pins
the exact version. A `p` tag with the same marker SHOULD route credit; its absence does
not invalidate the citation. A card MAY carry many. `cite` is the only citation marker;
a client MUST read the retired words `fork` and `adopt` as `cite`, and a publisher MUST
NOT emit them.

**A citation asserts only that this card derives from that exact version.** It claims no
replacement and declares no kind; what kind it is, the bytes say.

### What kind of citation it is, the bytes say

A citing card's **newer document** is its reconstruction if it carries marks (below), else
its `content`. Compare it, byte for byte, with the `content` now held at the cited
coordinate:

- **Equal, and the source's current id is the cited `e`** — the card **carries** its source.
- **Equal, and the id differs** — the source moved to meet the card: the card is **taken**.
- **Different** — the card is a **fork**: its own text, built on the source.

The `e` id is a commitment, not a link: it is compared against an id already on the page
and MUST NOT be dereferenced. A client MAY render the derived case (`· carries`,
`· revises`) and MUST NOT let a card declare one. A replaced source may turn a carry into
a fork; that drift is accepted.

### The address a citing card takes

Under a **different** key, a citing card MAY take its source's `d`, and SHOULD when it
answers that card rather than adding to the record: the two then stack as rival versions
of one entry, lineage named by the `e` id. A new `d` is an additional card, shown beside
the source. A card doing both takes the source's `d`; a verbatim carry answers nothing
and SHOULD take its own.

This is the only way to correct another key's card. Nothing is retracted on publication:
the source's key remains the only one that can replace it, and a fork stops standing only
when the source's words come to match it (*Taking a revision*).

A citing card MUST NOT take the source's `d` under the **source's own** key — that is
replacement per [NIP-01](01.md), the one act that destroys a version.

A fork MAY mark its changes with djot's `{-removed-}` and `{+added+}`, and a fork holding
its source's `d` SHOULD: the source may be replaced at any time, and a marked fork carries
both documents in its own bytes. A client MUST NOT render a diff unless the card carries
both a `cite` marker and marks. Both documents MUST be recoverable — strip deletions and
unwrap insertions for the newer, the converse for the older — and a publisher SHOULD
verify by performing both reconstructions.

### Taking a revision

A fork is **taken** when the source's current `content` is byte for byte the fork's newer
document (no normalization, no trimming; `content` only) and the source was replaced after
the fork cited it. The words agreeing is the whole evidence: no act, no tag. The owner
takes a revision by replacing their own card with the corrected text in clean words.

A taken fork MUST NOT hold a slot of its own: behind the source, or a mark on it, at the
client's choice. It stays addressable, and the source MUST credit the fork's author (its
`p` tag or pubkey) — the credit is the reader's route to it, and the point of the rule.

A citing card is an ordinary card: it passes the gate on its own tags and deduplicates,
replaces and displays like any other. A reaction ([NIP-25](25.md)) is not a citation.

## Discovery

A card is found through its notary, in two indexed filters (the notary NIP has the
third, for acceptances):

```json
{"kinds": [30829], "#t": ["<marker>"]}
{"kinds": [30828], "#a": ["30829:<pubkey>:<d>", "…"]}
```

The marker names a corpus, not this protocol; it lives on the notary. `wikitimechain`
is the marker of the first deployed corpus. A card MAY carry it in `t` as well, so that
`{"kinds":[30828],"#t":["<marker>"]}` still finds it, but nothing reads membership from
it.

**The membership gate.** A client MUST apply the following test to every event it
receives, whatever the source, and MUST discard events that fail it:

> a parseable `YYYY-MM-DD` `event_date`.

Whether the card is *shown* is the notary's decision, per its `passes` rule; the gate
only discards what cannot be placed on a timeline.

## Client behavior

- Cards deduplicate per [NIP-01](01.md): newest `created_at` per (pubkey, `d`).
- Cards from **different** pubkeys sharing a `d` MUST NOT be collapsed; they are rival
  versions of one entry. The exception is a taken fork (*Taking a revision*). A fork's
  answer is shown from its own marks, never by naming the `e` id; an unmarked fork is
  called a fork and nothing more.
- **Lineage is walked by `e`, never by `a`.** An id is a hash and cannot loop; a
  coordinate is a name and can. `a` is a discovery index only.
- A card's displayed date MUST be `event_date`.
- A client that does not know a card's corpus MUST still render `title`, `summary` and
  `content` plainly, in that order, under `event_date`.
- Inbound citations are queried with `#a`, `#e` or `#p` and MUST be filtered to events
  carrying a `cite` marker — a bare `#p` match is a mention. Reputation from these edges
  is computed at read time; nothing is stored or declared.

### Marginalia is addressed by kind

Reactions ([NIP-25](25.md)) and comments ([NIP-22](22.md)) address a card at
`30828:<pubkey>:<d>`. Republishing the same content under a different kind changes the
address and silently orphans every existing reaction and comment.

## Publishing

A publisher signs a kind `30828` with the required tags and sends it to any relay. A
notary exists once someone publishes one; there is no registry. What a client chooses
to show is outside this NIP.

## Security considerations

**Submission is self-asserted.** Any key may name any notary; the gate discards an
unusable card on shape and establishes neither authorship nor good faith. What a reader
sees is the notary's decision, and choosing a notary is the reader's whole trust
decision. Under `passes: auto` everything submitted is shown, junk included.

**There is no author allowlist.** A key costs nothing, so a card may be published under
a key used once; the signature is the whole credit and nothing else is required. Reaction
and citation counts MUST NOT be treated as authority: keys are free to mint.

**Citation edges are self-asserted.** A key may cite its own cards under other keys;
copying without a `cite` tag is undetectable. A cited `e` id
may reference a version no relay still holds; a dangling id is not an error.

**Self-asserted values MUST NOT be treated as evidence.** `created_at`, `published_at`,
`event_date` and `event_time` are all written by the signer and none is attested.

## Example

A card submitted to one notary, with no geohash of its own:

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
    ["a", "30829:<pubkey>:example-timeline"]
  ]
}
```

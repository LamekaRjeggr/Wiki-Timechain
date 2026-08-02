# Collection & discovery convention — kind 30828

**LIVE.** Cards are nostr **kind 30828**, addressable per NIP-01. Discovery is a NIP-32
self-label scheme under one global marker, with jurisdiction, date-bucket and geohash query
shadows. The viewer stays a single zero-dependency `index.html`.

**There is no version number on this document.** The kind number is the version: any break
large enough to matter gets a new kind, which is exactly what the answer below prescribes. A
parallel `vN` counter would be a second name for the same thing. (`v1`/`v2` survive in the
appendix as historical names for two tag-scheme changes made while riding kind 30818.)

## Why our own kind

The convention originally rode **kind 30818**, NIP-54's wiki article, to inherit its rendering
in wikifreedia and other wiki clients for free. Asked directly whether that was the right
shape — [nostr-protocol/nips#2426](https://github.com/nostr-protocol/nips/issues/2426) —
fiatjaf answered in one line:

> No. Use a new kind number for the thing you want to do.

So the cards moved to **30828**, chosen ten above 30818 with nothing claimed in between, so the
lineage stays legible. **The tag structure was kept whole** — `d`, `title`, `published_at`,
`event_date`, the marker and every `L`/`l` namespace carry over unchanged, and content stays
djot. The kind integer was the only forced change.

Two things stopped being borrowed and became ours to define:

- **`fork`** — no longer NIP-54's marker, so the revision semantics are specified here
  (*Revisions and diffs*, below) rather than deferred.
- **The `t` marker** — no longer needed as identity, since the kind now carries that. It is kept
  as an index that spans kinds, which is what made the migration surviveable.

The known cost, accepted: the corpus no longer renders in NIP-54 wiki clients. That free
rendering was the whole reason for riding 30818.

## The tag scheme

Every field is a tag on the 30828 event itself (self-labeling, NIP-32 — the card
labels itself; no `1985` labeling event, no `e`/`p`/`a` target).

### Required — on every card

| Tag | Example | Meaning |
|---|---|---|
| `d` | `["d","2026-proposition-number"]` | addressable identifier (NIP-01/54); republish = same `d` |
| `title` | `["title","Proposition number assigned"]` | display title |
| `event_date` | `["event_date","2026-07-01"]` | **display-precision truth**, `YYYY-MM-DD`; where the card sits on the spine |
| `t` marker | `["t","wikitimechain"]` | the global discovery marker — lowercase, one word, no `#` |
| collection | `["L","wikitimechain.collection"]` `["l","hcr2001-fast-election-results","wikitimechain.collection"]` | which timeline this card belongs to |
| date buckets | `["L","wikitimechain.date"]` `["l","2026","wikitimechain.date"]` `["l","2026-07","wikitimechain.date"]` | query shadow of `event_date`: **year and month, both** |

`published_at` (NIP-54, original publish time) is carried unchanged and is **not** the
same as `event_date` or the event `created_at`.

### Required when the card has a location — the jurisdiction ladder

Emit the **full ladder from the top down to the event's true scope** — every rung
present, because relays filter on the `l` **value**, not the (`L`,`l`) pair, so a rung
is only queryable if its value is physically on the card. Do **not** fabricate rungs
deeper than the event's real scope.

```json
["L", "ISO-3166-1"],           ["l", "US", "ISO-3166-1"],
["L", "ISO-3166-2"],           ["l", "US-AZ", "ISO-3166-2"],
["L", "wikitimechain.location"], ["l", "us-az-maricopa", "wikitimechain.location"],
                                 ["l", "us-az-maricopa-phoenix", "wikitimechain.location"]
```

- ISO rungs use ISO codes verbatim (`US`, `US-AZ`) under the standard NIP-32
  namespaces `ISO-3166-1` / `ISO-3166-2`.
- Sub-state rungs are **kebab-case, parent-prefixed** (`us-az-maricopa`,
  `us-az-maricopa-phoenix`) under `wikitimechain.location`.
- **Scope, not fabrication.** A statewide act stops at `US-AZ` — no county rung. A
  county event adds `us-az-maricopa`. A city point event adds the city rung. The
  ladder goes as deep as the event genuinely is, no deeper.

### Optional

| Tag | Example | Rule |
|---|---|---|
| geohash | `["g","9w0d3fjq"]` `["g","9w0d"]` `["g","9w0"]` | **point events only** — never a jurisdiction's centroid. Emit as prefix rungs for proximity queries. |
| topic | `["t","taproot"]` | freeform lowercase `t` values, **deliberately unspecced** — no registry, no controlled vocabulary. Add as many as fit. |
| summary | `["summary","Coinkite shipped patched firmware for every affected model. The patch stops the bug. It does not fix a seed already made with it."]` | the event in plain words, the publisher's voice (the nostr `summary` tag, NIP-23 — not a new name). One or two short sentences, ~200 chars, no case or statute numbers. It **may never assert what the `content` cannot prove**: the body is the record, the summary is the reading of it. A viewer may offer it in place of the body; cards without one read in full. |

## Worked example — a statewide card (no county, no geohash)

```json
{
  "kind": 30828,
  "content": "Over the summer the Secretary of State assigns HCR 2001 its proposition number for the November ballot.\n\nAPPROXIMATE DATE: \"Summer 2026\" — placed at 2026-07-01.\n\nSource: [Arizona Secretary of State — ballot measures](https://azsos.gov/elections/ballot-measures)",
  "tags": [
    ["d", "2026-proposition-number"],
    ["title", "Proposition number assigned"],
    ["published_at", "1784681375"],
    ["event_date", "2026-07-01"],
    ["t", "wikitimechain"],
    ["L", "wikitimechain.collection"],
    ["l", "hcr2001-fast-election-results", "wikitimechain.collection"],
    ["L", "wikitimechain.date"],
    ["l", "2026", "wikitimechain.date"],
    ["l", "2026-07", "wikitimechain.date"],
    ["L", "ISO-3166-1"],
    ["l", "US", "ISO-3166-1"],
    ["L", "ISO-3166-2"],
    ["l", "US-AZ", "ISO-3166-2"]
  ]
}
```

A statewide act by the Secretary of State: the ladder stops at `US-AZ`, and there is
no `g` tag because it is not a point event. A city-level point card in the same
collection would additionally carry the `wikitimechain.location` rungs and the geohash
prefixes.

## Approximate dates — one canonical, greppable line

`event_date` is always a full `YYYY-MM-DD`; the spine needs a concrete point. When the
real date is coarser, place the card on a canonical day and record the true precision
in **one canonical line** in the content — fixed prefix, controlled precision clause,
then `— placed at <the event_date value>`. The fixed prefix makes every contributor's
caveat grep with a single pattern later.

Form: `APPROXIMATE DATE: <precision clause> — placed at <YYYY-MM-DD>.`

| Case | Canonical line | Placement | Buckets emitted |
|---|---|---|---|
| Month known, day unknown | `APPROXIMATE DATE: known to the month — placed at 2003-07-01.` | day `01` | `2003`, `2003-07` |
| Year known only | `APPROXIMATE DATE: known to the year — placed at 2003-01-01.` | `01-01` | `2003` only |
| Source names a period | `APPROXIMATE DATE: "Summer 2026" — placed at 2026-07-01.` | first day of the chosen month | `2026`, `2026-07` |

Rules:
- The prefix is exactly `APPROXIMATE DATE:` (uppercase, trailing colon) — the grep anchor.
- The date after `placed at` is *identical* to the `event_date` tag value.
- A named source period is **quoted verbatim** in double quotes (`"Summer 2026"`,
  `"Q3 2011"`); a bare precision uses the controlled clauses
  (`known to the month` / `known to the year`).
- **Buckets encode the *known* precision, never the placeholder day.** Year-only ⇒ emit
  the year bucket only; do not emit a month bucket, because the placeholder month is not
  a fact. This keeps `#l` date queries honest.
- An exactly-known date carries **no** `APPROXIMATE DATE:` line at all.

## Sourcing, and cards about scheduled events

Content-only conventions — **no tag changes.** All of it is the `Label: value`
paragraph shape the cards already use, so the viewer's tiny djot pass renders it
with no new syntax.

### One source line, scoped per claim

A card usually rests on more than one source: a photographed notice for the dates, a
government page for the procedure. The failure mode is a single `Source:` line that
supports half of what the card says — a reader who follows it finds the source does
not say what the card claims it said. That is worse than no citation, because it
looks checked.

One source ⇒ `Source:` unchanged. More than one ⇒ **one `Sources:` line, each source
prefixed by the claim it carries:**

```
Sources: date and time - [posted zoning sign](https://blossom.primal.net/<sha256>.jpg),
photographed from the public right-of-way 2026-05-29. Commission's role and venue -
[Maricopa County P&Z Commission](https://www.maricopa.gov/383/Planning-Zoning-Commission),
which "makes recommendations to the Board of Supervisors on rezoning ... and
comprehensive plans."
```

One block, not one heading per source. Two `Source:` headings read as a bibliography
and crowd a card that has six blocks total.

### If a source has a URL, its name *is* the link

`[label](url)` — never a bare URL beside a plain name (djot does not autolink, so a
bare URL is dead text). This applies to a photograph exactly as it does to a document.

A **blossom URL is the sha256 of the file**, so citing a photo by its blossom link is a
content-addressed citation: anyone can hash what they download and confirm it is the
image you shot. A swapped or re-edited photo lands on a different URL and the link
breaks instead of silently lying. Prefer it to "photographed on site."

### Embed when the card is *about* the image; link when it only *cites* it

| Form | Use when |
|---|---|
| `![alt](url)` | the image is the event — a photographed notice on the card recording that it was posted |
| `[label](url)` in `Sources:` | the card draws a fact from an image that belongs to another card |

The same photo embedded on every card that leans on it is the main way a spine turns
into a wall of pictures. Embed it once, on the card that owns it.

### `When:` / `Where:` — scheduled events

A card announcing a hearing, meeting, deadline or vote carries two lines, placed
**immediately above `Source:`/`Sources:`** — the last of the substance, just before the
provenance:

```
When: 2026-08-06, 9:30 AM MST
Where: Board of Supervisors' Auditorium, 205 W. Jefferson St., Phoenix AZ 85003;
virtual by registration with Planning & Development.
```

- **`Where:`, never `Location:`.** `Location:` already describes the *subject's* place
  (the parcel). `Where:` is the *meeting's* place. On a card about a Tonopah parcel
  heard in downtown Phoenix these are different facts and must not share a label.
- **State the timezone every time.** A permanent record is read from anywhere.
- **Don't narrate the schedule in the prose too.** Once the block exists, the lead
  sentence says what the meeting *is* and who decides; the block says when and where.
  Saying the date twice is the most common way these cards get bloated.

**If the date moves, publish a new card — never edit this one.** A `When:` line records
what a source said the schedule was, as of that source's date; it is not a promise about
the future. The reschedule is itself an event on the spine, and the original card stays
true, because it was always a claim about what was posted. Same `d` rules as anywhere:
disambiguate the new card with a qualifier.

### Cards for things that have not happened yet

`APPROXIMATE DATE:` covers a *past* event whose date is coarse. An **anticipated** event
is the opposite problem — a date and contents that are guesses — and it must say so:

```
Status: anticipated - this card records an expectation, not an event.
A later card will record it as it actually happened.
```

Everything unsourced in such a card is labelled unsourced in place (`No posting date has
been announced by the county; the estimate is not sourced.`), and the `Source:` line
records what was checked and when. An anticipated card is superseded by a real one, not
deleted — nothing here is ever deleted.

## Revisions and diffs — showing what a document used to say

When a collection tracks a document through versions, a card can carry the change itself
rather than describing it. **No new tag.** Two things you already have do the work.

**The declaration is a `fork` marker** — borrowed in shape from NIP-54, but ours to define now
that the cards are their own kind. A card that revises another tags the one it came from: the
addressable coordinate, **and** the concrete event id it was built against.

```json
["a", "30828:<pubkey>:<the-d-it-revises>", "", "fork"],
["e", "<event id of that version>", "", "fork"]
```

The empty third element is the relay-hint slot, and it is **structural — never omit it.** The
marker is the *fourth* element; a three-element tag puts `fork` in the hint position, where it
means nothing. Any tooling that round-trips tags through whitespace joining will silently eat
that empty slot and destroy the marker, so build these tags as arrays, never as text.

Both halves are required and they say different things: the `a` coord survives an edit of the
target, while the `e` id pins the exact text this card was diffed against. A revision whose
parent gets republished still points at the version it actually read.

**The change itself is djot's insert/delete**: `{-removed-}` and `{+added+}`. The braces are
required. Content format stays djot, unchanged from when this rode NIP-54.

Fork marker **and** marks in the content is what earns a card the diff treatment. Either
alone is just a card.

### Granularity is the whole craft

| Mark | Renders as | Use when |
|---|---|---|
| Alone on its own line(s) | a **gutter row** — rule + `−`/`+`, the diff idiom | a whole clause, subsection or paragraph came or went |
| Inside a sentence | inline — struck, or tinted for an addition | a phrase changed and the sentence still reads |

The failure mode is marking at too fine a grain. A rewritten paragraph diffed word by word
is confetti: every third word marked, nothing legible, and the reader learns less than from
one sentence of plain prose. Measure before you mark — if a subsection's old and new text
share well under half their words, it was **rewritten**, not edited. Say so in a sentence and
leave it unmarked. Honest prose beats an unreadable diff.

Conversely, don't put a whole line inside a mark when the text belongs to a continuous
document — that pulls it out into a gutter row and shatters the read into hunks. Mark from
*after* the subsection letter so the document stays a document.

### Authoring rule: removals go in their own block

Readers get a per-card switch, **as passed** / **what changed**, whose state is per-card and
in the URL (`&plain=<d>`). "As passed" strips the marks and drops any paragraph block whose
marks are **all removals**, so whatever prose introduced them goes with them instead of
dangling over nothing. A mixed block — a document marked inline — survives and reconstructs
the clean text.

So: a "here is what was cut" block holds *only* removals. Never mix.

### Verify by reconstruction, not by eye

A marked card asserts two documents. Check both, mechanically:

- strip the `{-…-}`, unwrap the `{+…+}` → must equal the **newer** document, character for character
- strip the `{+…+}`, unwrap the `{-…-}` → must equal the **older** one

A card that fails either is claiming a change that did not happen. Build the marked text
*from* the source documents programmatically — never retype a quoted document by hand.

## Discovery & the membership gate

The viewer subscribes `{"kinds":[30828], "#t":["wikitimechain"], limit:500}` — one
indexed filter, the relay does the narrowing. But **`wikitimechain` is squattable**:
anyone can wear the marker. So the marker is *discovery bait, not proof*. A card is
one of ours only if it passes the gate:

> **`#t`=wikitimechain  AND  a parseable `YYYY-MM-DD` `event_date`  AND  a
> `wikitimechain.collection` label.**

The collection slug is read from that label's value. Cards failing the gate are
dropped, not stored. Membership per collection is then made exact by the label query
(below), which has no discovery-window problem.

### The `#l` value-only caveat — do not optimize the gate away

Relays index labels by **value only** — the namespace (the `L` tag / the label's 3rd
element) is *not* part of the filter. So `{"#l":["2026"]}` matches the value `2026` in
**any** namespace, including a stranger's unrelated label; `{"#l":["us-az-maricopa"]}`
matches that value wherever it appears. Value grammars (ISO codes, kebab locations,
`YYYY`/`YYYY-MM` dates, kebab collection slugs) are kept disjoint so collisions are
unlikely — but **labels are discovery, the gate is truth.** A future contributor must
not "simplify" the client-side gate into a bare `#l` trust; the value-only index is
exactly why it can't be trusted alone.

### Axes don't compose in one query

Collection, date, and location are all `l` values. A single filter's `#l` array is an
OR, and two constraints sharing the key `l` cannot be AND-ed. "Cards in collection X
**and** county Y" is therefore **not one REQ** — fetch by the most selective axis and
client-filter the rest. Each rung is individually filterable; they do not compose
server-side. For a small corpus this is a non-issue (client-filter a fetched
collection); no UI should assume server-side multi-axis AND.

## Viewer read behavior

- **Dedup by `pubkey:d` — deliberately WITHOUT the kind.** This is what let the corpus move
  kinds card by card with no flag day: a republished 30828 collapses against its own 30818
  original and the newer `created_at` wins, so the spine never blanked and no card ever
  appeared twice. Keep it keyed this way; adding the kind to the key would break the property.
- **One kind, read and written.** The dual read that carried the move is retired (2026-07-29):
  30828 only. A 30818 still served by a relay that ignored its deletion request is not a card.
- **Writes use 30828 only.** Reactions and comments address a card by a coordinate that embeds
  the kind, so there is no transition window for the write side — and no reason for one.
- Different pubkeys with the same `d` **coexist** — that is the dispute mechanism.
- Display date is always the full-precision `event_date` tag; the `YYYY`/`YYYY-MM`
  buckets are query shadows and never the display source.

### Marginalia is addressed by kind — a thing to know before changing kinds again

Reactions (kind 7) and comments (kind 1111) point at `<kind>:<pubkey>:<d>`. Moving a card to a
new kind therefore gives it a new address, and **every existing reaction and comment on it
renders nowhere** — silently. No error; the client asks for coordinates that nothing answers,
and the old marginalia sits on the relays unreferenced.

That cost was paid once, knowingly: at the time of the move no outside contributor had ever
reacted or commented, so there was no visitor record to lose. **It will not be free a second
time.** Any future kind change needs a migration path for marginalia, or an explicit decision to
abandon it.

## Publishing, and building a client

Nothing here is owned. There is no registry to join, no key to be added to, no
permission step. Two things follow.

**To publish.** Sign a kind-30828 with the required tags above — marker, `event_date`,
a `wikitimechain.collection` label — from any key, to any relay this viewer reads.
A collection *is* its slug: publish the first card carrying a new slug and the
collection exists; every conforming viewer will show it beside ours. Republishing the
same `d` from the same key edits that card; the same `d` from a different key is a
second, coexisting version — that is the dispute mechanism, not a collision.

**To build a client.** One REQ boots you:
`{"kinds":[30828],"#t":["wikitimechain"],"limit":500}`. Group what passes the gate by
its collection label, sort by `event_date`, render. Exact membership for one collection
is `{"kinds":[30828],"#l":["<slug>"]}` — then re-check the gate, because `#l` is
value-only (below). That is the entire protocol; there is no manifest to fetch and no
index to register with.

Dedup on `pubkey:d`, newest `created_at` winning. Ask for 30828 only — relays that ignored the
kind-5 deletions still serve pre-move **30818** copies, which are retired, not content.

### Don't trust, verify.

The marker is bait, the labels are hints, and neither is proof. Run the gate on every
event you accept, whoever sent it and whatever it claims — that is what makes an open
marker safe to use. A client that skips the check inherits everyone else's junk.

## The walls (where this breaks, and status)

1. **Relays honoring the `#t` marker filter.** Single-letter `t` is indexed by every
   relay that answers at all; the four reachable relays honor tag filters exactly.
   Passes.
2. **Marker is squattable and permanent.** By design — the viewer is an open
   instrument. Guard is the membership gate (shape), not identity. `wikitimechain`,
   one word, is the forever choice; renaming later means re-signing every card.
3. **`#l` range-enumeration hits relay value-caps.** A decade of months = 120 values,
   over some relays' per-filter limits. Mitigated by the **year bucket** (a decade =
   10 values) and, for our corpus size, by client-side filtering. Never ship a naive
   enumerate-every-month REQ.
4. **No author allowlist — on purpose.** Anyone who publishes a card that passes the
   gate is in, no permission asked. That is the offer, not a leak: a stranger can start
   a collection on their own key today and every wikitimechain viewer will find it. The
   cost of that openness is that junk and fakes also pass the gate. The answer is
   ranking, not gatekeeping (rank-by-follows, deferred) — see *Publishing, and building
   a client* above.
5. **Discovery-window drift.** Now a non-issue twice over: the fetch is an indexed `#t` filter
   *and* it runs against a kind nobody else writes, so the corpus is nearly the whole stream
   rather than a needle in NIP-54's. Still bounded by `limit` if wikitimechain traffic ever
   grows large; the union across relays is the mitigation.
6. **Relays that restrict writes will not carry the cards.** Measured, not theoretical: two paid
   relays hold pre-move 30818 copies and none of the 30828s, because publishing to them requires
   payment — so they now contribute nothing to a 30828-only read. This is about the key and the
   relay's policy, **not** the kind number — a relay
   refusing unknown kinds outright was tested for and not found. The mitigation is the same as
   for everything else here: publish to several relays and let the union be the record.

## Frozen decisions

- **Kind: 30828.** Ours, not borrowed. The tag scheme below was inherited whole from the 30818
  era and is unchanged by the move.
- Marker: `["t","wikitimechain"]` — lowercase, one word, no `#`. **Forever.**
- Namespaces: `wikitimechain.collection` / `wikitimechain.date` /
  `wikitimechain.location` — one name everywhere; no `timechain.*` split.
- Collection identity: NIP-32 self-label, replacing the v1 `c` tag.
- Date buckets: year **and** month, both values in `wikitimechain.date`
  (`2026` + `2026-07`); no separate year namespace (value length self-distinguishes).
  Buckets encode *known* precision only — year-only cards emit no month bucket.
- Approximate dates: one canonical `APPROXIMATE DATE: … — placed at <event_date>.`
  line (uppercase prefix = grep anchor); controlled precision clauses or a quoted
  source period; placement day 01 for month-known, 01-01 for year-only.
- Sourcing: `Source:` for one, one `Sources:` line scoped per claim for several; a
  source with a URL *is* a link; embed an image only on the card it is about, link it
  elsewhere.
- Scheduled events: `When:` / `Where:` immediately above the source line, timezone
  always explicit, `Where:` never spelled `Location:`. A schedule change is **a new
  card, not an edit.**
- Anticipated events: a `Status: anticipated` line, unsourced estimates labelled as
  such in place; superseded by a real card, never deleted.
- Location: full ISO→named ladder to the event's true scope; required when a card has
  a location; a placeless timeline is valid (e.g. `bitcoin-arbitrary-data`).
- Geohash: optional `g` prefix rungs, point-events-only, never a jurisdiction centroid.
- Topics: freeform lowercase `t`, deliberately unspecced.
- Membership gate: `#t` + `event_date` + collection label. Labels are discovery, the
  gate is truth; never trust a bare `#l` because the namespace isn't indexed.
- Manifests (kind 30004): **dropped.** The scheme is labels-only.
- Dedup key: `pubkey:d`, **no kind** — newest `created_at` wins.
- `fork`: both an `a` coord and an `e` id, marker in the **fourth** tag element.

---

### Appendix — superseded

**Kind 30818 → 30828** (2026-07-29). Cards were published as NIP-54 wiki articles to inherit
wiki-client rendering; NIPs #2426 answered that this was the wrong shape, so the corpus was
republished under its own kind and the originals deleted. Tag scheme unchanged. Relays that
ignore deletion requests may still serve the 30818 copies — see *To build a client*. Casualties,
both accepted knowingly: rendering in wikifreedia, and every reaction and comment made before
the move (they address a card by a coordinate that embeds the kind).

The `v1`/`v2` names below describe two tag-scheme changes made *while* riding kind 30818. They
are kept as history; there is no `v3` and there will not be one, because a break that large now
gets a new kind instead.

**Why v1 changed.** v1 discovered a card by "has a `c` tag + a parseable `event_date`." Two
problems: `c` is the shared wikifreedia category namespace (our slugs sat beside wild Title-Case
categories — collision by design), and `event_date` is a multi-letter tag so **relays never index
it**, which forced the discovery fetch to pull the entire global 30818 stream and sieve it
client-side. v1 also bet on **kind-30004 manifests** as the durable discovery layer and demoted
per-card labels; v2 reversed that — labels became the whole scheme and the manifest layer was
dropped, because a separate event to keep in sync is not worth its staleness. Both of v1's
problems are now moot for a different reason as well: the corpus has its own kind, so there is no
foreign stream to sieve out of.

- v1 discovery: `c` tag + `event_date` sieve → **replaced** by the `#t` marker + the
  `wikitimechain.collection` label. `c` is no longer read at all.
- v1 marker `t=wiki-timechain` (for manifests) → **replaced** by `t=wikitimechain`.
- v1 kind-30004 manifest layer, marker-freeze, rival-manifest first-seen-wins →
  **dropped** with the manifest layer.
- v1's demotion of NIP-32 per-card labels → **reversed**; labels are now the scheme.

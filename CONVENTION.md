# Collection & discovery convention — v2

**LIVE since 2026-07-23.** The migration in `MIGRATION-v2.md` shipped end to end:
all 31 cards across 3 collections are pure v2, and the viewer runs the `#t`-only
discovery path (legacy-drop, §5).

v2 moves discovery off the shared `c` tag and the un-indexed `event_date` sieve onto
a NIP-32 self-label scheme under one global marker, and adds jurisdiction, date-bucket,
and geohash query shadows. Cards stay **kind 30818** (NIP-54 wiki). The viewer stays a
single zero-dependency `index.html`.

## Why v1 changed

v1 discovered a card by "has a `c` tag + a parseable `event_date`." Two problems:
`c` is the shared wikifreedia category namespace (our slugs sit beside wild
Title-Case categories — collision by design), and `event_date` is a multi-letter tag
so **relays never index it** — the discovery fetch had to pull the entire global
30818 stream and sieve it client-side, which caps out as wiki traffic grows.

v1 also bet on **kind-30004 manifests** as the durable discovery layer and demoted
per-card labels. **v2 reverses that:** per-card NIP-32 labels are now the whole
scheme, and **the manifest layer is dropped.** One indexed marker + labels on the
cards is enough; a separate manifest event to keep in sync is not worth its staleness.

## The tag scheme

Every field is a tag on the 30818 event itself (self-labeling, NIP-32 — the card
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

## Worked example — a statewide card (no county, no geohash)

```json
{
  "kind": 30818,
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

## Discovery & the membership gate

The viewer subscribes `{"kinds":[30818], "#t":["wikitimechain"], limit:500}` — one
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

## Viewer read behavior (during and after migration)

- **Dual-read.** The viewer accepts both v2 cards (collection label) and legacy v1
  cards (`c` tag + `event_date`), merging into one slug set. Legacy support is dropped
  only after every card is confirmed migrated (see `MIGRATION-v2.md` §5).
- **Dedup by `pubkey:d`,** newest `created_at` wins; on a same-second tie, the card
  carrying a collection label (v2) wins. Different pubkeys with the same `d` **coexist**
  — that is the dispute mechanism, unchanged from v1.
- Display date is always the full-precision `event_date` tag; the `YYYY`/`YYYY-MM`
  buckets are query shadows and never the display source.

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
4. **No author allowlist.** Anyone can inject a junk collection or a fake card that
   passes the gate. Unchanged from the v1 sieve; the real answer (rank-by-follows) is
   deferred. Accepted, not solved.
5. **Discovery-window drift.** Softened versus v1: the indexed `#t` fetch no longer
   competes with the global 30818 stream, so our small corpus sits well inside the
   window. Still bounded by `limit` if wikitimechain traffic ever grows large; the
   union across relays is the mitigation.

## Frozen decisions (v2)

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
- Location: full ISO→named ladder to the event's true scope; required when a card has
  a location; a placeless timeline is valid (e.g. `bitcoin-arbitrary-data`).
- Geohash: optional `g` prefix rungs, point-events-only, never a jurisdiction centroid.
- Topics: freeform lowercase `t`, deliberately unspecced.
- Membership gate: `#t` + `event_date` + collection label. Labels are discovery, the
  gate is truth; never trust a bare `#l` because the namespace isn't indexed.
- Manifests (kind 30004): **dropped.** v2 is labels-only.

---

### Appendix — superseded from v1

- v1 discovery: `c` tag + `event_date` sieve → **replaced** by the `#t` marker + the
  `wikitimechain.collection` label. `c` is read only during the dual-read transition.
- v1 marker `t=wiki-timechain` (for manifests) → **replaced** by `t=wikitimechain`.
- v1 kind-30004 manifest layer, marker-freeze, rival-manifest first-seen-wins →
  **dropped** with the manifest layer.
- v1's demotion of NIP-32 per-card labels → **reversed**; labels are now the scheme.

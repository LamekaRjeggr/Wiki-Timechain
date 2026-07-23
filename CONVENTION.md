# Collection discovery convention

Written 2026-07-21. **Status: layer zero is implemented** (same day) — the viewer
now discovers collections by sieve alone and the hardcoded `COLLECTIONS` list is
gone. Manifests (kind 30004) remain unimplemented and the marker string remains
unfrozen. The visual companion is the `timechain-discoverability` canvas in the
memviz store.

## The problem

A nostr relay only answers filters for tag values it is explicitly given — there is
no "list the distinct `c` values" and no "has a `c` tag" query. So today the viewer
can only show collections named in the hardcoded `COLLECTIONS` list in `index.html`.
A new collection published tomorrow is invisible until someone edits the viewer.

Dropping the `#c` filter doesn't work either: kind 30818 + `c` is the shared
wikifreedia wiki namespace. A probe (2026-07-20) found ~5% of wild 30818 events
carry `c` at all; ours are kebab slugs (`tonopah-rezoning`), theirs are Title-Case
category words (`Nostr`, `Biology`).

## What the open world does

Surveyed 2026-07-21: PeriodO, IIIF, ActivityStreams/ActivityPub, Memento (RFC 7089),
TimelineJS, OAI-PMH, sitemaps, and NIPs 32/51/54/72/89. Every mature open system
converges on the same shape for this exact problem: **a small manifest document per
collection** (IIIF Collection, ActivityStreams OrderedCollection, Memento TimeMap,
OAI-PMH ListSets), usually layered over tags on the members themselves. Discovery
reduces to "fetch the manifests," which is a much smaller haystack because manifests
share one type.

Nostr already has the primitive: **NIP-51 curation sets, kind 30004** — addressable
events with a `d` identifier, `title` and `description` tags, and pointers to members.

## The convention

One kind-30004 event per collection. Cards are not touched.

```json
{
  "kind": 30004,
  "tags": [
    ["d", "tonopah-rezoning"],
    ["title", "Tonopah Rezoning"],
    ["description", "Public record of the rezoning cases around Tonopah, AZ."],
    ["t", "wiki-timechain"],
    ["type", "land"]
  ],
  "content": ""
}
```

Field by field:

- `d` — the collection slug, **identical to the `c` value on its cards**. This
  equality is the joint that holds the two layers together.
- `title`, `description` — collection metadata, native to NIP-51. (`image` also
  allowed, unused for now.)
- `t` = `wiki-timechain` — the discovery marker. Single-letter, so relays index it;
  this is the "well-known location" in nostr form (an agreed kind + marker pair
  instead of an agreed URL). **Forever choice — see wall 4.**
- `type` — the collection's kind of subject: `land`, `law`, `proposition`,
  `history`. Custom multi-letter tag, so relays do *not* index it; the viewer reads
  it from manifests it already fetched, which is enough because the manifest count
  stays small. The set is open: a viewer must render an unknown type as a new group,
  never an error.
- **No `a` tags pointing at cards.** Membership stays where it already lives: the
  `c` tag on the cards. See wall 3 for why.

The `c` tag on cards remains the member-signed ground truth. The manifest is
discovery + metadata only.

## Layer zero: event_date is the signature

Added later the same day. The cards already carry an unfakeable membership signal:
**`event_date`**. A card without one cannot be placed on a proportional timeline at
all — the viewer has to validate it regardless — and the wild wiki articles sharing
kind 30818 have no reason to carry it. So validation doubles as discovery, with
zero publish-side change and no new convention to remember:

1. One open pull per relay: `{"kinds":[30818], "limit":500}` — no `#c` filter.
2. Client-side sieve: keep events with a `c` tag AND a parseable `YYYY-MM-DD`
   `event_date`. Group by `c` value. Each group is a discovered collection.
3. No card-count threshold. One valid card is enough — a new collection's first
   card is exactly what discovery exists to surface.

Relay filters cannot express any of this (no presence tests, no conditionals, and
`event_date` is multi-letter so relays never index it) — the pull must be open and
the sieve must run in the client. Discovery is therefore approximate: bounded by
the `limit` window. Membership is then made exact by the per-slug `#c` query.

Metadata without a manifest: title derived from the slug (kebab → words), type =
untyped. A manifest, when one exists for the slug, overrides title, description,
and type. The sieve stays on permanently as the net under the manifests —
collections nobody wrote a manifest for still appear.

## Viewer boot sequence

*(Amended 2026-07-21: the original step 1, a hardcoded "featured" list, was
removed by user decision — discovery carries the whole page. Steps 1 and 3 are
live; step 2 is future.)*

1. **Layer zero** — open 30818 pull per relay (`limit:500`, kept open for live
   discovery), sieve by `event_date` + `c`, union the discovered slugs across
   relays. **Implemented.**
2. **Manifests** — one open REQ `{"kinds":[30004], "#t":["wiki-timechain"]}` — no
   authors filter, per the no-pubkeys rule in CLAUDE.md. Each result declares a
   collection: slug from `d`, display name from `title`, grouping from `type`.
   Declared metadata overrides anything layer zero inferred; a manifest also
   surfaces a collection whose cards are too old for the discovery window. Rival
   manifests for the same `d` from different authors: first-seen wins, for now.
   **Not implemented — wait for the marker freeze.**
3. **Membership** — for every known slug, the exact card query:
   `{"kinds":[30818], "#c":["<slug>"]}`, re-sent whenever the slug set grows.
   Complete, no window problem. **Implemented.**

Until manifests exist, tab names are the raw slug (kebab → words) — accepted,
including the long tonopah slug; the ugliness is standing pressure to publish
the manifests.

## The walls

Where this can break, and the empirical status of each.

**1. Relays might not honor the marker filter.** Probed 2026-07-21, read-only,
against live kind-30004 events: relay.damus.io, nos.lol, relay.primal.net, and
relay.mostr.pub all return exactly the matching events for a `#t` filter and
correctly return zero for a nonsense value. relay.nostr.band was unreachable
(handshake timeout — connectivity, not filtering). nostr.wine refuses
unauthenticated reads (403). **Verdict: passes on every relay that answered, 4 of 6.
The two holdouts are access problems and also can't serve the viewer's existing
queries when in that state, so they don't change the design.**

**2. A manifest is one replaceable event.** If it's absent from every relay the
viewer reaches, the whole collection vanishes from discovery. Mitigations: publish
manifests to all six relays; the featured list keeps known collections visible
regardless; and because `d` = `c`, a lost manifest is always rebuildable from the
cards. Untested until implementation.

**3. Two membership sources can disagree.** If manifests carried `a` tags to cards
*and* cards carried `c`, the lists drift the moment a card is published without a
manifest edit. That staleness is permanent maintenance. Resolution: only `c` counts.
The cost: other NIP-51 clients will show the set as empty, and the free reverse
lookup ("which collections hold this card" via an `#a` filter) is forfeited. Neither
has a use today. Revisit only if one appears.

**4. The marker string is squattable and permanent.** Anyone can publish a 30004
wearing `t=wiki-timechain` — by design; the viewer is an open instrument and the
Contribute section invites exactly this. The guard is shape validation, not
identity: drop manifests whose `d` isn't a kebab slug, and drop collections whose
card query returns nothing parseable. Renaming the marker later costs one edit per
manifest (small), but every deployed viewer must agree on the string — so it gets
decided once, here, before the first manifest is published.

**5. Rival manifests for the same slug.** NIP-51 sets are per-author: a stranger can
publish their own `d=tonopah-rezoning` manifest with a different title. That is
PeriodO's model — a collection is a claim by a source — and long-term the fix is
ranking claims by follows. Today: first-seen wins, and the featured list pins ours.
Accepted, not solved.

**6. Publish-side dependency.** Nothing changes until the manifests exist, and they
are published from the Forge side (bunker-signed), not from this repo — the viewer
never writes cards or manifests per CLAUDE.md (its only writes are the visitor's
own reactions and comments). Backfill is exactly two events:
`d=bitcoin-arbitrary-data` (`type=history`) and `d=tonopah-rezoning` (`type=land`).
No card is republished. **Softened by layer zero:** discovery now works before any
manifest exists — the manifests upgrade titles and types rather than gate the
feature.

**7. The discovery window drifts.** Layer zero's open pull is capped by `limit`,
and relays return newest-first. Today our cards are a large share of a small
corpus; as the shared 30818 namespace grows, a collection whose newest card is
older than the window silently falls out of heuristic discovery. Mitigations: the
union across six relays' separate windows, the featured list, and manifests — a
manifest-declared collection needs no window at all. This wall is why manifests
stay worth publishing even with layer zero running.

## Decisions frozen by this document

- Layer zero discovery: presence of `event_date` + `c` on a 30818 card is the
  membership signature. No card-count threshold. Discovery approximate (window),
  membership exact (per-slug `#c` query). Manifest metadata overrides inferred
  metadata; the sieve is permanent, not a stopgap. **Implemented 2026-07-21.**
- No hardcoded collection list at all — the earlier "featured stays pinned"
  layer was dropped when layer zero shipped; a sieve probe confirmed the wild
  namespace contributes zero false timelines today.
- Marker: `["t","wiki-timechain"]` — **proposed, not yet frozen; freeze before the
  first manifest is published.**
- Type values: open set; `land`, `law`, `proposition`, `history` known today.
- Membership: `c` on cards only; manifests carry no member pointers.
- Rival manifests: first-seen wins.
- The earlier idea of a NIP-32 label on every card is demoted to optional later
  hardening — it is only needed for a one-query "all land cards across every
  collection," which nothing asks for yet.

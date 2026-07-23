# Migration plan — convention v2 (labels, marker, jurisdiction)

**Status: COMPLETE (2026-07-23).** §1 dual-read viewer shipped (commit `e553d3a`); §2 card
migration done for all 3 collections (tonopah 4, bitcoin 10, hcr2001 17 — 31/31 pure v2,
migrated via the now-v2-native Forge 30818 form, verified with `tools/migrate-v2.mjs`);
§3 CONVENTION.md swapped to v2; §5 legacy-drop shipped — the viewer is `#t`-only (broad
sub and `#c` membership filter deleted; `collectionSlug()`'s `c` fallback kept as the
grace window). Known cosmetic residue: relay.damus.io still serves stale v1 copies of 3
hcr2001 cards (rate-limited rebroadcasts); harmless — dedup renders v2 everywhere.

Target: move discovery off the shared `c` / un-indexed `event_date` sieve onto a
NIP-32 self-label scheme under one global `#t` marker, add jurisdiction + date-bucket
+ geohash query shadows, and dual-read through the transition. Cards stay kind
30818 (NIP-54). The viewer stays a single zero-dependency `index.html`.

## Decisions settled (Q&A, this session)

| Decision | v2 |
|---|---|
| Marker | `["t","wikitimechain"]` (one word, lowercase) |
| Namespaces | `wikitimechain.collection` / `wikitimechain.date` / `wikitimechain.location` — one name everywhere, no `timechain.*` split |
| Collection | NIP-32 self-label, replaces the `c` tag |
| Date buckets | year **and** month, both values in `wikitimechain.date` (`2026` + `2026-07`); no separate year namespace |
| Location | full ISO→named ladder down to the event's true scope; required when a card has a location |
| Geohash | optional `g` prefixes, **point-events-only** — never a jurisdiction centroid |
| Topics | freeform lowercase `t`, deliberately unspecced |
| Manifests (kind 30004) | **dropped** — v2 is labels-only; the manifest half of v1 CONVENTION is deleted |
| Membership gate | `#t`=wikitimechain **+** parseable `event_date` **+** collection label; labels are discovery, the gate is truth |

The full v2 convention text is drafted in **`CONVENTION.v2.draft.md`** (kept separate;
it replaces the live `CONVENTION.md` only when the migration ships — §5).

---

## 1. Viewer changes (`index.html`) — SHIPPED

**DONE (commit `e553d3a`).** All six touch points landed as specified: `MARKER` constant;
`labelVal(ev,ns)` + `collectionSlug(ev)` helpers (label-first, `c`-fallback); `sieve()`
accepts on `collectionSlug` + parseable `event_date`; `inCollection()` groups by
`collectionSlug`; two discovery subs (`"sieve"` broad + `"tsieve"` narrow `#t`) both →
`sieve()`; membership REQ ORs `#c` and `#l`; `ingest()` same-`created_at` prefer-v2
tiebreak. Verified headless (Safari): 3 legacy collections still discover (bitcoin 10,
hcr2001 17, tonopah 4, zero JS errors); synthetic v2-only card discovers + groups;
migrated card (c + label) folds into its collection, no dup; tiebreak holds both orders;
`node --check` clean. Diff +49/−12, discovery-local. The spec below is what was built.

Discovery today (`sieve()`, ~line 475): open `REQ {kinds:[30818], limit:500}` per
relay, keep events with a `c` tag + `YYYY-MM-DD` `event_date`, `c` value → slug set,
then exact `#c` membership refetch. Two subs: `"sieve"` (broad) + `"wtc"` (`#c`).

**v2 changes:**

1. **Add an indexed discovery sub — keep the broad one during transition.** The v2
   endpoint filter is `{"kinds":[30818], "#t":["wikitimechain"], limit:500}` (`t` is a
   single-letter indexed tag, so the relay narrows for us — no more global-30818
   firehose, window drift largely dissolves). **But it is NOT a replacement in phase
   1.** At phase-1 ship time every live card is still legacy — none carries `#t` yet —
   so a `#t`-only viewer would show *nothing* until migration runs, breaking the
   "nothing breaks" guarantee. So phase 1 runs **two discovery subs side by side:**
   - `"sieve"` — the existing broad `{kinds:[30818], limit:500}`, client-sieved for
     legacy `c` cards (unchanged).
   - `"tsieve"` — the new narrow `{kinds:[30818], "#t":["wikitimechain"], limit:500}`
     for v2 cards.
   Both route to the same `sieve()` acceptance logic. The broad sub is removed only at
   legacy-drop (§5), when every card is migrated and `#t` alone suffices.

2. **Membership gate (the `t` value is globally squattable).** `wikitimechain` is a
   made-up word so hashtag noise is low, but anyone can still wear it. An event counts
   only if it has **`#t`=wikitimechain AND a parseable `event_date` AND a
   `wikitimechain.collection` label**. Read the slug from the `l` value whose 3rd
   element is `wikitimechain.collection` (not from `c`). Anything failing the gate is
   dropped, not stored — same as today's wild-wiki drop.

3. **Dual-read during transition.** Accept BOTH shapes:
   - **v2 card:** `["l","<slug>","wikitimechain.collection"]` → slug from the label.
   - **legacy v1 card:** `["c","<slug>"]` + `event_date`, no collection label → slug
     from `c` (today's path).
   Merge into one `slugs` set regardless of source; store both in `events`.

4. **Dedup / prefer-v2.** Dedup key stays `pubkey:d`. Kind 30818 is addressable, so a
   well-behaved relay keeps only the newest `created_at` per `(kind,pubkey,d)` — a
   migrated card *replaces* its v1 self and there's usually one version to see.
   "Prefer v2" only bites during **propagation gaps** (relay A has v2, relay B still
   v1). Rule: newest `created_at` wins (already the logic); tiebreak — **same
   `created_at` → prefer the event carrying a collection label** (v2). Cheap insurance.

5. **Membership sub queries both keys.** The exact per-slug refetch (`"wtc"`) must
   catch legacy-by-`c` AND v2-by-label. A REQ carries multiple filters as an OR, so
   send two against the same slug set:
   `["REQ","wtc", {kinds:[30818],"#c":[...slugs]}, {kinds:[30818],"#l":[...slugs]}]`.
   (`#l` is value-only, so a slug that coincidentally equals a date/location value
   could over-match — the client gate in `sieve()` drops anything without a `c` or a
   collection label, so it's harmless.) The `#c` filter is dropped at legacy-drop (§5).

6. **Collection dropdown from labels.** Union of `wikitimechain.collection` label
   values (v2) + legacy `c` values (v1), sorted, with counts — existing `<select>`
   code unchanged except where the slug comes from (via `collectionSlug(ev)`). **Keep
   the `?c=slug` deep-link param name** for link stability even though the tag is no
   longer `c`.

7. **Everything else untouched.** Vertical spine renderer, reactions/comments ladder,
   njump/profiles, colorblind palette, zero-dep constraint — none touch discovery
   tags. `dateOf()` still reads the full-precision `event_date` tag for display; the
   `2026` / `2026-07` buckets are query shadows, never the display source.

**Net viewer change is small and localized:** one filter swap + a
`collectionSlug(ev)` helper (label-first, `c`-fallback) feeding the existing
`slugs`/`sieve`/dropdown machinery. Well-scoped, spec-following — **Sonnet 4.6** work.

---

## 2. Migrating existing cards

Live corpus: `bitcoin-arbitrary-data` (10), the tonopah slug (4),
`hcr2001-fast-election-results` (17) ≈ **31 events**. Small — tractable by hand or a
one-shot generator.

**TOOLING (durable — the "how"):** `tools/migrate-v2.mjs` (node 22+, zero deps) reads
LIVE from relays so it never goes stale — `fetch <slug>` lists a collection, `gen <slug>`
writes `out/<d>.v2.json` per card (drops `c`, bumps `created_at`, adds marker + label +
date buckets + the per-collection location ladder from its embedded `LOCATION` table),
`verify <slug>` confirms published cards are clean v2. Publishing stays manual (below).
**Trap:** the `cards/<slug>/` JSON files in the repo are the pre-migration v1 snapshots —
STALE once a collection is migrated. Trust the relays (via the tool), not those files.

**The hard constraint: only the original author can migrate a card.** Addressable
replace works only from the same pubkey `(kind,pubkey,d)`. These cards are
bunker-signed (Groundwork via Forge). So there is **no unattended migration script** —
a generator produces the new event JSON; **signing + publishing is manual via Forge
RAW·JSON** (bunker), exactly like original publish.

**Generator (produces JSON, does not publish):**
- Keep `d`, `title`, `content`, `event_date` verbatim.
- Keep `published_at` (NIP-54 "originally published" truth — do NOT bump it).
- **Bump `created_at`** to now — this is what makes the replace win.
- Add the v2 block: `["t","wikitimechain"]`, collection label, date buckets, the
  location ladder **down to the card's true scope** (see per-collection rules below),
  and geohash prefixes for genuine point events only.
- **Date buckets by *known* precision, not the placeholder day.** If the card's
  content carries an `APPROXIMATE DATE: known to the year` line, emit only the `YYYY`
  bucket — no month bucket (the placeholder month isn't a fact). Month-known cards emit
  both. Preserve any existing `APPROXIMATE DATE:` line, normalizing it to the canonical
  form (`CONVENTION.v2.draft.md` → "Approximate dates").
- **Drop `c`.** A migrated card carries NO legacy tag — it is fully on v2. The plan
  originally kept `c` "so un-updated viewers still see the card," but that protects a
  stale client that does not exist: the only viewer is the Pages site, already dual-read
  and deployed (phase 1), and it discovers a pure-v2 card via the `#t` marker and groups
  it by the collection label (proven in the phase-1 tests). Keeping `c` is exactly the
  old-mixed-with-new to avoid. **No tab split mid-migration:** the viewer groups every
  card through `collectionSlug()` (label-first, `c`-fallback); a migrated card (label =
  the slug, no `c`) and an un-migrated sibling (`c` = the slug, no label) resolve to the
  SAME slug string, so they share one tab. Discovery covers both — un-migrated on the
  broad sub, migrated on the `#t` sub. This **collapses the old §5a** (a separate later
  "remove `c` from the cards" republish) into the migration itself: one republish, not two.

**Per-collection location/geohash (from the Q&A):**
- **bitcoin-arbitrary-data** — placeless. No location ladder, no geohash. A placeless
  timeline is a valid timeline.
- **tonopah** — point-located. Full ladder (US → US-AZ → us-az-…) **and** geohash
  prefixes now.
- **hcr2001** — **per card.** Statewide acts stop at `US-AZ` (ISO-3166-2), no county
  rung, no geohash. A card that is genuinely a point event gets the deeper rungs +
  geohash. Judge each of the 17 on migration.

**What can go wrong:**
- **`created_at` ordering.** New `created_at` ≤ stored → the replace is *silently
  rejected* and you've published a no-op. Every migrated event needs a strictly
  greater `created_at`. Do the batch in one sitting; don't reuse a stale draft stamp.
- **Partial relay propagation.** Replace may land on 4/6 and miss the auth-gated
  holdouts (nostr.wine 403, nostr.band flaky) — the known Forge reality. Dual-read +
  the prefer-v2 tiebreak (§1.4) keep the card from flickering; re-publish to laggards.
- **Silent replace failure looks like success.** An OK frame can mean "accepted (and
  ignored as older)." Verify each migrated card live via njump/`.htest` — don't trust
  the publish tally alone.
- **`d`-collision safety.** Same `d` + same pubkey = replace (intended). Different
  pubkey, same `d` = a dispute copy that coexists (intended). No migration collision.

---

## 3. CONVENTION.md rewrite (v2)

Drafted in full as **`CONVENTION.v2.draft.md`**. It:
- gives the required / required-when-applicable / optional tag tables + a worked card;
- states the **lowercase rule** for `t` values (marker + topics);
- states topic categorization is **deliberately unspecced** (freeform `t`, no registry);
- states the **"full ladder down to true scope"** rule for locations (and *why*:
  relays filter on the `l` value, not the (`L`,`l`) pair, so each rung must be present
  to be filterable);
- states the **`#l` value-only index** caveat → labels are discovery, the membership
  gate is truth, never optimize the client-side check away;
- carries the walls forward, updated for `#t`; deletes the manifest half of v1;
- keeps v1's frozen-decision list as a struck "superseded by v2" appendix.

---

## 4. New query capabilities (optional UI, build when a corpus needs it)

Enabled by v2, need not ship with it:
- **Date-range** via `wikitimechain.date`: `{"#l":["2026-07",...]}` for months, or
  `{"#l":["2024","2025","2026"]}` for a coarse multi-year sweep — the two granularities
  in one namespace, client picks by what it puts in the filter.
- **Jurisdiction** via the ladder: `{"#l":["us-az-maricopa"]}` = every card at/under
  that county across all collections. Single rung = single value = clean.
- **Geohash proximity** via `g` prefixes: `{"#g":["9w0"]}` for a coarse cell.

**Reality for THIS app:** collections are tens of cards — the honest path is *fetch
the collection, filter client-side*; you rarely need a server-side date/geo REQ. These
shadows are forward-compat for a large-corpus future, front-loaded now because
re-signing every card later is expensive. Build cross-collection query UI when a
corpus actually needs it, not day one.

---

## 5. Sequencing

1. **Ship dual-read viewer first (no card touched).** Runs **two discovery subs** —
   broad `"sieve"` (legacy `c`) + narrow `"tsieve"` (`#t`) — and a membership REQ with
   both `#c` and `#l` filters; accepts either card shape. Nothing breaks (every current
   card is still legacy and still discovered by the broad sub), fully reversible. The
   safe first move.
2. **Migrate cards** (§2), collection by collection, via Forge/bunker. Verify each
   live. Each migrated card **drops `c`** and is pure v2; un-migrated siblings keep their
   `c` until their turn. Both stay in one tab throughout (same slug via `collectionSlug()`),
   so migration is invisible to the eye — the dual-read viewer shows every card the whole time.
3. **Swap CONVENTION.md** → the v2 draft (can land with step 1 or 2).
4. **(Optional) query UI** — independent, whenever a corpus needs it.
5. **Collapse the viewer to the `#t`-only path — LAST,** only when every known
   collection's every card is confirmed republished as v2 AND propagated. `c` is already
   gone from the cards themselves (dropped at migration, §2 — the old two-part drop is
   now one). This step is viewer-only: delete the broad `"sieve"` sub (leaving `"tsieve"`),
   drop the `#c` membership filter (leaving `#l`), and remove the `c`-fallback in
   `collectionSlug()`/`sieve()`. Viewers always fetch fresh, so no stale-client problem —
   but keep the fallback for a grace window regardless; it costs nothing. Nothing here is urgent.

**Invariant:** no step may make an already-published card undiscoverable. Dual-read
guarantees this until §5, which is gated on full coverage.

---

## 6. Open risks (settled where decided; these remain live)

1. **Relay value-caps on `#l` range enumeration.** A decade of months = 120 values,
   over some relays' per-filter limits. **Handled by the year bucket** — a decade is
   10 year-values, not 120 months. For our corpus size the real answer is still
   client-side filtering of a fetched collection; do not ship a naive
   enumerate-every-month REQ.
2. **You cannot AND two label axes in one relay query.** Collection, date, and
   location are ALL `l` values; a single filter's `#l` array is an OR, and you can't
   AND two constraints sharing the key `l`. "Collection X AND county Y" is **not one
   REQ** — fetch by the most selective axis, client-filter the rest. Each rung is
   individually filterable but they don't compose server-side. Fine for a small
   corpus; stated in CONVENTION so no UI assumes server-side multi-axis AND.
3. **`(L,l)` namespace is not in the index.** `{"#l":["2026"]}` matches value `2026`
   in ANY namespace — a stranger's unrelated `2026` label leaks in. Value grammars
   (ISO codes, kebab locations, YYYY/YYYY-MM dates) are the only guard; keep them
   disjoint and lean on the membership gate. This is why the gate can't be optimized away.
4. **No author allowlist → the dropdown is squattable.** Anyone can inject a junk
   collection or a fake card with `#t`+`event_date`+a label. **Unchanged from the
   current `c`-sieve** — v2 neither fixes nor worsens it. The real answer (rank-by-
   follows) stays deferred now that manifests are dropped; flag, don't solve here.
5. **Migration is author-gated and manual.** ~31 bunker-signed republishes, not a
   script run. If any collection's signing key is unavailable, that collection can't
   be migrated (only re-authored under a new key = identity fork). Confirm all three
   collections' keys are in hand before starting.

---

## Implementation note (when approved)

Viewer diff (§1) and migration-JSON generator (§2) are localized, spec-following work
— **Sonnet 4.6**, viewer first (§5.1) so nothing is ever at risk. This doc + the
convention draft are the spec the implementer follows.

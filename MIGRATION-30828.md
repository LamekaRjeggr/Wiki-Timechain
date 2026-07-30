# Migration — kind 30818 → 30828

**Status 2026-07-29: PASS 1 COMPLETE — all 29 in-scope cards are live on 30828.**

Verified live against 6 relays, not bookkept:

| collection | pass 1 | pass 2 (delete the 30818s) |
|---|---|---|
| `tonopah-310ac-411th-camelback-z260019-cpa260008` (4) | **DONE** | **DONE** — 0 survivors |
| `hcr2001-fast-election-results` (19) | **DONE** | not started — 19 old events live |
| `tonopah-incorporation` (6) | **DONE** | 1 of 6 (`rita-files-…` deleted) |

**Read side is off 30818 too:** `READ_KINDS` gone, one `KIND = 30828`. `bitcoin-arbitrary-data`
(9 cards, never migrated) no longer renders — those 30818s are to be deleted. Pass 2 = 33 deletes.

Every migrated card verifies clean: marker present, collection label + both date buckets + the
full `ISO-3166-1`/`-2`/`.location` ladder carried over, content length unchanged.

**The fork chain rewrote correctly** — verified against the live events, not assumed:
`hcr2001-text-house-engrossed` carries `a = 30828:<pk>:hcr2001-text-introduced [fork]` with its
`e` tag repinned to introduced's *new* event id, and `final` chains the same way to
`house-engrossed`. That was the one step the tool could have silently botched.

### Relay reality (measured, and it changes pass 2)

| relay | holds all 29 on 30828? |
|---|---|
| nos.lol, relay.primal.net, relay.mostr.pub | **yes, 29/29** |
| relay.damus.io | intermittent — 26/29 one run, 0/29 the next under our own query load; reads are flaky, not empty |
| nostr.wine, nostr21.com | **0/29** — both are *paid* relays with restricted writes (NIP-11 `payment_required: true`). They never accepted the publishes. |

The paid pair is **not** rejecting 30828 for being an unknown kind — that hypothesis was tested
and disproved. It's payment. Which means two things for pass 2: the kind-5 deletes will also be
refused there, so **those two relays will keep serving 30818 forever**, and they hold *only* the
old copy — the 30828 twin was never accepted. Harmless in the merged viewer, since dedup collapses
the survivor against its newer twin from the other relays. But it is the reason `READ_KINDS` must
keep 30818 as long as the viewer wants those relays as sources at all.

**Status 2026-07-29: tooling BUILT and confirmed working.**
`CONVENTION.md` still describes the live corpus truthfully and is **not edited until the
republish lands** — same pattern as `MIGRATION-v2.md`, deleted once it was all past tense.

## START HERE (read before touching anything)

**The migration is done by hand in Forge, card by card, not by a script.** The tool exists and
the user confirmed it works. Do not build a batch migrator; do not read `cards/`.

- **Tool:** `818→828 · MIGRATE` primitive in `~/forge/index.html`. Two modes: PASS 1 publishes
  the 30828, PASS 2 sends the kind-5 delete. Backup: `index.html.bak-pre30828migrate-20260729`.
  Forge is served by plain `python3 -m http.server` on `:8788` over `~/forge` — **editing
  index.html IS deploying**, hard-refresh only. No git there; version by `.bak-<label>`.
- **The viewer is DEPLOYED** — `61ca5d9`, 2026-07-29. The old "do not push until cards are live"
  rule is retired and was backwards in the end: with `READ_KINDS = [30828, 30818]` the shipped
  viewer is the only one that can see a migrated card at all, and the *un*shipped one silently
  drops every card whose 30818 has been deleted. Deploy first, migrate second.
- **Git tracking was broken and is now fixed.** `branch.main.remote` had been set to the literal
  string `branch.main.merge`, so a bare `git push` died with "no upstream branch". Repaired to
  `origin` / `refs/heads/main`. If `git push` ever fails that way again, that is the cause.
- **Fork order is forced:** `hcr2001-text-introduced` → `hcr2001-text-house-engrossed` →
  `hcr2001-text-final`. The `e` fork tag pins the target's concrete event id, so a child can
  only repin after its parent is migrated. The other 25 cards have no forks, any order.
- **`bitcoin-arbitrary-data` is not part of this migration.** It still shows in the Forge
  dropdown because it's on the same key — scroll past it.
- **The 30818s ARE to be deleted** (user's call, reversing the earlier assumption) — but pass 2
  only, after pass 1 is verified live.

### Shell traps that produced false verifications in this session

- `grep` is shimmed to `ugrep --ignore-files -I`: it silently skips gitignored paths and files
  it deems binary, and returned **0 hits for "html" inside Forge's index.html**. Use
  `/usr/bin/grep` for anything load-bearing.
- `diff` calls long-line files binary and prints only `Binary files differ`, so `^<`/`^>` counts
  come back 0. Use `diff -a`.
- **The Bash tool resets cwd between calls.** A bare `rm -rf cards && cp -r …` ran in `$HOME`,
  created a stray `~/cards`, and "reverted" nothing in the repo. Absolute paths in any
  destructive command.

## Why

NIPs issue [#2426](https://github.com/nostr-protocol/nips/issues/2426) asked whether timeline
collections riding on kind 30818 was the right shape. fiatjaf, 2026-07-29:

> No. Use a new kind number for the thing you want to do.

That is the whole reply. Questions 2 (`#l` namespace filtering) and 3 (NIP-54 `fork` semantics)
went unanswered.

## The number: 30828

Chosen for legible lineage — ten above `30818`, nothing claimed in between — because the tag
structure is being kept verbatim and that inheritance should be readable.

Verified unclaimed, 2026-07-29:

- **Full NIPs repo grep** (every file, not just the README kind table): zero hits for `30828`.
  Nothing claimed between `30819` and `31234`.
- **Relay probe**, `{"kinds":[30828],"limit":20}` against a `{"kinds":[30818]}` control on the
  same socket. Seven relays returned 20 control events each and **zero** on 30828:
  nos.lol, relay.primal.net, nostr.wine, relay.mostr.pub, relay.damus.io, nostr21.com,
  relay.nostrplebs.com. `relay.snort.social` answered EOSE but carries no 30818 either — a
  thin witness.
- **Gap:** `relay.nostr.band` never answered — websocket refused twice, all HTTP endpoints
  `000`, while DNS resolved and other hosts were reachable. The one deep-history indexer is
  unchecked. Absence on public relays also isn't proof of non-use; a private deployment
  wouldn't surface.

## What does NOT change

The 818 structure is kept whole. `d`, `title`, `published_at`, `event_date`, the
`["t","wikitimechain"]` marker, and every `L`/`l` namespace (`.collection`, `.date`,
`.location`, the ISO rungs) carry over **unchanged**. Content stays djot. The membership gate,
the approximate-date line, the sourcing rules, `When:`/`Where:`, the diff marks — all
untouched. The only forced change is the kind integer.

Two things stop being borrowed and become ours to define:

- **`fork`** — off NIP-54 we no longer inherit its semantics, so the revision marker is
  specified here rather than deferred to NIP-54. This retires open question 3.
- **The `t` marker** — no longer needed as identity, since the kind now carries that. Keep it
  as a cross-kind index (one REQ can sweep 30818 and 30828 together during transition).

## The problem this surfaced: reactions and comments are addressed by kind

Not previously accounted for. Every write the viewer has ever made points at a coordinate that
embeds the kind:

- kind-7 reactions tag the card as `["a","30818:<pubkey>:<d>"]`
- kind-1111 comments scope to the uppercase `A` coord `30818:<pubkey>:<d>`

Republishing a card as 30828 gives it a **new address**, so every existing reaction and comment
points at the old one and renders nowhere. This is not hypothetical — comment
`9a947375a82e…` on the Taproot card is confirmed live on ≥4/6 relays, plus the reaction and
stance history.

**And it fails silently.** `index.html:1184` derives every coord from the const:
`const coord = KIND + ":" + ev.pubkey + ":" + tag(ev,"d")`. Change `KIND` to 30828 and the
viewer computes new coords, subscribes for them, gets nothing back, and renders zero comments
with no error — the old marginalia is still on the relays, just never asked for. Nothing in the
test suite would catch it, because the tests publish their own fixtures.

**RESOLVED — accept the orphaning.** No outside contributor has ever reacted or commented; every
kind-7 and kind-1111 on the corpus is our own groundwork or a minted test key, so there is no
visitor record to preserve. No alias filter, no second coord lookup, no permanent explanatory
note. New stances and comments attach to `30828:<pubkey>:<d>` and are correct from the first tap.

This is why the const split has `KIND` (write) at 30828 while `READ_KINDS` still carries 30818:
the *cards* need a transition window so the spine never blanks, but the *coords* do not.

## Source of truth: the relays, NOT `cards/`

Audited 2026-07-29 against 6 relays, newest `created_at` per `pubkey:d`:

| | |
|---|---|
| distinct live cards | **38** |
| local `cards/*.json` files | 28 |
| local matches live exactly | **10** |
| tags differ | 5 |
| content **and** tags differ | 11 |
| live with **no local file** | **12** |
| local never published | 2 |

`cards/` is gitignored partial staging, never a mirror. Building the 30828 events from it would
have **regressed 16 cards and dropped 12**, including all ten `bitcoin-arbitrary-data` cards and
all three `hcr2001-text-*` document cards — the diff cards carrying `fork` markers. Drift runs
both directions (`2026-senate-judiciary-elections`: live 953 chars, local 174;
`2026-house-concurrence`: live 216, local 449), so local is not simply "older" — it is unrelated.

**Therefore: `fetch` live, `gen` from what came back, never read `cards/`.** This is what
`tools/migrate-v2.mjs` was already built for — its header says *"Always reads LIVE from relays,
never a snapshot, so it can't go stale."* `cards/` is left on kind 30818 on purpose: a
re-stamped stale draft is worse than an obviously-old one, because it looks ready to publish.

Also: `CLAUDE.md` claims 31 live cards across 3 collections. It is **38 across 4** — the
`tonopah-incorporation` collection landed after that note was written. Fix it in step 6.

## Sequence

1. ~~Decide the orphaning question.~~ **DONE** — accept it (above).
2. **Viewer const split** — DONE, uncommitted. `index.html:553` `KIND = 30828` (write/coord
   side: the `a`/`A` coords, the `k`/`K` tags) and `:557` `READ_KINDS = [30828, 30818]` (the two
   accept gates + three REQ filters). All 1256 lines of the inline script re-parse clean.
   **Not deployed** — do not `git push` until cards are live on 30828, or the spine renders
   from the 30818 half only and the write side points at addresses that don't exist yet.
3. **`tools/migrate-v2.mjs`** — DONE, uncommitted. Same split. Its `gen` path is now mostly
   redundant (Forge builds the events off the live card), so its remaining job is `verify`.
4. **Forge primitive** — DONE, live, user-confirmed working. Supersedes the planned
   `fetch`+`gen`+RAW·JSON flow. Tags are copied **verbatim** off the live event, never rebuilt
   through the 30818 form: that form's extra-tags round-trip is `t.join(' ')` →
   `split(/\s+/)`, which collapses the empty relay-hint slot and turns `["a",coord,"","fork"]`
   into `["a",coord,"fork"]` — fork marker destroyed. Location ladders survive it, forks don't.
   Verified in node against the real events, not assumed.
5. **PASS 1 — republish, 25 cards** (4 already done, see the status table). One card at a
   time, reviewing the tag comparison before signing. Pace relay sends **≥45s** — damus's rate
   limiter left stale copies of 3 hcr2001 cards last migration. `created_at` lands fresh, which
   is strictly newer than the original, so dedup prefers the new card. Forks in the order above.
6. **Verify**, then **PASS 2 — delete the 30818s** (kind 5). NIP-09 is a *request*: after
   sending, `↻` and anything still answering is a relay that kept it. Expect survivors.
7. ~~Deploy the viewer once cards are live.~~ **DONE `61ca5d9`** — and the ordering was wrong:
   deploy has to come *first*, because a deleted 30818 is invisible to the old viewer.
8. **Docs, last, once it's past tense** — fold into `CONVENTION.md`, then `README.md` (7 refs)
   and `CLAUDE.md` (5, plus the stale 31/3 card count). Historical refs stay as-is:
   `index.html:238` and the `CLAUDE.md` Rolodex note describe a footer that genuinely *did*
   print 30818, and rewriting them would falsify the record.
9. **Drop 30818 from `READ_KINDS`** — one-line retirement, but **it is no longer free.** The nine
   `bitcoin-arbitrary-data` cards were deliberately left on 30818, so dropping the read kind
   deletes that whole collection *from the viewer* while leaving it live on the relays. Two ways
   out, user's call: migrate the bitcoin cards after all, or accept the collection going dark on
   the site. Until that's decided, `READ_KINDS` stays as it is — and it costs nothing to leave.
10. **PR the kind into the NIPs README** kind table once cards are live on it.
7. **Delete this doc** when everything above is past tense, per the `MIGRATION-v2.md` precedent.
8. **PR the kind into the NIPs README** kind table once cards are live on it.

## Versioning: the kind number IS the version

**Called, 2026-07-29: `CONVENTION.md` stops carrying a version number.** Its header becomes
*"Collection & discovery convention — kind 30828"*.

The reasoning is the lesson from #2426. v1→v2 was a tag-scheme change *inside* someone else's
kind, so it needed its own counter to say which scheme a card followed. That is no longer true:
the kind now carries the identity, and any future break big enough to matter gets a new kind
number — which is exactly what fiatjaf told us to do. A parallel `vN` counter would be a second
name for the same thing.

This also removes the collision rather than working around it. "v3" was already taken by the
viewer's UI generation (`CLAUDE.md`, "Current state (v3 — single vertical spine)"), and two
unrelated v3s in one project is the term overlap to kill at naming time, not later. Under this
call the viewer keeps `v3` uncontested, and `v1`/`v2` stay accurate as historical names for the
tag-scheme changes they described — the appendix keeps them, past tense.

Nothing about the tag scheme changes because of this. It is a header and an appendix line.

## Resolved — the 30818s come down

**User's call 2026-07-29, reversing the earlier assumption: delete them.** The convention's
"nothing here is ever deleted" governs *the record* — cards, revisions, disputes. It does not
oblige us to leave a duplicate of every card sitting under a kind we were told not to use. The
30828 card carries the same `d`, content and tags, so nothing about the record is lost; only the
wrong-kind copy goes.

Consequence to remember: the corpus stops appearing in wikifreedia and other NIP-54 wiki clients
once the 30818s are gone. That free rendering was the original reason for riding 30818, and
deleting is what makes its loss final. Accepted knowingly.

`READ_KINDS` keeps `30818` anyway — deletion is a request, so some relays will keep serving the
old cards indefinitely, and dedup collapsing a survivor against its replacement is the only
thing that keeps those relays from showing a stale spine.

# Authoring convention — how a card is written

**The wire format lives in [`NIP-DRAFT.md`](NIP-DRAFT.md)** — kind, tags, namespaces,
the membership gate, what a client must do. That document is normative and is the only
home of the tag scheme; nothing here restates it.

This document is the other half: **house style.** What goes in a card's body, how a
claim is sourced, how a hedge is worded, how a diff is cut. None of it is enforceable
by a client and none of it belongs in a standard. All of it is what separates a corpus
that reads well from one that merely validates.

Every rule below is a content convention. **No rule here adds a tag.** The body is
djot, and the shapes are the `Label: value` paragraph form the renderer already
handles.

## The body

One fact, stated plainly, then its provenance. A card is not an article: it carries the
smallest thing that is true on its own and links out for the rest.

## Approximate dates — one canonical, greppable line

`event_date` is always a full `YYYY-MM-DD`, because the spine needs a concrete point.
When the real date is coarser, place the card on a canonical day and record the true
precision in **one canonical line** in the body — fixed prefix, controlled precision
clause, then `— placed at <the event_date value>`. The fixed prefix is what makes every
contributor's caveat grep with a single pattern later.

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
- **Buckets encode the *known* precision, never the placeholder day** — this one is
  normative, and the spec says so. The line in the body is how a reader learns it; the
  missing bucket is how a query does.
- An exactly-known date carries **no** `APPROXIMATE DATE:` line at all.

## Sourcing

### One source line, scoped per claim

A card usually rests on more than one source: a photographed notice for the dates, an
official page for the procedure. The failure mode is a single `Source:` line that
supports half of what the card says — a reader who follows it finds the source does not
say what the card claims it said. That is worse than no citation, because it looks
checked.

One source ⇒ `Source:` unchanged. More than one ⇒ **one `Sources:` line, each source
prefixed by the claim it carries:**

```
Sources: date and time - [posted notice](https://blossom.example/<sha256>.jpg),
photographed from the public right-of-way 2026-05-29. The body's role and venue -
[planning commission](https://example.org/planning-commission), which "makes
recommendations to the board on rezoning ... and comprehensive plans."
```

One block, not one heading per source. Two `Source:` headings read as a bibliography
and crowd a card that has six blocks total.

### If a source has a URL, its name *is* the link

`[label](url)` — never a bare URL beside a plain name. Djot does not autolink, so a bare
URL is dead text. This applies to a photograph exactly as it does to a document.

A **blossom URL is the sha256 of the file**, so citing a photo by its blossom link is a
content-addressed citation: anyone can hash what they download and confirm it is the
image you shot. A swapped or re-edited photo lands on a different URL and the link
breaks instead of silently lying. Prefer it to "photographed on site."

### Embed when the card is *about* the image; link when it only *cites* it

| Form | Use when |
|---|---|
| `![alt](url)` | the image is the event — a photographed notice, on the card recording that it was posted |
| `[label](url)` in `Sources:` | the card draws a fact from an image that belongs to another card |

The same photo embedded on every card that leans on it is the main way a spine turns
into a wall of pictures. Embed it once, on the card that owns it.

## Scheduled events — `When:` / `Where:`

A card announcing a hearing, meeting, deadline or vote carries two lines, placed
**immediately above `Source:`/`Sources:`** — the last of the substance, just before the
provenance:

```
When: 2026-08-06, 9:30 AM UTC+9
Where: Council chambers, City Hall; virtual by registration with the planning office.
```

- **`Where:`, never `Location:`.** `Location:` already describes the *subject's* place —
  the parcel, the site, the thing the card is about. `Where:` is the *meeting's* place.
  When a card about one place is heard somewhere else these are different facts and must
  not share a label.
- **State the timezone every time.** A permanent record is read from anywhere.
- **Don't narrate the schedule in the prose too.** Once the block exists, the opening
  sentence says what the meeting *is* and who decides; the block says when and where.
  Saying the date twice is the most common way these cards get bloated.

**If the date moves, publish a new card — never edit this one.** A `When:` line records
what a source said the schedule was, as of that source's date; it is not a promise about
the future. The reschedule is itself an event on the timeline, and the original card
stays true, because it was always a claim about what was posted. Disambiguate the new
card's `d` with a qualifier.

## Things that have not happened yet

`APPROXIMATE DATE:` covers a *past* event whose date is coarse. An **anticipated** event
is the opposite problem — a date and contents that are guesses — and it must say so:

```
Status: anticipated - this card records an expectation, not an event.
A later card will record it as it actually happened.
```

Everything unsourced in such a card is labelled unsourced in place (`No posting date has
been announced; the estimate is not sourced.`), and the `Source:` line records what was
checked and when. An anticipated card is superseded by a real one, not deleted — nothing
here is ever deleted.

## A card with no body

The spec gives three text fields, none required, none parsed — presence or absence is
the only signal a client reads. A card may carry a `summary` and no `content`: an event
believed to have happened for which no citable record has been found. Nothing marks it
as a state; the absent body is the whole declaration, and it travels through any client,
because an absence cannot be dropped.

**A summary may be wrong; it may not be invented.** A guess about *what happened* can
stand. A guess about *why* is a story.

**The date range goes in the summary, in words,** and `event_date` sits on the first day
of the range — the same placement rule approximate dates use. `APPROXIMATE DATE:` lives
in the body. When a source turns up, the range moves into the body as a proper
`APPROXIMATE DATE:` line — or the source pins a day and the hedge goes away.

**A claim that proves false gets a body too.** It records what was claimed and what
disproved it, cited to the disproof. That is a body with a source: a record. Nothing is
deleted, nothing is reused, and the false claim keeps its place on the timeline.

## Cutting a diff

The spec says a revision carries `fork` markers and djot's `{-removed-}` / `{+added+}`.
Granularity is the whole craft, and no spec can hold it.

| Mark | Renders as | Use when |
|---|---|---|
| Alone on its own line(s) | a **gutter row** — rule + `−`/`+`, the diff idiom | a whole clause, subsection or paragraph came or went |
| Inside a sentence | inline — struck, or tinted for an addition | a phrase changed and the sentence still reads |

**The failure mode is marking at too fine a grain.** A rewritten paragraph diffed word
by word is confetti: every third word marked, nothing legible, and the reader learns
less than from one sentence of plain prose. Measure before you mark — if a subsection's
old and new text share well under half their words, it was **rewritten**, not edited.
Say so in a sentence and leave it unmarked. Honest prose beats an unreadable diff.

Conversely, don't put a whole line inside a mark when the text belongs to a continuous
document — that pulls it out into a gutter row and shatters the read into hunks. Mark
from *after* the subsection letter so the document stays a document.

**Removals go in their own block.** Readers get a per-card switch, *as passed* / *what
changed* (in this viewer, per-card and in the URL as `&plain=<d>`). "As passed" strips
the marks and drops any paragraph block whose marks are **all removals**, so whatever
prose introduced them goes with them instead of dangling over nothing. A mixed block — a
document marked inline — survives and reconstructs the clean text. So a "here is what
was cut" block holds *only* removals. Never mix.

**Build the marked text from the source documents programmatically.** Never retype a
quoted document by hand, and verify by reconstruction rather than by eye — the spec
states the two round-trips that must hold. A card failing either is claiming a change
that did not happen.

## The walls (where this breaks)

1. **Relays honoring the marker filter.** Single-letter `t` is indexed by every relay
   that answers at all. Passes.
2. **The marker is squattable and permanent.** By design. The guard is the membership
   gate — shape, not identity. Renaming a marker later means re-signing every card, so
   choose once.
3. **`#l` range-enumeration hits relay value-caps.** A decade of months is 120 values,
   over some relays' per-filter limits. Mitigated by the year bucket (a decade = 10
   values) and, for a small corpus, by client-side filtering. Never ship a naive
   enumerate-every-month `REQ`.
4. **No author allowlist — on purpose.** Anyone publishing a card that passes the gate
   is in, no permission asked. That is the offer, not a leak: a stranger can start a
   collection on their own key today and every conforming viewer will find it. The cost
   is that junk and fakes also pass. The answer is ranking, not gatekeeping.
5. **Discovery-window drift.** The fetch is an indexed marker filter against a kind
   nobody else writes, so the corpus is nearly the whole stream. Still bounded by
   `limit` if traffic grows large; the union across relays is the mitigation.
6. **Relays that restrict writes will not carry the cards.** Paid or allowlisted relays
   refuse publishes from an unpaying key, so they contribute nothing to a read. This is
   about the key and the relay's policy, not the kind number. Publish to several relays
   and let the union be the record.

## Frozen decisions

Style calls that are settled. The wire-format decisions are frozen in the spec instead.

- Approximate dates: one canonical `APPROXIMATE DATE: … — placed at <event_date>.` line,
  uppercase prefix as the grep anchor; controlled precision clauses or a quoted source
  period; placement day `01` for month-known, `01-01` for year-only.
- Sourcing: `Source:` for one, one `Sources:` line scoped per claim for several; a source
  with a URL *is* a link; embed an image only on the card it is about, link it elsewhere.
- Scheduled events: `When:` / `Where:` immediately above the source line, timezone always
  explicit, `Where:` never spelled `Location:`. A schedule change is **a new card, not an
  edit.**
- Anticipated events: a `Status: anticipated` line, unsourced estimates labelled as such
  in place; superseded by a real card, never deleted.
- Sourceless claims: a `summary`, no `content`, no marker word anywhere. The absence is
  the statement; date range in the summary, in words.
- Topics: freeform lowercase `t`, deliberately unspecced. No registry, no vocabulary.
- Diffs: removals in their own block; verify by reconstruction, never by eye; a rewrite
  gets prose, not marks.
- `d`: here, the title slugified at authoring time, then frozen — the title may drift
  on a republish, the address may not. The spec keeps `d` opaque, so no client ever
  reads the slug back, and any scheme works so long as `d` stays unique per key —
  `pubkey:d` is the dedup key, and a shared value collapses those cards into one.
- Nothing is ever deleted. A superseded card is superseded in place or answered by a new
  one.

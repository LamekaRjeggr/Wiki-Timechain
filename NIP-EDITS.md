# Pending edits to NIP-DRAFT.md

A queue, worked in tranches. `NIP-DRAFT.md` is the spec; this is what it still owes.
One entry per edit: what, why, where it lands, and the draft text when it's ready to paste.

Delete an entry when it ships — this file tracks debt, not history. `git log` keeps the rest.

---

## Open

### 1. No guidance on choosing a marker

**Where:** `## Discovery`, after the paragraph ending "requires re-signing every card."

**Why:** The marker is a required tag and the whole discovery mechanism rests on it, but
the draft never says how to pick one. The one-word `t` space is global and flat — no
registry, no way to claim a value. Two corpora landing on `history` or `timeline` are read
as one corpus by every client configured for either, and the spec's own "permanent in
practice" note is what makes that unfixable after the fact. Cheap to close now; a reviewer
will otherwise ask.

**Proposed:**

> A marker SHOULD be distinctive rather than generic — a corpus or project name, not a
> common word such as `history` or `timeline`. There is no registry: a marker is claimed
> by use alone, and two corpora sharing one are indistinguishable to every client
> configured for it.

---

## Shipped

*(nothing yet)*

# Modular acceptance handoff — 2026-09-02

## Start here

- Repository: `/Users/alkemagreg/Documents/Playground/wiki-timechain`
- Branch: `lab/modular-acceptance-mock`
- Current commit before this note: `b84da8d`
- Actual draft specs: `NIP-DRAFT.md`, `NIP-DRAFT-ACTS.md`,
  `NIP-DRAFT-NOTARY.md`
- Design rationale: `DESIGN-MODULAR-ACCEPTANCE.md`
- Local live lab: `/Users/alkemagreg/lab-relay` (not a Git repository)

## Agreed model

- `30828` is an ordinary authored card. Revision and synthesis are descriptions of
  provenance, not new event kinds.
- `30829` names a notary lens and contains an unordered set of zero or more other
  `30829` discovery sources. Links imply no hierarchy, rank, delegation, inheritance,
  or authority.
- `8828` is the only event that changes a notary's derived projection.
- One `8828` selects either a complete card or one or more field blocks from one exact
  source-card version. Multi-source synthesis therefore uses one act per source card,
  not one act per field.
- Source and optional public credit are separate.
- Source replacement, deletion, disappearance, or upstream withdrawal cannot silently
  alter bytes already selected by a notary.
- Plurality and exact matching are visible advisory signals, never automatic acceptance
  or a protocol winner.

## Core modular card blocks

The current spec defines exactly six:

```text
title
summary
content
event_date
event_time
g
```

`g` is the complete ordered geohash ladder and cannot mix rungs from different cards.
`d`, `a`, `published_at`, `t`, provenance, and decision references are structural or
documentary—not partial-selection blocks. A whole-card snapshot still preserves them.
The project chose geohash rather than an `L`/`l` location ladder.

## Current simplified 8828 draft

The spec at `b84da8d` uses the complete signed source snapshot as the only value store:

```text
a       30829 coordinate, marked context
slot    card d
e       exact source-event id, marked source
snapshot complete signed 30828 JSON
select  card | content | tag:<core-name>  (repeatable)
p       optional credit                    (repeatable)
```

There is no duplicate `context`, source-card `a`, `scope`, `value`, `prev`, or
`supersede`. The act's content is empty. The source coordinate and selected bytes are
derived from the verified snapshot. A revoke names one same-key act and clears only
registers still sourced from it; no old value resurrects.

The current draft folds same-context acts by `(created_at, event id)`.

## Opus 5 review — not yet incorporated

Claude Code's authenticated `claude-opus-5` reviewed the current files read-only. It
endorsed snapshot-as-value-store and recommended three further reductions:

1. Drop **baseline** as distinct reducer state. Keep six flat registers holding
   `(act id, snapshot, block)`. `select:card` is sugar that writes all six.
2. Consider dropping `slot`, since the verified snapshot supplies card `d`; if retained,
   treat it only as a checked convenience. A revoke can derive the slot from its target.
3. Do not require a revoke to sort after its target by timestamp. Its target-id edge is
   causal proof; apply the revoke immediately after its target regardless of timestamps.

It also recommended avoiding a new canonical JSON standard: accept any JSON spelling
that decodes to the seven event fields, recomputes to the source `e` under NIP-01, and
has a valid signature.

Hidden cases it asked the spec to settle:

- registers need `unset`, `selected absent`, and `selected value` states;
- repeated tags remain ordered lists even when a UI expects a scalar;
- NIP-09 kind-5 deletion of an `8828` must not change projection state;
- malformed or hybrid acts matching neither exact shape are not folded;
- event-id ordering at equal timestamps is mechanical, not operator intent;
- full snapshots in tag strings may hit relay tag-size limits;
- notary key rotation remains undefined.

No files were changed after this review. The next session should decide and incorporate
these reductions before implementation.

## Exact next test

Write a normative fold conformance vector for one `(context, slot)` containing:

1. whole-card selection;
2. two interleaved partial selections from different sources;
3. a multi-field act whose fields are partly replaced later;
4. revocation of that older act;
5. selected absence;
6. equal acceptance timestamps;
7. a backdated revoke; and
8. an irrelevant kind-5 deletion.

Write the expected six-register projection by hand, including each register's tri-state
and source act. Feed the same signed event set in at least three arrival orders. Every
order must derive the same result.

Then embed one real card containing non-ASCII text into a snapshot tag, parse it,
recompute its NIP-01 id, verify its signature, and measure the event/tag size accepted by
the local relay. Do this before changing either client reducer.

## Live lab state

Viewer server is normally `http://127.0.0.1:8778`; relay is
`ws://127.0.0.1:7777` through Colima.

- Shelf comparison:
  `http://127.0.0.1:8778/shelf-live.html?c=us-israel-defense-tech-2026-lab`
- Main timeline:
  `http://127.0.0.1:8778/modular.html?c=us-israel-defense-tech-2026-lab&k=e27d664e26a7`
- Notary A timeline:
  `http://127.0.0.1:8778/modular.html?c=us-israel-defense-tech-2026-lab&k=93a2e6405477`

The real modular synthesis is signed by Gnomon/Notary A:

```text
ce0e9b667b62bef8b8fa0ac8b8064941b309525251f977603c411727d0fbc6e2
```

It takes title and date from Scribe and summary and content from Cairn. Four earlier
field-per-act `8828`s were used for that experiment; they are historical test data and
do not match the newly simplified one-act-per-source grammar. Main has not accepted the
synthesized card.

The live timeline client still reduces decisions roughly per signer/card rather than
per `(notary, slot, field)`. That known mismatch is evidence for the future reducer
change, not something to hide.

## Relevant commits

```text
b84da8d spec: use snapshots as the acceptance value store
9ec4eec spec: define core modular card blocks
365ed1e spec: bundle field selections by source card
e46a8d4 spec: name modular acceptance foundations
48187de lab: compare modular acts across live clients
ba6da09 lab: back-test acceptance with signed events
c621648 lab: add whole-card acceptance path
690733e lab: materialize notary projection as a card
f317916 lab: make modular field acceptance playable
```

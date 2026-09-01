# First back-test findings

## Outcome

The progressive workflow held up:

- whole card when a complete candidate was sound;
- ordinary derived `30828` when one source needed editorial correction;
- modular assembly available but intentionally unused when it would create a needless
  synthetic card.

This produced a readable five-event timeline from imperfect sequential authors. The
later notaries caught an invalid tag shape, a fabricated event date, a reversed section
number sequence, conflation of an amendment with a Senate discovery date, and confusion
between package passage and enactment.

## What passed

- All generated events had valid NIP-01 IDs and BIP-340 signatures.
- One whole-card decision used one `8828` and created no `30828`.
- A changed card required a new `30828`.
- Exact accepted date and content bytes survived replacement and a missing-source replay.
- Same event set derived identically in normal and reverse arrival order.
- Same-key revocation removed the upstream decision without deleting history.
- Upstream revocation did not mutate an independently signed downstream decision.
- Public credit was distinguishable from cryptographic source and decision provenance.

## What did not yet pass as a specification

The replay succeeds because its local state machine knows custom meanings that the repo
spec does not yet fully define. Most importantly:

- current repo acts copy only `title`, `summary`, and `content`; the lab also needs
  load-bearing timeline tags;
- current repo consent follows the live address bytes, while the lab retains an exact
  selected version until a new notary act;
- current repo position is one whole act per key/card coordinate, while the modular
  model needs a semantic slot and independently addressable field registers;
- optional credit conflicts with the repo's required `p` tag;
- copied card bytes preserve the notary's historical decision but do not preserve the
  original author's verifiable signature unless the full source envelope is retained.

## Recommended next spec step

Define the smallest normative whole-card envelope first:

1. exact source event ID and address;
2. notary context and semantic slot;
3. versioned canonical snapshot covering all accepted timeline fields;
4. a clear statement that the snapshot proves what the notary signed, while an embedded
   full source event is needed to preserve original-author signature proof;
5. same-key revoke/supersede rules;
6. explicit non-cascading behavior across notary layers.

Then define field scope as an extension using the same context, slot, canonical bytes,
and provenance rules. This keeps the ordinary whole-card path simple without letting the
advanced path invent a second state model.

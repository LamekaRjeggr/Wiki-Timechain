# Modular acceptance protocol lab

This is a closed-dossier, local-only back-test of timeline cards, acts, and stacked
notaries. It publishes nothing and does not use a relay. Generated keys and signed event
logs belong in a temporary directory and are never committed.

## Test question

Can independent participants reconstruct a changing public claim with at most five
timeline cards while preserving exact history, optional attribution, independent notary
judgment, and the distinction between an original card, a revision, and a modular
composite?

## Participant order

1. **Sparse author** sees Stage 1 and writes no more than five candidate cards.
2. **Second author** sees Stage 2 plus the first author's events. They may write notes,
   rival cards, or revisions, but cannot edit the first author's events.
3. **Detailed author** sees Stage 3 and all prior events. They reconcile only where the
   evidence warrants it.
4. **Notary A** uses whole-card acceptance by default, revision when one source is mostly
   sound, and modular assembly only when several field choices are genuinely needed.
5. **Main notary** independently evaluates the candidates exposed through Notary A.
6. **Blind reader** receives only the final event log and derives the timeline and its
   provenance.

Each participant must distinguish private reasoning from events they would publish.
No participant may declare a plurality signal authoritative.

## Five-card ceiling

The final projected timeline has at most five semantic event slots:

1. House bill introduced.
2. Parallel House and Senate initiatives become publicly legible.
3. The “military merger” description spreads and is qualified.
4. Opposition attempts to remove the House provision.
5. House passes its NDAA while enactment remains incomplete.

Replacements at one address are versions of one card, not additional timeline slots.
Rival cards may share a slot. Acts do not count toward the ceiling.

## Required durability exercises

- Pass one original card unchanged with one `8828` and no new `30828`.
- Replace a card after it has been accepted.
- Make one correction affecting a load-bearing date or section number.
- Preserve or intentionally omit public credit.
- Reconcile at least one field from a different source.
- Withdraw one acceptance and explicitly make a later decision.
- Let Main disagree with one upstream field without losing upstream history.
- Remove one source event from the reader's available set and replay derivation.

## Success criteria

- Accepted bytes remain reconstructable after replacement or source loss.
- Whole-card passage does not create a synthetic card.
- Every changed downstream projection is explained by a signed act.
- Original authorship, public credit, provenance, and notary authorship remain distinct.
- Date, time, and location are no less durable than prose.
- Replaying the same event set produces the same result regardless of arrival order.
- A blind reader can say what was proposed, what each notary selected, what later
  changed, and what remains uncertain.

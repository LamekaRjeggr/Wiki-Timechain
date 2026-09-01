# Runs 5–6: Main and blind reader

## Main

Main independently accepted A1 and C1–C4 whole. This produced five Main `8828` acts
and no new `30828`. Main did not inherit R1, the malformed B cards, or Notary A's
authority. When Notary A later revoked C3, Main's own C3 decision remained active.

Main required actual accepted bytes, not merely an upstream digest or summary. It used
the original `30828` coordinates and exact event IDs plus Notary A's acts as provenance.

## Blind audit

The blind reader received only the generated event log. It recomputed all 25 event IDs,
verified all 25 BIP-340 signatures, resolved every reference, and independently derived:

- Notary A: four active slots after its later C3 revoke;
- Main: all five slots, including its independently retained C3 passage card;
- R1: historical, explicitly revoked, not deleted;
- A1: pinned to the accepted May 13 version despite a later May 14 replacement at the
  same address.

The reader correctly separated source authorship, notary signatures, optional `p`
credit, and provenance links.

## Blind-reader interoperability findings

The local derivation was coherent, but the reader could not infer it from standard
Nostr rules alone. It identified these protocol gaps:

1. `context`, `slot`, `scope`, and `snapshot` need normative, versioned grammar.
2. Multiple unrevoked acts in one slot need a defined conflict rule; arrival order must
   not decide.
3. The exact `e` version and mutable `a` address can disagree after replacement; their
   distinct roles and precedence need to be explicit.
4. Upstream revocation must be defined as provenance status, not a cascading downstream
   revocation.
5. A snapshot containing only tags and content preserves the accepted bytes but cannot
   independently verify the missing source's original signature. A full source-event
   envelope would be required for portable authorship proof.
6. Snapshot serialization needs a schema version and canonical byte definition.
7. Duplicate copies in the act's `content` and snapshot need a precedence rule or one
   representation should be eliminated.
8. A log proves the events it contains, not completeness; omission resistance requires
   a separate checkpoint/commitment mechanism if the protocol wants it.

These are test results, not assumptions silently added to the proposed spec.

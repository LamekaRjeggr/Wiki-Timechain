# Run 4: Notary A

Model role: detailed upstream notary. Evidence: all author artifacts.

## Decisions

1. **Pass A1 whole.** One card-scoped `8828`; no new `30828`. Preserve its exact
   accepted bytes and show optional public credit to A1's author.
2. **Decline A2 as submitted and derive R1.** R1 is an ordinary new `30828` retaining
   A2's supported material while correcting “Section 224, later renumbered Section 219.”
   Accept R1 with one card-scoped `8828` and distinguish retained-source credit from
   notary/editor authorship.
3. **When C1 arrives, revoke R1's acceptance and decide again.** Preserve R1 and its act
   in history, then accept C1 whole with a new card-scoped `8828`.
4. **Pass C2, C3, and C4 whole.** One card-scoped `8828` each; no derived cards.
5. **Decline B1 and B2.** Their envelopes are invalid, and B2 also conflates an undated
   opposition event with the dated Senate discovery.
6. **After A1 source replacement/loss, keep the accepted snapshot.** Treat replacement
   bytes as a new candidate requiring a new decision.

## Modular decision

Notary A declined to manufacture a modular composite merely to exercise the feature.
B2's opposition portion lacks an evidence-supported date, while C1–C4 already provide
complete coherent cards. Reassembling those cards would add a synthetic candidate with
no editorial need.

This refusal is part of the test result: the progressive interface must make modular
assembly available without creating pressure to use it.

## Active downstream candidates

1. A1 — 2026-05-13
2. C1 — 2026-05-29
3. C2 — 2026-06-04
4. C3 — 2026-07-22
5. C4 — 2026-09-01

R1 remains in audit history as accepted and later revoked. A2, B1, and B2 do not pass.

## Lab-only caution

The agent also requested a full-byte digest, source generation, and receipt time in
provenance. These are not assumed to be current wire requirements; the event harness
must distinguish derivable metadata from proposed additions.

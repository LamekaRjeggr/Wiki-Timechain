# Wiki-Timechain

A live viewer of timeline events (nostr **kind-30828** cards), and a writer for
publishing them. Reads straight from relays — no server, no login required, no
build step.

**Live:** https://lamekarjeggr.github.io/Wiki-Timechain/ ·
**Write a card:** [/add.html](https://lamekarjeggr.github.io/Wiki-Timechain/add.html)

![The viewer showing a timeline pulled live from relays](screenshot.png)

## The convention

One timeline entry is one **kind-30828** addressable event
([NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)) carrying an
`event_date` and an `a` submission to a **kind-30829** notary — the timeline as its own
event ([NIP-DRAFT-NOTARY.md](NIP-DRAFT-NOTARY.md)). A `t` marker (`wikitimechain`) on
the notary names the corpus.

- Notaries are found by marker, cards by the notary they submit to. No author filter.
- A collection is a notary. Typing a new slug in the writer mints one under your key.
- Same `d`, same author — edit. Same `d`, different author — both render.

Tag scheme: [NIP-DRAFT.md](NIP-DRAFT.md). Prose style: [CONVENTION.md](CONVENTION.md).
Acts — accept, supersede, revoke (kind **8828**): [NIP-DRAFT-ACTS.md](NIP-DRAFT-ACTS.md).
Notaries — where cards are submitted, whose acceptances pass them on (kind **30829**, provisional): [NIP-DRAFT-NOTARY.md](NIP-DRAFT-NOTARY.md).

## Run it yourself

```
git clone https://github.com/LamekaRjeggr/Wiki-Timechain.git
cd Wiki-Timechain
python3 -m http.server 8000
```

**Not `file://`** — some relays reject the `null` origin and cards go missing silently.

### Modular acceptance lab

The `lab/modular-acceptance-mock` branch includes a standalone protocol mock at
`shelf-model.html`. With the local server running, open:

```
http://localhost:8000/shelf-model.html
```

It uses simulated events only: nothing is signed or sent to a relay. The exact prior
shelf mock is retained as `shelf-model-original.html` for comparison.

To host a copy: fork, then GitHub Pages, deploy from `main`, root.

`MARKER` and `RELAYS` are the two knobs, set in **both** HTML files. The writer stamps
the marker; the viewer reads the whole kind and does not gate on it yet.

## Built on

- **[NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)** — events, relays, addressable events
- **[NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md)** — card shape: `title` / `d` / djot, and the citation marker
- **[NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)** — labels
- **[NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md)** — bech32 entities
- **[NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)** — browser signer extensions
- **[NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md)** — remote signing, `bunker://`
- **[BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)** — schnorr signatures
- [registry-of-kinds](https://github.com/nostr-protocol/registry-of-kinds) — 30828 listed; 8828 in [PR #11](https://github.com/nostr-protocol/registry-of-kinds/pull/11)
- [djot](https://djot.net) — content format
- [nstart.me](https://nstart.me) — get keys · [njump.me](https://njump.me) — inspect an event

## Vendored code

`nip46.js` is [nostr-tools](https://github.com/nbd-wtf/nostr-tools) 2.23.9's NIP-46
bundle, verbatim. It is **MIT-licensed** — Paul Miller's `@noble/hashes`,
`@noble/curves`, `@noble/ciphers` and `@scure/base` travel inside it, and their
license block ships at the foot of the file, and its terms match the repo's own
code license.

## License

Code — `index.html`, `add.html`, `nip46.js` — is
[MIT](LICENSE).

Specification — `CONVENTION.md`, `NIP-DRAFT.md`, `NIP-DRAFT-ACTS.md` — is
[CC0 1.0 Universal](LICENSE-SPEC), matching the
[nips repo](https://github.com/nostr-protocol/nips), so the text can be absorbed
there without an attribution clause riding along. `cards/` is CC0 too; it is staging
copy — the relays hold the truth.

# Wiki-Timechain

A live viewer of timeline events (nostr **kind-30828** cards), and a writer for
publishing them. Reads straight from relays — no server, no login required, no
build step.

**Live:** https://lamekarjeggr.github.io/Wiki-Timechain/ ·
**Write a card:** [/add.html](https://lamekarjeggr.github.io/Wiki-Timechain/add.html)

## The convention

One timeline entry is one **kind-30828** addressable event
([NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)) carrying the
`wikitimechain` marker, a `timeline.collection` label
([NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)), and an
`event_date`.

- Cards are found by the marker. No author filter, no list of timelines.
- A collection is its slug. The first card carrying a new one creates that timeline.
- Same `d`, same author — edit. Same `d`, different author — both render.

Tag scheme: [NIP-DRAFT.md](NIP-DRAFT.md). Prose style: [CONVENTION.md](CONVENTION.md).

## Run it yourself

```
git clone https://github.com/LamekaRjeggr/Wiki-Timechain.git
cd Wiki-Timechain
python3 -m http.server 8000
```

**Not `file://`** — some relays reject the `null` origin and cards go missing silently.

To host a copy: fork, then GitHub Pages, deploy from `main`, root.

`MARKER` and `RELAYS` are the two knobs. Change either in **both** HTML files.

## Built on

- **[NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)** — events, relays, addressable events
- **[NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md)** — card shape: `title` / `d` / djot, and the `fork` marker
- **[NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)** — labels
- **[NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md)** — bech32 entities
- **[NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md)** — reactions, kind 7
- **[NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md)** — comments, kind 1111
- **[NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)** — browser signer extensions
- **[NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md)** — remote signing, `bunker://`
- **[BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)** — schnorr signatures
- [djot](https://djot.net) — content format
- [nstart.me](https://nstart.me) — get keys · [njump.me](https://njump.me) — inspect an event

## Vendored code

`nip46.js` is [nostr-tools](https://github.com/nbd-wtf/nostr-tools) 2.23.9's NIP-46
bundle, verbatim. It is **MIT-licensed** — Paul Miller's `@noble/hashes`,
`@noble/curves`, `@noble/ciphers` and `@scure/base` travel inside it, and their
license block ships at the foot of the file. The CC0 dedication below does not
cover it.

## License

[CC0 1.0 Universal](LICENSE) — public domain dedication, code and convention both.
Copy it, fork it, ship it, no attribution required.

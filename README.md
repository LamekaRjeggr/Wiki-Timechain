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

nostr NIPs this rests on:
- **[NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)** —
  events, relays, and *addressable events* (the `d`-tag, replace-per-author
  behavior kind-30828 uses)
- **[NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md)** —
  Wiki: where the card shape came from — `title` / `d` / djot, and the `fork` marker
- **[NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md)** —
  bech32 entities; the viewer encodes `npub`s inline (zero-dep) for njump links
- **[NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md)** —
  reactions (the `+` tap, kind 7)
- **[NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md)** —
  comments (kind 1111, scoped to one signed version of a card)
- **[NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)** —
  browser signer extensions; how a visitor signs anything
- **[NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md)** —
  remote signing; the `bunker://` option, for a key on another device
- **[BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)** —
  schnorr signatures; verified inline against the official test vectors

Tools & references:
- Get keys — [nstart.me](https://nstart.me)
- Inspect any event or author — [njump.me](https://njump.me)
- Content format — [djot](https://djot.net)

## Vendored code

`nip46.js` is [nostr-tools](https://github.com/nbd-wtf/nostr-tools) 2.23.9's NIP-46
bundle, verbatim. It is **MIT-licensed** — Paul Miller's `@noble/hashes`,
`@noble/curves`, `@noble/ciphers` and `@scure/base` travel inside it, and their
license block ships at the foot of the file. The CC0 dedication below does not
cover it.

## License

[CC0 1.0 Universal](LICENSE) — public domain dedication, code and convention both.
Copy it, fork it, ship it, no attribution required.

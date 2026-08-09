# Wiki-Timechain

A live viewer of timeline events (nostr **kind-30828** cards), and a writer for
publishing them. Reads straight from relays — no server, no login required, no build step.
Any dated event with a source link fits naturally on the rail.

**Live:** https://lamekarjeggr.github.io/Wiki-Timechain/ ·
**Write a card:** [/add.html](https://lamekarjeggr.github.io/Wiki-Timechain/add.html)

## What it does

Timelines are discovered automatically, not hardcoded — the viewer pulls
30828 events from relays and groups any that carry a date and a collection
tag. Pick one from the picker and it shows up. Add a new card to a new
collection and it appears there too — no fixed list, no publish-side
registration.

## The convention

A timeline entry is a single **kind-30828** addressable event
([NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)) that labels
itself as belonging here ([NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)):
the `wikitimechain` marker, a `timeline.collection` label, and an
`event_date`. A collection *is* its slug — publish the first card carrying a new
one and that timeline exists, with no registration step.

**30828 is our own kind**, started from
[NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md)'s wiki article
(kind 30818) — same card shape, different kind number.

Same `d` from the **same** author edits the card; same `d` from a **different**
author renders beside it — a dispute, never an overwrite.

**The tag scheme lives in one place: [NIP-DRAFT.md](NIP-DRAFT.md)** — normative,
written to become a NIP. [CONVENTION.md](CONVENTION.md) is house style only: how a
card's prose is written, sourced and diffed. Don't restate the tags anywhere else —
copies go stale, and a stale copy tells a contributor to publish a card no client
can see.

## Run it yourself

Three files, nothing to install.

```
git clone https://github.com/LamekaRjeggr/Wiki-Timechain.git
cd Wiki-Timechain
python3 -m http.server 8000
```

`http://localhost:8000` is the viewer, `/add.html` the writer. Edit, save, refresh.
**Don't open the files over `file://`** — a couple of relays reject the `null` origin,
so cards go missing with nothing to say why.

To host a copy: fork it and turn on GitHub Pages (deploy from `main`, root). That's
all — no server, no database, no key in the repo. Your copy shows the same cards as
every other copy, because discovery is by marker and not by author; that is the
point, not a limitation. A second front door to the same corpus is worth more than
a separate one. If you truly want a private corpus, change `MARKER` in both HTML
files; to sandbox against your own relay, point `RELAYS` at it — in both files, or
the writer's collision guard checks a corpus the viewer never shows you.

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
  schnorr signatures; verification is implemented inline and checked against
  the official test vectors, sign and verify

Tools & references:
- Get keys — [nstart.me](https://nstart.me)
- Inspect any event or author — [njump.me](https://njump.me)
- Content format — [djot](https://djot.net)

## Design constraints

- The viewer is read-only forever: `index.html` never writes or edits a 30828.
  Its only writes are reactions and comments the visitor signs with their own
  key — and it never asks for a secret key. Writing cards is `add.html`'s job,
  and it is a separate page for exactly that reason
- Zero dependencies fetched at runtime: nothing loads from a third-party host.
  `index.html` is one self-contained file; `add.html` adds one vendored sibling
  (see Vendored code)
- Colorblind-safe (no meaning carried by hue alone)

## Vendored code

`nip46.js` is [nostr-tools](https://github.com/nbd-wtf/nostr-tools) 2.23.9's
NIP-46 bundle, copied into this repo verbatim so that `add.html`'s bunker login
fetches nothing from anyone else's server. It is **MIT-licensed** — Paul Miller's
`@noble/hashes`, `@noble/curves`, `@noble/ciphers` and `@scure/base` travel inside
it, and their license block ships at the foot of the file. The CC0 dedication below
covers this repo's own work, not that file.

## License

[CC0 1.0 Universal](LICENSE) — public domain dedication. Everything here, the viewer
and the convention both: copy it, fork it, ship it, no attribution required. The
convention text is deliberately under the same terms as the NIPs themselves, which are
public domain, so it can be lifted into one without friction.

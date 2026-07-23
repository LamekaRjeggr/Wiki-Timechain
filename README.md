# Wiki-Timechain

A live viewer of timeline events (nostr kind-30818 wiki cards). 
Reads straight from relays — no server, no login, no build step.
Any dated event with a source link fits naturally on the rail.

**Live:** https://lamekarjeggr.github.io/Wiki-Timechain/

![Wiki-Timechain](screenshot.png)

## What it does

Timelines are discovered automatically, not hardcoded — the viewer pulls
30818 events from relays and groups any that carry a date and a collection
tag. Pick one from the dropdown and it shows up. Add a new card to a new
collection and it appears there too — no fixed list, no publish-side
registration.

## Navigating

Choose a timeline from the collection dropdown. Time runs down the page:
scroll is the time axis, and the whitespace between cards is proportional
to the real gap between events — long silences collapse to a `⋯ N years`
marker you can expand in place. A bold amber rule marks *now*; anything
below it is scheduled, not history. **⧉ Copy link** copies a shareable URL
to whatever timeline you're viewing — opening it drops the recipient
straight onto that collection.

## Reactions and comments

Cards carry reactions ([NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md)
kind-7) and comments ([NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md)
kind-1111), read live from the same relays and written from the page — signed
by a browser extension if you have one, otherwise by a keypair the page mints
for you on the spot. It never asks for an existing secret key.

Cards themselves are read-only forever: reactions and comments are the only
things this page ever writes. Try it on the live site; the behavior is the
documentation.

## The convention

A timeline entry is a single **kind-30818** wiki event
([NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md)) that labels
itself as belonging here ([NIP-32](https://github.com/nostr-protocol/nips/blob/master/32.md)):
the `wikitimechain` marker, a `wikitimechain.collection` label, and an
`event_date`. A collection *is* its slug — publish the first card carrying a new
one and that timeline exists, with no registration step.

Same `d` from the **same** author edits the card; same `d` from a **different**
author renders beside it — a dispute, never an overwrite.

**The tag scheme lives in one place: [CONVENTION.md](CONVENTION.md).** Don't copy
it into other docs — copies go stale, and a stale copy tells a contributor to
publish a card the viewer can't see.

## Deploy

```
git push origin main
```
GitHub Pages redeploys in about a minute. This is only for changes to the
viewer itself — new cards need no deploy, they show up on next page load.

## Contributing a card

Publish a kind-30818 event with the tags above (get keys at nstart.me,
publish via wikifreedia or wikistr) — see the "Add to the record" section
on the live page for the exact tag shape.

## Built on

nostr NIPs this rests on:
- **[NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)** —
  events, relays, and *addressable events* (the `d`-tag, replace-per-author
  behavior kind-30818 uses)
- **[NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md)** —
  Wiki: defines kind-30818 and the `title` / `d` / entry format
- **[NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md)** —
  bech32 entities; the viewer encodes `npub`s inline (zero-dep) for njump
  links, and `nsec` for the minted starter key
- **[NIP-25](https://github.com/nostr-protocol/nips/blob/master/25.md)** —
  reactions (the `+` tap, kind 7)
- **[NIP-22](https://github.com/nostr-protocol/nips/blob/master/22.md)** —
  comments (kind 1111, scoped to one signed version of a card)
- **[NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md)** —
  browser signer extensions; used when present, minting is the fallback
- **[BIP-340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)** —
  schnorr signatures; the minted key's signer is implemented inline and
  verified against the official test vectors

Tools & references:
- Get keys — [nstart.me](https://nstart.me)
- Publish a card — [wikifreedia.xyz](https://wikifreedia.xyz) ·
  [wikistr.com](https://wikistr.com)
- Inspect any event or author — [njump.me](https://njump.me)
- Content format — [djot](https://djot.net)
- Relays queried — `relay.damus.io`, `nos.lol`, `relay.primal.net`,
  `relay.mostr.pub`, `relay.nostr.band`, `nostr.wine`

## Design constraints

- Cards are read-only forever: the page never writes or edits a 30818. The
  only writes are reactions and comments the visitor signs with their own
  key — and it never asks for a secret key
- Single file, zero dependencies
- Colorblind-safe (no meaning carried by hue alone)

## License

Public domain — do what you want with it.

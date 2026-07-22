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

Choose a timeline from the collection dropdown. Pan by dragging, zoom with
the wheel or pinch, click a node to open its card. **⧉ Copy link** copies a
shareable URL to whatever timeline you're viewing — opening it drops the
recipient straight onto that collection.

## The convention

A timeline entry is a single **kind-30818** wiki event ([NIP-54](https://github.com/nostr-protocol/nips/blob/master/54.md))
carrying four tags. The viewer discovers any card that has both an
`event_date` and a `c` tag — nothing else is required:

```
kind: 30818
tags:
  d           2026-my-entry-slug     identity — one entry, editable by you
  title       2026 · Short name       heading shown on the node
  event_date  2026-07-20              YYYY-MM-DD — where it sits on the rail
  c           my-collection           which timeline; a new value starts one
content:
  One factual sentence about what happened.

  Source: [label](https://primary-source)
```

- **`c`** (collection) — a kebab-case slug shared by every card in one
  timeline. Publishing the first card of a new `c` value creates that
  timeline; there is no registration step.
- **`event_date`** (`YYYY-MM-DD`) — the historical date, which fixes the
  card's position on the rail. A card with no parseable `event_date` is
  never discovered.
- **`d`** — the entry's identity. Editing means re-publishing with the same
  `d` tag; the newest version from a given author replaces the older
  ([NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md)
  addressable events).
- **content** — one sourced fact in [djot](https://djot.net): a sentence, a
  blank line, then `Source: [label](url)`. Bare URLs don't autolink — use
  the `[label](url)` form.

Same `d`, **different** authors → both versions render side by side (a
dispute, not an overwrite). Same `d`, **same** author → newest replaces
oldest.

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
  bech32 entities; the viewer encodes each author's `npub` inline (zero-dep)
  to build njump links

Tools & references:
- Get keys — [nstart.me](https://nstart.me)
- Publish a card — [wikifreedia.xyz](https://wikifreedia.xyz) ·
  [wikistr.com](https://wikistr.com)
- Inspect any event or author — [njump.me](https://njump.me)
- Content format — [djot](https://djot.net)
- Relays queried — `relay.damus.io`, `nos.lol`, `relay.primal.net`,
  `relay.mostr.pub`, `relay.nostr.band`, `nostr.wine`

## Design constraints

- Read-only: queries relays, never publishes or signs
- Single file, zero dependencies
- Colorblind-safe (no meaning carried by hue alone)

## License

Public domain — do what you want with it.

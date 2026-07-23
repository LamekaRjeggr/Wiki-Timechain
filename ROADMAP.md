# Roadmap — comments & reactions

One roadmap, merged 2026-07-22 from the comments phase plan and the reactions
checkpoint plan. Each checkpoint ships alone, is useful alone, and is a freeze
line: later checkpoints don't rewrite earlier ones.

## Where things stand

- Viewer is live; the **vertical spine is the only view** (horizontal rail
  excised 2026-07-22).
- **Comments read side is shipped and proven end-to-end**: NIP-22 kind-1111,
  scoped to one author's signed version (`A` = `30818:pubkey:d`), collapsed
  `◦ N comments` toggle under the card, expand in place. A real comment is
  live on the relays and renders on the public page.
- **The whole ladder is shipped**: reaction read (2a), the tap (2b), and the
  comment compose unlock (2c) are all live. Real kind-7 `+`s on the Taproot
  card render from the relays. The roadmap's checkpoints are complete; what
  remains lives under "Held loosely".

## The shape (decided)

**The ladder: read → react → comment.** Each rung costs more. To comment on a
card you must have reacted to it first — extension users included (NIP-07 is a
shortcut past the *mint*, not past the ladder).

**The tap mints the key.** On first reaction: `window.nostr` (NIP-07) if
present, else mint a keypair client-side. One flow. A newborn key's first
signed event is one character, not a composed paragraph — the `+` is the key's
proof-of-life; by comment time the pipe is proven.

**Reward first, ceremony after.** The tap succeeds immediately — glyph lights
up, event publishes. *Then* the birth-certificate popup: "That was your first
nostr event. This key signed it — save it somewhere safe; it works in any
nostr client." nsec + npub, copy button. Never a toll booth, never a
paste-your-nsec field, no hard save-gate — just an escalating "N events ride
on this unsaved key" counter and an always-available key chip.

**One signer seam.** All write code asks `getSigner() → { pubkey, sign(event) }`.
NIP-07 and the minted localStorage key are two implementations behind the same
interface. Minted nsec lives in localStorage — a starter identity designed to
graduate out to real clients.

**Honest OK tally.** Relays answer each publish with an OK frame; we count and
say the truth ("accepted by 4 of 6 relays"). This doubles as instrumentation:
fresh zero-history keys' accept rates are the data that decide whether
proof-of-work is ever needed. PoW stays parked until that data says otherwise.

**Glyphs mean what readers think they mean.** No UI copy defines `+`/`=`/`−`.
Shape-pure ASCII — colorblind-safe by construction; `+`/`-` are NIP-25
standard so foreign clients interop. Ship `+` alone first.

**Reactions attach to cards AND comments** (resolved at merge — the unlock
ladder needs a target on zero-comment cards). Card reactions tag both `a`
(the `30818:pubkey:d` coord — survives the author editing the card) and `e`
(the exact signed version), read back by `#a`, mirroring how comments scope.
Comment reactions are plain `#e` — 1111s are never replaced. Reacting to a
card doesn't modify it; cards stay read-only as documents.

## Checkpoints

**2a — reaction read. SHIPPED 2026-07-22.** One more grow-only sub beside
`"cmt"`: kind-7s by `#a` (card coords) + `#e` (comment ids). Charge renders
as glyph·count pairs on the margin line (one vote per pubkey per target,
newest wins; `""`/`+` collapse to `+`); charged comments lift-sort to the
top of the thread. No writes.

**2b — the tap. SHIPPED 2026-07-23.** `+` glyph on each card's margin line.
The viewer's first write ever: `getSigner()` (NIP-07-or-mint — the minted
key is a hand-rolled BIP-340 schnorr signer verified in-page against the
official test vectors), publish kind-7 over the already-open relay sockets,
honest OK tally inline, then the birth-certificate popup on first relay
accept. The unsaved-key chip counts every event riding on an unsaved minted
key; "I saved it" quiets it. The manifesto sentence got its honest
amendment. Write code lives in its own section, apart from render code.
Cards only — comment tap targets arrive with the ladder in 2c.

**2c — the unlock. SHIPPED 2026-07-23.** The compose box rides at the bottom
of each card's comment thread, ghosted (visible but inert) until this identity
has reacted to the card — the ladder shown by behavior, not copy. Same NIP-22
tag shape as the proven test comment, same signer, same OK tally beside the
send button. The commenter's gate-glyph rides before their name as context —
a `−`-gated comment reads as dispute, a `+`-gated one as support, with zero
comment-type machinery. Ships with two agreed amendments: the 2b tap button
and the glyph tally fused into ONE pill (count inside, filled when yours is
in it — the lone `+` didn't read as a reaction), and comments got their own
small pills (plain `#e` reactions, the targets the ladder needed). Drafts
survive live re-renders; the caret is restored mid-typing.

## Held loosely (decide when there's real charge to learn from)

- Vocabulary growth: when (if ever) `=` and `−` join `+`.
- Whether net-negative comments drop behind a second click ("1 below
  threshold — show anyway"). Nothing is ever deleted — just higher resistance.
- Preview: top-charged comment as a one-liner beside the collapsed
  `◦ N comments` count?
- Exact popup copy and how hard to push key-saving.
- NIP-46 bunker connect for mobile key-holders (parked, v2).

## Constraints inherited (don't relitigate)

- Single self-contained `index.html`, zero deps. The schnorr signer for
  minting (~15 KB inlined) will be the only library ever added.
- Colorblind-safe: meaning by shape/label/lightness, never hue alone.
- **Cards stay read-only forever.** Only reactions and comments ever write.
- No pubkeys in the repo.
- Kind-7 tags per NIP-25: lowercase `e`/`p`/`k` (+ `a` for cards); check a
  real Damus like before adding NIP-22-style uppercase scope tags.
- Single writer on `index.html`: `git fetch` + diff before editing.

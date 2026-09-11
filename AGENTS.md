# AGENTS.md — who does what in this repo

Read this before touching anything. Codex reads it natively; `CLAUDE.md` opens with it.

## Roles

| Role | Who | Writes | Reads |
|---|---|---|---|
| CEO | the human owner | specs, decisions | everything |
| Lead | the Claude Code session that opens the repo | `main`, merges, task split, `AGENTS.md`, `CLAUDE.md` | everything |
| Builder A | Codex (`codex exec`), branch `codex/<task>`, own worktree | code on its branch, only the files the task names | this file, the task, the specs |
| Builder B | Claude Code on Ollama cloud, branch `ollama/<task>` (unverified on this machine) | same as A | same as A |
| Grunt | local Ollama model | `review.md`, untracked, deleted after the lead reads it | one file or one diff |
| Hands | Haiku subagents inside a session | nothing durable | what the lead hands them |

Specs = `NIP-DRAFT.md`, `NIP-DRAFT-ACTS.md`, `NIP-DRAFT-NOTARY.md`, `CONVENTION.md`,
`DESIGN-MODULAR-ACCEPTANCE.md`.

## Hard rules

1. **Specs are CEO-only.** The lead proposes in chat and edits only on a yes. Builders never.
   Default: bend the code, not the spec. A builder who thinks the spec is wrong says so in the
   commit body and keeps building to spec.
2. **The task names the files.** A builder claims nothing. Needing a file outside the task
   means stop and report, not touch it.
3. **Branch per task, prefix = role.** `codex/`, `ollama/`, `haiku/`, `sonnet/`, `opus/`.
   The prefix picks the relay identity. No prefix means lead.
4. **`main` is lead-only.** Builders never commit to or merge into main.
5. **No PII.** Author is the GitHub noreply id. No nostr pubkeys, no absolute home paths,
   in files or history.
6. **The commit body is the record.** Subject = what. Body = why, and what was left undone.
   A hook publishes it verbatim. Nothing else is a log: no issues, no TASKS.md.
7. **The second client is built blind.** Whoever writes the independent reducer works from
   `NIP-DRAFT-ACTS.md` only and does not open `lib/fold-8828.mjs`.
8. **Tests before "done."** `node --test 'test/*.test.mjs'` (a bare `test/` dir is not accepted by this node). Browser tests need Chrome and are lead-only.
9. **Grunts have no keys.** A grunt finding enters the record only through the lead's commit body.

## The record

Two timelines on the lab relay, written by git hooks, read in the viewer.

- **Work**: one card per commit, the lead's act when it reaches main.
- **Org**: every commit that touches this file is also submitted to a second, org timeline.
  Same card, two submissions. The lead acts on it like any other. A process change that
  is only in chat is not settled; it is settled when its commit lands on main.

## Settled (append-only, dated)

- 2026-08-28 Membership is `a 30829:` and nothing else. Writers mint notaries.
- 2026-09-04 Kind 8828 has six registers. `passes` gone, gate switch gone.
- 2026-09-10 Precision is the range. Year and month picks widen to a closed span. No placeholder day.
- 2026-09-10 The tracker is the relay via git hooks. No issues, no TASKS.md.
- 2026-09-10 Specs are CEO-only. Grunts have no keys. Process changes get their own timeline.

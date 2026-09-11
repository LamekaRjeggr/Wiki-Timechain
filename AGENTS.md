# AGENTS.md — who does what in this repo

Read this before touching anything. Codex reads it natively; `CLAUDE.md` opens with it.

## Roles

| Role | Who | Writes | Reads |
|---|---|---|---|
| CEO | the human owner | specs, decisions | everything |
| Lead | the Claude Code session that opens the repo | `main`, merges, task split, `AGENTS.md`, `CLAUDE.md` | everything |
| Builder A | Codex, branch `codex/<task>`, own worktree | code on its branch, only the files the task names | this file, the task, the specs |
| Builder B | Claude Code on Ollama cloud, branch `ollama/<task>` (unverified on this machine) | same as A | same as A |
| Scout | `qwen2.5-coder-64k:7b` on local Ollama | `SCOUT-<task>.md`, untracked: candidate files + the spec lines that bind; dies when the TASK file is written | branches, keys, verdicts |
| Gatekeeper | the other house: Sonnet reviews a `codex/` branch, Codex reviews a Claude branch; never the builder's session | `## Review round N` in the TASK file: verdict `merge` or `again`, plus findings | edits, merges, main |
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
   The prefix picks the relay identity. No prefix means lead. A builder works in its own
   worktree, `../wiki-timechain-<task>`, cut from main.
4. **`main` is lead-only.** Builders never commit to or merge into main.
5. **No PII.** Author is the GitHub noreply id. No nostr pubkeys, no absolute home paths,
   in files or history.
6. **The commit body is the record.** Subject = what. Body = why, and what was left undone.
   A hook publishes it verbatim, so write it with real newlines (`git commit -F`), never an
   escaped string. Nothing else is a log: no issues, no TASKS.md.
7. **The second client is built blind.** Whoever writes the independent reducer works from
   `NIP-DRAFT-ACTS.md` only and does not open `lib/fold-8828.mjs`.
8. **Tests before "done."** `node --test 'test/*.test.mjs'` (a bare `test/` dir is not accepted by this node). Browser tests need Chrome and are lead-only.
9. **Grunts have no keys.** A grunt finding enters the record only through the lead's commit body.
10. **Three rounds, then the lead decides.** A task gets at most three review rounds. On `merge`
   the lead merges. On `again` the builder reruns on the appended TASK file. After round 3 without
   `merge` the lead either takes the branch over or deletes it; either way the commit body on main
   says which and why. A branch is never left open past round 3.

## Dispatching a builder

The task is an untracked `TASK-<task>.md` in the builder's worktree: goal, the files it may
touch, the spec lines that bind it, done-when, and a header line `effort: low|medium|high`.
Effort is a dial on the builder, not a role. A Scout pass may precede the TASK file and feeds it. Review rounds are appended to the same file as
`## Review round N` and the builder is run again on it. The file dies with the worktree.

Builder A launch, from inside the worktree (Codex 0.154):

```
codex exec -m gpt-5.6-sol -c model_reasoning_effort=low --approve-for-me "Read AGENTS.md, then do TASK-<task>.md" < /dev/null
```

`< /dev/null` or it stalls on stdin. `-s` and `--full-auto` do not combine with `--approve-for-me`.
The user's `~/.claude/settings.json` has a narrow `autoMode.allow` exception for this sandboxed,
automatically reviewed launch. Auto mode may dispatch it directly; approval- or sandbox-disabling
Codex flags remain outside that exception.

## Scout, before the TASK file

From the repo root. Output is a draft; the lead prunes it into the TASK file and the draft dies.

```
{ echo "You are a Scout. Read-only. Output ONLY: (1) candidate files a builder would touch, (2) the spec headings that bind the task. Under 120 words."; echo "TASK: <one sentence>"; echo FILES:; git ls-files; echo "SPEC HEADINGS:"; grep -n '^#' NIP-DRAFT*.md CONVENTION.md; } | ollama run qwen2.5-coder-64k:7b --nowordwrap > SCOUT-<task>.md
```

## Gatekeeper, after the builder stops

From inside the builder's worktree. The diff goes to an untracked file first; neither reviewer
takes it on stdin. The prompt comes before the flags: `--allowedTools` is variadic and eats it otherwise. The verdict appends to the TASK file; the lead reads it and applies rule 10.
Round number N is the lead's count.

```
git diff main...HEAD > DIFF-<task>
claude -p "Read AGENTS.md, TASK-<task>.md and DIFF-<task>. Review the diff against the task's done-when, the spec lines it names, and test/*.test.mjs. Do not edit anything. Output exactly one section starting '## Review round N' whose first line is 'verdict: merge' or 'verdict: again', then findings as bullets, each naming file:line. Under 300 words." --model sonnet --allowedTools "Read,Grep,Glob" < /dev/null >> TASK-<task>.md
```

For a Claude-built branch swap the reviewer for
`codex exec -s read-only -m gpt-5.6-sol -c model_reasoning_effort=medium "<same prompt>" < /dev/null`.
`-s read-only` is what stops it editing; it is outside the auto-mode exception, so the lead gets prompted.
`DIFF-<task>` dies with the worktree.

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
- 2026-09-10 Scout and Gatekeeper added. Three review rounds, then the lead takes over or kills the branch.
- 2026-09-10 Scout is qwen2.5-coder-64k:7b. Gatekeeper is the other house from the builder.

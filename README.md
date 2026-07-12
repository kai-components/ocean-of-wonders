# Ocean of wonders

*Conversation snapshots for [Claude Code](https://code.claude.com).*

Dehydrate a conversation into a snapshot — a plain Markdown file — which can be rehydrated in a later session to pick the work back up where it left off.
And should a conversation reach a unique, interesting state — irreproducible by nature — a snapshot can preserve it. It can then be reused or shared.

Every snapshot joins the ocean — a local, per-project store where they accumulate side by side, none overwriting another.

## Install

```
/plugin marketplace add kai-components/marketplace
/plugin install ocean@kai-components
```

## Commands

| Command | What it does |
|---|---|
| `/ocean:dehydrate [title]` | Snapshot the current conversation. The title is optional — one is generated from the work if omitted. |
| `/ocean:rehydrate [name]` | Pick a snapshot and continue its work. With no argument, shows the most recent live heads. |
| `/ocean:describe [name \| clean]` | Inspect the snapshot store — everything, or one lineage. `clean` prunes the ephemeral session registry. |

A typical cycle:

```
/ocean:dehydrate Payment flow refactor — provider abstraction done, webhooks next
… (new session, days later) …
/ocean:rehydrate payment
```

## Where snapshots live

Snapshots are plain Markdown files, stored per project under the plugin's data directory (`~/.claude/plugins/data/ocean/<project>/`). Nothing is ever written inside your repository. Set the `OCEAN_DIR` environment variable to relocate the store anywhere you like.

## How the store stays navigable

As snapshots accumulate, ocean keeps the store organized for you — today, through an automatic genealogy: every snapshot records the snapshot its session was restored from, so successive saves connect into a family tree.

```
▲ 2026-07-01 · Payment flow refactor
└─ ○ 2026-07-03 · Webhook handling and retries
   └─ ● 2026-07-05 · Provider failover edge cases
```

`▲` root · `○` node · `●` leaf. Leaves are the live heads of your work — what `/ocean:rehydrate` offers first, so you resume from where things actually stand instead of reopening a superseded stop along the way.

This is a navigation aid, not the point of the plugin: the snapshots themselves are self-contained files, useful with or without it.

## What ocean is not

- **Not a code checkpoint.** A snapshot captures the conversation, not your files — git and `/rewind` cover the code.
- **Not a transcript.** It is the distilled state of the work, not the full log of the session that produced it.
- **Not long-term memory.** A snapshot is the state of one piece of work at one moment, restored on request — not knowledge that follows you across every session.

## Design notes

- **Plain files.** Snapshots are readable, greppable, diffable Markdown. No database, no lock-in — the store is just a folder.
- **Deterministic mechanics, model-authored content.** A small Node script (no dependencies, Node ≥ 18 — already shipped with Claude Code) handles naming, collision, parenting, and tree rendering; the model only writes the snapshot's title and body.
- **Zero permission prompts.** All store I/O — listing, reading, writing — flows through the bundled `ocean` command, pre-approved by the skills that use it. Install and go.

For the full design rationale and decision log, see [DESIGN.md](DESIGN.md).

## Credits

Created and maintained by [Massimo Santoli](https://github.com/santoli-massimo). Part of [kAI Components](https://github.com/kai-components).

Adapted from the [handoff skill](https://github.com/mattpocock/skills) by Matt Pocock (`skills/productivity/handoff`) — split into dehydrate/rehydrate, reworked around a deterministic script and a persistent per-project store, and grown a genealogy tree.
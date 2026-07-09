# ocean

Conversation snapshots for [Claude Code](https://code.claude.com): dehydrate a session into a snapshot, rehydrate it later in a fresh session, and browse the genealogy tree that connects them.

Long conversations end — context windows fill up, sessions get closed, work gets interrupted. **ocean** lets you freeze the state of a conversation (what happened, where things stand, what's next) into a snapshot file, and restore it in any future session as if you were picking the work back up mid-stride. Restored sessions remember which snapshot they came from, so successive snapshots form a family tree of your work.

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
| `/ocean:describe [name \| clean]` | Inspect the snapshot tree — the whole forest, or one lineage. `clean` prunes the ephemeral session registry. |

A typical cycle:

```
/ocean:dehydrate Payment flow refactor — provider abstraction done, webhooks next
… (new session, days later) …
/ocean:rehydrate payment
```

## The genealogy tree

Every snapshot records its parent — the snapshot the session was restored from. Over time this draws a tree:

```
▲ 2026-07-01 · Payment flow refactor
└─ ○ 2026-07-03 · Webhook handling and retries
   └─ ● 2026-07-05 · Provider failover edge cases
```

`▲` root · `○` node · `●` leaf. Leaves are the live heads of your work — the natural places to resume from, and what `/ocean:rehydrate` offers first.

## Where snapshots live

Snapshots are plain Markdown files, stored per project under the plugin's data directory (`~/.claude/plugins/data/ocean/<project>/`). Nothing is ever written inside your repository. Set the `OCEAN_DIR` environment variable to relocate the store anywhere you like.

## Design notes

- **Zero permission prompts.** All store I/O — listing, reading, writing — flows through the bundled `ocean` command, pre-approved by the skills that use it. Install and go.
- **Deterministic mechanics, model-authored content.** A small Node script (no dependencies, Node ≥ 18 — already shipped with Claude Code) handles naming, collision, parenting, and tree rendering; the model only writes the snapshot's title and body.
- **Plain files.** Snapshots are readable, greppable, diffable Markdown. No database, no lock-in — the store is just a folder.

For the full design rationale and decision log, see [DESIGN.md](DESIGN.md).

## Credits

Created and maintained by [Massimo Santoli](https://github.com/santoli-massimo). Part of [kAI Components](https://github.com/kai-components).

Adapted from the [handoff skill](https://github.com/mattpocock/skills) by Matt Pocock (`skills/productivity/handoff`) — split into dehydrate/rehydrate, reworked around a deterministic script and a persistent per-project store, and grown a genealogy tree.
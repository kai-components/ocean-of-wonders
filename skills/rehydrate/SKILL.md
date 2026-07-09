---
name: rehydrate
description: Restore a previously saved conversation snapshot and continue its work. Explicit command only — /ocean:rehydrate [name or date, optional; empty lists all]. Snapshots are created with /ocean:dehydrate.
argument-hint: "name/date of a snapshot to restore (optional — empty lists all)"
disable-model-invocation: true
allowed-tools: "Bash(ocean *)"
---

# /ocean:rehydrate — restore a snapshot

`ocean` does the mechanics (resolve, discover, tree rendering, registry); this skill picks a snapshot and continues its work.

## Steps

1. **Discover.** Run `ocean discover $ARGUMENTS --limit 3`.
If `leaves` is empty → tell the user there are none and stop.
2. **Pick the snapshot.** if `shortcut.matched` → the chosen snapshot is `shortcut.file`;
else ask with AskUserQuestion (single select), always (even with a single leaf):
   - Options = the `leaves`, strings used verbatim: `label` = `date · title` (shortened if long), `description` = the full `title`, `preview` = the leaf's `neighbourhood`.
   - 4th option "Show all" → print `forest`. The user then resumes with `/ocean:rehydrate <name>` to open any node.
   - In chat, once: `Legend: ▲ root · ○ node · ● leaf`.
3. **Record & resume.** Record the pointer if an `ocean session_id` was injected at session start: `ocean record <session_id> <chosen_file> <today>` (`<today>` from `currentDate`).
Then print the chosen snapshot with `ocean show <chosen_file>` and continue the work it describes, invoking any skills it suggests.
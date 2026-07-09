---
name: describe
description: Inspect and maintain the ocean snapshot store for this project. Read-only tree view by default; `clean` prunes the ephemeral registry. Explicit command only. /ocean:describe [name/date/slug to trace | clean].
argument-hint: "empty = whole tree · name/date/slug = that lineage · clean = prune registry"
disable-model-invocation: true
allowed-tools: "Bash(ocean *)"
---

# /ocean:describe — snapshot store hub

`ocean` does the mechanics (resolve, discover, tree rendering, registry); this skill inspects the tree or prunes the registry.

## Modes (by argument)

- **no argument** → `ocean discover`; print its `forest` field.
- **name/date/slug** → `ocean discover <arg>`. `shortcut.matched` → print `shortcut.lineage`. `matched:false` → say so, print `forest`.
- **`clean`** → prune the ephemeral registry (never the snapshot files):
  1. `ocean clean --today <today>` (`<today>` from `currentDate`). `staleCount:0` → tell the user it's already clean (`total`, `oldest`), stop.
  2. Ask with AskUserQuestion, showing `total`/`staleCount`/`oldest`:
     - **Yes** → `ocean clean --today <today> --prune`; confirm `removed`/`remaining`.
     - **No** → nothing.
     - **More details** → show the `stale` rows, then ask again.

Print every tree verbatim.
---
name: dehydrate
description: Dehydrate the current conversation into a snapshot another session can later restore with /ocean:rehydrate. Explicit command only — /ocean:dehydrate [title shown in the restore list].
argument-hint: "title for the snapshot, shown in the /ocean:rehydrate list (optional)"
disable-model-invocation: true
allowed-tools: "Bash(ocean *)"
---

# /ocean:dehydrate — snapshot this conversation

`ocean dehydrate` does the mechanics (naming, collision, file, registry) in one call; this skill authors the content — title and body.

## Steps

1. **Title.** `$ARGUMENTS` present → verbatim. Absent → generate a full phrase (~10–20 words) from the work.

2. **Body** — no H1, no `---` frontmatter (the script prepends them). Include:
   - what happened, current state, open threads / resume points
   - references not copies (PRDs, plans, ADRs, issues, commits, diffs by path/URL)
   - a "suggested skills" section (what the next session should invoke)
   - redact secrets

3. **Hand off.** `--session` = the `ocean session_id` injected at session start (absent → `-`, snapshot = root). `<today>` from `currentDate`. Body on stdin:

   ```
   ocean dehydrate --title "<title>" --session <id|-> --today <YYYY-MM-DD> <<'__DEHYDRATE_BODY__'
   <body>
   __DEHYDRATE_BODY__
   ```

   Report the returned `path`.
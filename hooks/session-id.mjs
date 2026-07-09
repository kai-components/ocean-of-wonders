#!/usr/bin/env node
// SessionStart hook: inject this session's id so the ocean skills can thread snapshot genealogy (parent -> child).
import { readFileSync } from "node:fs";
let sid = null;
try { sid = JSON.parse(readFileSync(0, "utf8")).session_id ?? null; } catch {}
if (sid) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: `ocean session_id: ${sid} — used only by /ocean:dehydrate and /ocean:rehydrate to link snapshots (parent → child). Ignore unless running those commands.`
    }
  }));
}
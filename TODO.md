# ocean — TODO / note sporche

Annotazioni provvisorie. Ciò che matura → `DESIGN.md`, ciò che muore → cancella.

## Da verificare
- `/rewind`: conia nuovo `session_id` o lo mantiene? (interattivo, worst-case = radice benigna).
- Resa visiva del grassetto markdown nel box `preview` di `/ocean:rehydrate` (il TUI lo rende bold?).

## Dipendenze fragili
- L'heredoc di `/ocean:dehydrate` passa perché il guard Bash utente (`bash-atomic-guard.sh`) non blocca `<<` verso comandi allowlistati. Se il guard si estende, tenerne conto (eventuale commento nel guard: "non toccare `<<` verso ocean").

## Deferred (dal design)
- `clean` esteso ai FILE snapshot (archivia casati morti in `<store>/archive/`, reversibile; o cancellazione con dry-run). Oggi tocca solo il registro, 30gg fissi.
- Lignaggio cross-worktree: key ancorata al git-common-dir (oggi git-root → worktree = store separati). Solo se si usano i worktree.
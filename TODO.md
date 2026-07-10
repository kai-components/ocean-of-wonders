# ocean — TODO / note sporche

Annotazioni provvisorie. Ciò che matura → `DESIGN.md`, ciò che muore → cancella.

## Da verificare
- `/rewind`: conia nuovo `session_id` o lo mantiene? (interattivo, worst-case = radice benigna).
- Resa visiva del grassetto markdown nel box `preview` di `/ocean:rehydrate` (il TUI lo rende bold?).

## Dipendenze fragili
- L'heredoc di `/ocean:dehydrate` passa perché il guard Bash utente (`bash-atomic-guard.sh`) non blocca `<<` verso comandi allowlistati. Se il guard si estende, tenerne conto (eventuale commento nel guard: "non toccare `<<` verso ocean").

## Dal giro identità (2026-07-10)
- Rework README sul testo canonico d'identità (DESIGN.md → "Identità"): tradurre in inglese, ristrutturare per pattern, confronto esplicito con `--continue`/`--resume`, albero retrocesso a "organizzazione dello store". Candidato flavor: "an ocean of wonders" come pennellata nel paragrafo degli stati unici (NON come nome).
- Sottocomando `import`: prende un file snapshot esterno, valida, copia nello store con naming corretto e parent azzerato (→ radice). Abilita il passaggio di mano.
- Innesto (iniettare uno snapshot come contesto/behaviour senza adottarne il task): sessione di design dedicata — semantica d'iniezione, cosa cattura un dehydrate "per innesto", rapporto con le skill (dimostrazione vs istruzione, possibile filiera snapshot→skill).

## Deferred (dal design)
- `clean` esteso ai FILE snapshot (archivia casati morti in `<store>/archive/`, reversibile; o cancellazione con dry-run). Oggi tocca solo il registro, 30gg fissi.
- Lignaggio cross-worktree: key ancorata al git-common-dir (oggi git-root → worktree = store separati). Solo se si usano i worktree.
# ocean — DESIGN

Design e razionale del sistema di snapshot di conversazione. Documento di manutenzione: non caricato a runtime, non linkato dagli SKILL.md. Erede diretto del cluster di skill user-level "warehouse" (grill 2026-06-30/07-01 + refactor successivi), pluginizzato come `ocean` il 2026-07-09.

## Cosa fa

Tre skill thin attorno a un unico script deterministico (`bin/ocean`):

- `/ocean:dehydrate` — essicca la conversazione viva in uno snapshot markdown.
- `/ocean:rehydrate` — sceglie uno snapshot e ne continua il lavoro in una sessione fresca.
- `/ocean:describe` — ispeziona l'albero (read-only) o pulisce il registro.

Gli snapshot non sono piatti: ognuno registra il **padre** da cui è stato reidratato → emerge un albero (genealogia).

## Identità (testo canonico, 2026-07-10)

Registro: descrizione sobria, impersonale — niente claim, niente "tu". Fonte per README e descrizione marketplace (traduzione inglese da fare al rework del README).

> ocean disidrata una conversazione in uno snapshot, che può essere reidratato in una sessione successiva per riprendere il lavoro da dove era rimasto. Questo permette, tra l'altro, di portare avanti più fronti di lavoro in parallelo senza perdere lo stato di alcuno.
>
> Inoltre, quando una conversazione raggiunge uno stato unico e interessante, per sua natura irriproducibile, uno snapshot consente di conservarlo ed eventualmente condividerlo con altri.

Casi d'uso vagliati (2026-07-10): cantieri paralleli (eroe), replay come fixture di test (A/B, regression comportamentale), passaggio di mano (abilitare con un sottocomando `import`), innesto di behaviour su sessione esistente (direzione futura, da progettare — non promessa nei testi pubblici). Scartato: checkpoint assicurativo (lo snapshot non contiene lo stato del codice; coperto da git + /rewind).

## Gerarchia di valore

Il core del plugin è la coppia **dehydrate/rehydrate col menu di scelta**: congelare uno stato, riprenderlo. La genealogia è **marginale**: uno strato di organizzazione dello store al servizio del menu, sostituibile (tag, directory virtuali, gruppi manuali) o rimovibile senza perdere il valore del plugin. Nessuna decisione sul core si giustifica "per servire l'albero".

## Filosofia dello strato genealogia

Il flusso reale dell'utente è una **catena**: `rehydrate A → lavori → dehydrate B → rehydrate B → dehydrate C …`. B continua A, C continua B. Senza registrare questa parentela la lista di `/ocean:rehydrate` è piatta: A/B/C allo stesso livello, rischi di riaprire una tappa morta invece della testa viva, il magazzino si affolla di intermedi indistinguibili.

Requisito dello strato, finché esiste: la genealogia è **automatica** (l'utente non la dichiara).

Divisione dei ruoli, invariante in tutto il sistema: **il modello decide il contenuto (giudizio), lo script fa la meccanica (deterministica).** Il modello non ridisegna mai l'albero: lo script consegna testo pre-renderizzato.

## Architettura

- `bin/ocean` (Node, solo stdlib, baseline 18) regge TUTTA la meccanica. Sottocomandi: `discover`, `show`, `dehydrate`, `record`, `clean`.
- Gli SKILL.md sono sottili: orchestrano scelta/contenuto e delegano allo script. **Nessuno SKILL.md linka questo file** (sarebbe caricarlo a runtime).
- Store per-progetto: `~/.claude/plugins/data/ocean/<key>/` — key = git-root sanitizzata (`[^A-Za-z0-9_-]` → `-`), o cwd fuori da git; override con env `OCEAN_DIR`.
- `show` tiene anche la **lettura** dentro il comando `ocean` → un'unica superficie di permesso; `basename()` confina la lookup nello store (niente path traversal).
- Permessi: gli SKILL.md dichiarano `allowed-tools: "Bash(ocean *)"` → nessuna allow-rule da installare lato utente (morto l'attrito del path hard-coded dell'era warehouse).

**Perché Node e non prosa/sh:** l'esecuzione dello script non consuma contesto, solo il suo output sì → offloadare la meccanica taglia i token, non solo il non-determinismo (confermato sul campo 2026-07-02: SKILL da ~124 a ~45 righe → "velocissima"). `sh` puro è fragile su alberi/date; Node stdlib è garantito (Claude Code gira su Node).

## Meccanismo genealogia — 3 pezzi

1. **Hook del plugin** (`hooks/session-id.mjs`, SessionStart) inietta l'`ocean session_id` nel context al boot. SessionStart rifire su compact/resume → sempre presente.
2. **`/ocean:rehydrate X`** scrive nel registro `S → X` (la sessione S adotta X come padre corrente).
3. **`/ocean:dehydrate` → crea Y**: legge dal registro il padre corrente di S → lo incide nel frontmatter di Y (permanente); poi avanza il registro `S → Y` (il puntatore prosegue → catena).

La genealogia PERMANENTE vive nei file (frontmatter del figlio). Il registro è solo il segnaposto effimero "a cosa è attaccata ORA la sessione S".

## Decisioni consolidate

- **D1 — parentela nel file figlio**, non in un libro mastro esterno: lo snapshot è autosufficiente (sopravvive a registro perso/spostato/condiviso; è ciò che ha reso la migrazione warehouse→ocean un semplice move). La vista costa zero: la discovery scansiona già i file per l'H1, legge il `parent:` nello stesso giro.
- **D2 — padre nel frontmatter YAML** in cima al file (`---\nparent: <filename>\n---`), solo il filename (la discovery ha già la mappa filename→titolo). Retrocompatibile: snapshot senza frontmatter = radici.
- **D3 — registro unico per-progetto**, in `<store>/.ocean-trace.tsv`. Le catene sono intrinsecamente per-progetto; un registro globale darebbe link cross-progetto sbagliati.
- **D4 — registro in UPSERT**: una riga per `session_id`, valore = ultimo snapshot toccato (non append).
- **D5 — catena, non fratelli**: due dehydrate nella stessa sessione → C figlio di B (il puntatore avanza), non entrambi figli di A.
- **D6 — biforcazione gratis dal session_id**: stesso A riaperto da 2 sessioni diverse → 2 righe registro → B e D entrambi figli di A. Discriminante: STESSA sessione → catena; sessione NUOVA che riapre A → ramo.
- **D7 — pulizia MANUALE** via `/ocean:describe clean` (soglia 30gg, tocca SOLO il registro, mai i file). *Storia:* l'auto-pulizia opportunistica è stata rimossa (2026-07-01) perché duplicava la regola 30gg in due skill e potava silenziosamente le catene dormienti; il registro non pesa mai (una riga per sessione grazie all'upsert).
- **D9 — `/ocean:rehydrate` elenca SOLO FOGLIE** (teste vive) nelle 3 opzioni primarie, newest-first. "Show all" = vista foresta di `/ocean:describe`. Una tappa con figli non è un punto di ripresa → non compare, si evita la biforcazione per sbaglio. Riaprire un intermedio (biforcazione volontaria) resta possibile con `/ocean:rehydrate <nome>` esplicito.
- **D10 — hub `/ocean:describe`** (explicit-only): senza arg → foresta intera; con arg → casato intero col nodo `« HERE`; con `clean` → pulizia del solo registro. Trace/casato read-only. *Naming:* nell'era warehouse il hub si chiamava `/warehouse` (prefisso-namespace + azione SUL magazzino); nella pluginizzazione il namespace lo dà il plugin (`ocean:`) e l'azione è `describe`.

## Rendering

Albero testuale, chrome in inglese (header/legenda/hint), titoli nella lingua dell'H1. Identità nodo = data estesa `YYYY-MM-DD` + titolo (mai filename).

Glifi a 3 stati — la TOPOLOGIA, non la vitalità:
- `▲` = radice (senza padre), sempre, anche se isolata. Il triangolo pieno è riservato IN ESCLUSIVA alla radice → i marcatori di selezione usano `«`, mai `◀` (confonderebbe).
- `○` = ha padre e ha figli (tappa superata).
- `●` = ha padre e non ha figli (foglia).

Niente badge di stato per riga (rumore su foresta piatta: glifo + struttura dicono già tutto). Solo legenda in fondo + riga di ripresa. Unico marcatore superstite: evidenziazione del nodo target — `« HERE` nel lineage di `/ocean:describe <arg>`, `« SELECTED` nella preview di `/ocean:rehydrate`.

Preview di `/ocean:rehydrate` (AskUserQuestion, 3 foglie recenti): `description` = titolo; `preview` = vicinato locale (padre + fratelli + corrente, non figli — una foglia non ne ha). I fratelli mostrano le biforcazioni parallele.

## Registro — formato

- File `<store>/.ocean-trace.tsv`. Prefisso `.` → fuori dal glob `dehydrated-*.md`. Separatore TAB (i filename contengono trattini e date ma mai tab → parsing non ambiguo).
- Riga: `<session_id>\t<parent_filename>\t<YYYY-MM-DD>`. La data serve solo alla pulizia per età (granularità giorno), presa dal context `currentDate` (non dall'hook).

## session_id — fatti verificati (non ri-ricercare)

- L'hook JSON include `session_id` (+ `source` ∈ startup|resume|clear|compact). Id STABILE per la vita della sessione: sopravvive a compaction e resume; cambia SOLO con `/clear`, `--fork-session`, `/branch`.
- `claude -c --agent X` **mantiene** il session_id (verificato empiricamente 2026-07-01: S1==S2). Tecnica di sonda: `claude -p --output-format json` espone il session_id nel result.
- Nessuno store di metadati di sessione nativo per le skill → un file indicizzato per session_id è l'unica via robusta.
- UUIDv4 mai riciclati → righe vecchie del registro non collidono mai.
- **Nelle skill del cluster: mai citare il wording letterale della riga iniettata dall'hook** — accoppia la skill al testo dell'hook: se l'hook cambia frase, il riferimento muore. Riferirsi al dato ("the `ocean session_id` injected at session start"). Deciso 2026-07-03; due agent freschi l'hanno mancato in revisione — senza questa riga la decisione viveva solo in conversazione.

Casi di rottura del session_id → tutti degradano a **radice** (benigni, mai link sbagliato): `/clear`, `--fork-session`, `/branch` coniano nuovo id; `/cd` cross-progetto sposta lo store (radice = corretto, catene per-progetto). Worktree dello stesso repo → git-root diverse → store separati → lignaggi separati (auto-consistente).

## Decisione — come `/ocean:dehydrate` consegna il corpo allo script (2026-07-02)

Il nodo: il modello autora il corpo (giudizio), lo script deve scriverlo con nome+padre+registro (meccanica). Come passa il testo lungo allo script?

**Scelto: heredoc su stdin, un'unica chiamata.** `ocean dehydrate --title … --session … --today … <<'__DEHYDRATE_BODY__' … __DEHYDRATE_BODY__`. Lo script legge lo stdin e fa TUTTO in un colpo (nome, collisione, padre, scrittura file, upsert registro), restituendo `{ok, path, file, parent}`.

Perché, e alternative scartate:
- **Atomicità.** Un colpo o niente → nessuno stato intermedio (file senza record, o registro che punta a un file inesistente). È il vantaggio dirimente.
- **Una sola superficie di permesso.** Il file lo scrive Node dentro lo script. L'alternativa "script dà il path, il modello scrive col tool nativo" richiedeva due permessi e 3 passi non atomici.
- **Il quoting non è un problema:** delimitatore quotato `<<'…'` → corpo letterale, nessun escape di apici/`$`/backtick. Delimitatore raro → collisione praticamente nulla.
- **Timori caduti ai test (2026-07-02):** l'heredoc verso un comando allowlistato fila liscio (il prompt è governato dalla allow-rule, non da un blocco nativo dell'harness); e il file lo scrive Node, non la shell, quindi la regola tool-nativi non si applica.
- **Residuo noto:** il corpo transita nel testo del comando (blob nel transcript) — solo estetica. E la dipendenza dal guard che non blocca `<<` → vedi `TODO.md`.

## Storia

- **2026-07-01** — nasce il cluster warehouse (hook +session_id; skill `dehydrate`, `rehydrate`, `warehouse`). Refactor da dogfooding: discovery da loop per-file a passata aggregata; registro fuori dal percorso critico; hub.
- **2026-07-02** — meccanica estratta da prosa a script Node (`warehouse.mjs`); skill rese sottili.
- **2026-07-09** — pluginizzazione: `bin/ocean` erede di `warehouse.mjs` (+ `show`, output pre-renderizzato: `forest`, `neighbourhood`, `lineage`), skill rinominate nel namespace `ocean:`, hook proprio del plugin, store al plugin data dir. Snapshot migrati fisicamente dai vecchi store (`~/.ai-framework/<key>/warehouse/`) con genealogia intatta — il `parent:` referenzia filename, non path (D1/D2). Vecchio cluster user-level ritirato.
# Architecture

## Overview

`dsh-mask` anonymizes PII at the model boundary: it rewrites the messages that enter a step so that phones, emails, ID cards, bank cards, keys, and IPs become `<TYPE_N>` placeholders, and it keeps a `placeholder → original` restore table host-side so those placeholders stay reversible. The restore surface this form ships is the `/mask restore <text>` command plus the exported `RestoreStore` seam; automatically mapping placeholders back in the client UI is the browser half this pure-host form does not ship (see `README.md` Known limitations). The hard invariant is that **the plaintext never enters the session log** — the masked form is what gets logged and sent to the model, so model-visible content reconstructs from the log in placeholder form. That invariant also governs the reveal direction: a command's result text is logged verbatim, so `/mask restore` delivers the restored plaintext as a controlled file and its result carries only the path and the placeholder names (see "Restore delivery").

## Roles

- **Consumes public services only**: `commands` (hard `inject`); `storageDomain` (optional `ctx.get` — missing means a memory-only restore table with a one-time warning); `tools` (registered via `ctx.inject(['tools'], …)` when present). The masking seam is the `agent/pre-step` waterfall.
- **`lib/` is zero-DSH-dependency**: services are wired only at the boundary in `index.mjs`; `lib/` depends only on `node:` built-ins (the single sanctioned exception is `lib/domain.mjs`, which imports `zod` and `@deepseek-ai/dsh-storage-domain` because the domain record schema is a persistence-boundary validator).

## Module map

| Module | Responsibility |
|---|---|
| `index.mjs` | The single host face: `Config` schema + `resolveConfig`, `probeIgnorableAppend`, the `agent/pre-step` masking listener, the `/mask` command handler, the `mask_test` tool factory, `apply()` |
| `lib/constants.mjs` | Vocabulary + protocol constants (entity names/labels, modes, scopes, error codes, defaults, bounds) — zero dependency |
| `lib/errors.mjs` | Structured domain errors (`MaskError` with stable `code` + `details`) |
| `lib/strip.mjs` | The regex PII detector (`regexDetect`), the pluggable-detector `Stripper` (strip/stripInto/restore/mapping/stats/loadMapping), and `createStripper` — zero dependency |
| `lib/mask.mjs` | Message masking: rewrite `UserMessage` text blocks through a `Stripper` — zero dependency |
| `lib/sanitize.mjs` | Pure display/log redaction (PII entities, secrets, URL credentials, mapping summarization) |
| `lib/gate.mjs` | Session-event adaptive gate (append only when the host records the type or supports `ignorable`) |
| `lib/store.mjs` | The restore table: per-session `Stripper` in memory + optional persistence to `storageDomain` |
| `lib/deliver.mjs` | Restore-result delivery: the controlled plaintext file (one per session, `0700`/`0600`, symlink and ownership checks) that keeps the reveal out of the session log — `node:` built-ins only |
| `lib/domain.mjs` | The `dsh-mask` storage-domain spec (`restore` table, zod-validated) |

## Data flow

```text
inbox ──agent/pre-step──▶ maskMessages ──▶ user/message (placeholders) ──▶ model
                                     │
                                     └──▶ RestoreStore (memory + dsh_mask/restore)
response (placeholders) ──restore()──▶ /mask restore ──▶ controlled file (never the log)
```

1. **Mask** — the `agent/pre-step` listener calls `next()` first (waterfall discipline), then rewrites the returned decision's messages through the session's `Stripper`. The masked messages are what the loop appends as `user/message`, so the log and the model both see placeholders.
2. **Record** — the `Stripper` accumulates the mapping and counts in memory; `store.persist(sessionId)` writes the mapping to `dsh_mask/restore` (best-effort, when `persistRestoreTable: true`).
3. **Restore** — `/mask restore` (and a future client half) call `store.restore(sessionId, text)`, which unmaps placeholders using the in-memory mapping or reloads it from the domain. The command handler uses `store.restoreDetailed` so it can report which placeholders matched, then hands the plaintext to `lib/deliver.mjs` instead of returning it.

## Restore delivery (why the reveal is a file)

The host gives a command handler no way to show text to the user without also logging it:

- `@deepseek-ai/dsh-commands`'s `execute()` appends `command/done` with the handler's **verbatim** `result.text` (`packages/interaction/commands/src/index.ts`, typed as verbatim in its `types.ts`). It is a direct log-only append: no turn wraps it, and it never reaches the model.
- The user-visible command outcome is rendered from **that same event**: the client conversation assembler builds the command node out of `command/run`/`command/done`, and `GenericCommandCard` renders `node.outcome.text`.

So `result.text` is simultaneously the transcript and the persistent log, and the host exposes no "log but do not render" or "render but do not log" switch (`recordInput: false` covers only the input side, `command/run.args`). Returning the restored plaintext there — what this plugin did until 0.2.21 — therefore wrote the PII into the session log on every `/mask restore`, which is exactly what the plugin exists to prevent. Redacting the result instead (running it through `redactText`) would keep the leak closed but leave the user staring at `***` for a command whose only purpose is to reveal the original.

The chosen design keeps both properties: the plaintext goes to a controlled file under `restoreDir` (default `os.tmpdir()/dsh-mask-restore`), and the result text carries only the path and the placeholder names — both non-PII by construction (the path is the config directory plus a fixed prefix plus a hash of the session id; the placeholders are already in the log by design). One file per session means the number of plaintext copies on disk stays bounded, and the result text says so. Delivery failure fails closed: an error result, never a fallback that echoes the plaintext.

The file is deliberately **not** the storage domain's own record: the domain holds the whole session mapping in one JSON record, whereas this file holds exactly the text the user asked to see, at a path the user can open.

## Why `agent/pre-step` and not `agent/request`

The official contract states that `agent/request` is the model-configuration waterfall and **cannot mutate messages**. The extension point that can replace the messages entering a step is `agent/pre-step` (`PreStepDecision = { kind: 'reject' } | { kind: 'enter'; messages }`). Masking there — after `next()`, before the loop appends `user/message` — is exactly the model boundary this plugin needs.

## Detection and overlap resolution

Ported from Pii-Stripper-Middleware's `core.py`:

- Regex patterns for phone, ID card, email, bank card, and IP (plus a `key` detector this repo adds for the spec's "密钥").
- Overlap resolution sorts by start ascending, then score descending, and keeps only non-overlapping spans (first-come, higher score wins at the same position) — an 18-digit ID card beats a 16–19-digit bank-card match.
- Same original value reuses the same placeholder; the counter is monotonic per session so placeholders never collide across turns.

## Detector Provider seam

The detector is a pluggable Provider: `Stripper` and `createStripper` accept an optional `detector: (text) => PIIEntity[]`. When omitted, the built-in `regexDetect` (the ported regex set) runs unchanged, so the zero-dependency default path is untouched. An external recognizer (e.g. NER for `person`/`address`) plugs in by supplying that one function; overlap resolution, placeholder reuse, counting, and restore all stay shared.

## Session events (adaptive gate)

`mask/applied` is declared through `SessionEventMap` declaration merging in `types.d.ts`. At runtime the plugin appends it only when either (a) the host's `KNOWN_SESSION_EVENT_TYPES` already includes the type, or (b) the host `Session.append` supports the `ignorable` envelope (`probeIgnorableAppend`). On `0.1.2-alpha.3` neither is true (verified: alpha.3 append reads only `surfaceOp`/`sourceEventSeqs` and never stamps `ignorable`), so the gate stays closed and appends are skipped — sessions keep loading. The audit payload is counts + type distribution only, never plaintext or the mapping.

## Storage domain

The `dsh_mask` domain has one `restore` table keyed by session id. Its record holds `entries: { placeholder: original }` plus `updatedAt`. This is the only place plaintext PII is stored, and only when `persistRestoreTable: true`; the `Stripper` keeps a bounded in-memory copy (`maxRestoreEntriesPerSession`, `maxSessions` with LRU eviction). `storageDomain` is an optional service: the bundle patch inserts only the `mask` row, so a profile that already composes the storage stack (`web`, via `@deepseek-ai/dsh-web-app`) provides it, while a bare profile without it gets a memory-only restore table (`persistRestoreTable` is a no-op with a one-time warning).

## Safety boundaries

- **Plaintext never enters the session log.** The masked form is logged; originals stay in the restore table. This covers the reveal direction too: the `/mask restore` result text is logged verbatim by the host, so the plaintext is delivered as a controlled file (see "Restore delivery").
- **Sanitize before display/log.** `lib/sanitize.mjs` redacts PII, secrets, and URL credentials before any text reaches the model or log; `mask_test`, `/mask status`, and every `/mask` error path never echo originals.
- **Fail closed.** Unimplemented `mode` (`regex+ner`), `scope` (`tools`), NER-only entities, and out-of-bounds numbers fail loudly at load.
- **Registrations are effects.** The listener, command, tool, and domain close are all Cordis effects, so stop/hot-reload is reversible.

## Reserved seams

- `mode: regex+ner` — external name/address recognition; fails loudly until a recognizer is wired in (the detector Provider seam above is the plug point).
- `scope: tools` — implemented as `tools/post-execute` result-content masking. Tool-argument rewriting is deliberately NOT offered upstream: `tools/pre-execute`'s `PreToolDecision` has no input rewrite because logged/rendered arguments must match what ran, so `tools` scope masks the other model-visible tool surface (the result content) instead of the arguments.
- A browser half would consume the restore table to transparently un-mask assistant bubbles; the host-side restore surface (`/mask restore` + `RestoreStore.restore`) ships, and `maskClientEnabled` (default false) is the key reserved for that browser slot pending live slot-catalog verification. The key is declared in the schema and validated at load, but no runtime code reads it yet, so it has no effect until the browser half ships.
- **A no-argument `/mask restore`** (restore every placeholder of the most recent assistant message) is deliberately not implemented. Two host facts block it: the restore table is a flat per-session `{placeholder: original}` map with **no per-message index**, so "the last assistant message" has to be located in the session event log; and the host deprecated `Session.snapshotEvents()` / `eventAt()` / `ownEvents()` with an explicit "new calls are prohibited" (`deepseek-harness/.agents/notes/implemented/architecture/2026-09-09-deprecate-synchronous-session-event-reads.md`), whose sanctioned alternative — keep a projection incrementally from delivered events — is not available across this plugin's declared host corridor (`>=0.1.2-rc.1`). Offering the form would mean shipping a prohibited synchronous read or a host-version-dependent projection seam, so the form is documented as unavailable and `/mask restore` stays text-only (its error text says so).

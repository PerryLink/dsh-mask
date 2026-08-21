# Architecture

## Overview

`dsh-mask` anonymizes PII at the model boundary: it rewrites the messages that enter a step so that phones, emails, ID cards, bank cards, keys, and IPs become `<TYPE_N>` placeholders, and it keeps a `placeholder → original` restore table so those placeholders can be mapped back at the display layer. The hard invariant is that **the plaintext never enters the session log** — the masked form is what gets logged and sent to the model, so model-visible content reconstructs from the log in placeholder form.

## Roles

- **Consumes public services only**: `commands`, `storageDomain` (hard `inject`); `tools` (registered via `ctx.inject(['tools'], …)` when present). The masking seam is the `agent/pre-step` waterfall.
- **`lib/` is zero-DSH-dependency**: services are wired only at the boundary in `index.mjs`; `lib/` depends only on `node:` built-ins (the single sanctioned exception is `lib/domain.mjs`, which imports `zod` and `@deepseek-ai/dsh-storage-domain` because the domain record schema is a persistence-boundary validator).

## Module map

| Module | Responsibility |
|---|---|
| `index.mjs` | The single host face: `Config` schema + `resolveConfig`, `probeIgnorableAppend`, the `agent/pre-step` masking listener, the `/mask` command handler, the `mask_test` tool factory, `apply()` |
| `lib/constants.mjs` | Vocabulary + protocol constants (entity names/labels, modes, scopes, error codes, defaults, bounds) — zero dependency |
| `lib/errors.mjs` | Structured domain errors (`MaskError` with stable `code` + `details`) |
| `lib/strip.mjs` | The regex PII detector and `Stripper` (strip/stripInto/restore/mapping/stats/loadMapping) — zero dependency |
| `lib/mask.mjs` | Message masking: rewrite `UserMessage` text blocks through a `Stripper` — zero dependency |
| `lib/sanitize.mjs` | Pure display/log redaction (PII entities, secrets, URL credentials, mapping summarization) |
| `lib/gate.mjs` | Session-event adaptive gate (append only when the host records the type or supports `ignorable`) |
| `lib/store.mjs` | The restore table: per-session `Stripper` in memory + optional persistence to `storageDomain` |
| `lib/domain.mjs` | The `dsh-mask` storage-domain spec (`restore` table, zod-validated) |

## Data flow

```text
inbox ──agent/pre-step──▶ maskMessages ──▶ user/message (placeholders) ──▶ model
                                     │
                                     └──▶ RestoreStore (memory + dsh_mask/restore)
response (placeholders) ──restore()──▶ display (originals)
```

1. **Mask** — the `agent/pre-step` listener calls `next()` first (waterfall discipline), then rewrites the returned decision's messages through the session's `Stripper`. The masked messages are what the loop appends as `user/message`, so the log and the model both see placeholders.
2. **Record** — the `Stripper` accumulates the mapping and counts in memory; `store.persist(sessionId)` writes the mapping to `dsh_mask/restore` (best-effort, when `persistRestoreTable: true`).
3. **Restore** — `/mask restore` (and a future client half) call `store.restore(sessionId, text)`, which unmaps placeholders using the in-memory mapping or reloads it from the domain.

## Why `agent/pre-step` and not `agent/request`

The official contract states that `agent/request` is the model-configuration waterfall and **cannot mutate messages**. The extension point that can replace the messages entering a step is `agent/pre-step` (`PreStepDecision = { kind: 'reject' } | { kind: 'enter'; messages }`). Masking there — after `next()`, before the loop appends `user/message` — is exactly the model boundary this plugin needs.

## Detection and overlap resolution

Ported from Pii-Stripper-Middleware's `core.py`:

- Regex patterns for phone, ID card, email, bank card, and IP (plus a `key` detector this repo adds for the spec's "密钥").
- Overlap resolution sorts by start ascending, then score descending, and keeps only non-overlapping spans (first-come, higher score wins at the same position) — an 18-digit ID card beats a 16–19-digit bank-card match.
- Same original value reuses the same placeholder; the counter is monotonic per session so placeholders never collide across turns.

## Session events (adaptive gate)

`mask/applied` is declared through `SessionEventMap` declaration merging in `types.d.ts`. At runtime the plugin appends it only when either (a) the host's `KNOWN_SESSION_EVENT_TYPES` already includes the type, or (b) the host `Session.append` supports the `ignorable` envelope (`probeIgnorableAppend`). On `0.1.0-rc.8` neither is true (verified: rc.8 append reads only `surfaceOp`/`sourceEventSeqs` and never stamps `ignorable`), so the gate stays closed and appends are skipped — sessions keep loading. The audit payload is counts + type distribution only, never plaintext or the mapping.

## Storage domain

The `dsh_mask` domain has one `restore` table keyed by session id. Its record holds `entries: { placeholder: original }` plus `updatedAt`. This is the only place plaintext PII is stored, and only when `persistRestoreTable: true`; the `Stripper` keeps a bounded in-memory copy (`maxRestoreEntriesPerSession`, `maxSessions` with LRU eviction).

## Safety boundaries

- **Plaintext never enters the session log.** The masked form is logged; originals stay in the restore table.
- **Sanitize before display/log.** `lib/sanitize.mjs` redacts PII, secrets, and URL credentials before any text reaches the model or log; `mask_test` and `/mask status` never echo originals.
- **Fail closed.** Unimplemented `mode` (`regex+ner`), `scope` (`tools`), NER-only entities, and out-of-bounds numbers fail loudly at load.
- **Registrations are effects.** The listener, command, tool, and domain close are all Cordis effects, so stop/hot-reload is reversible.

## Reserved seams

- `mode: regex+ner` — external name/address recognition; fails loudly until a recognizer is wired in.
- `scope: tools` — masking tool arguments (`tools/pre-execute`); reserved.
- A browser half would consume the restore table to transparently un-mask assistant bubbles; this pure-host form ships the host-side seam only.

<div align="center">

# dsh-mask

**PII masking middleware for DeepSeek Harness — anonymize personal data before it reaches the model, restore it at the display layer.**

*Phones, emails, ID cards, bank cards, keys, and more become placeholders at the model boundary; the plaintext never enters your session log.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.8` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Platforms | Anywhere DSH runs (pure host, zero-dependency regex; no browser half) |
| Model | Text models fully supported; no extra model capability required |

## What you get

`dsh-mask` anonymizes personal data **at the model boundary** — before a message reaches the model — and keeps a restore table so placeholders can be mapped back to the originals at the display layer:

- **Request-time masking** — `agent/pre-step` messages are rewritten so phones, emails, ID cards, bank cards, keys, and IPs (each opt-in) become `<PHONE_1>`-style placeholders. The masked text is what gets logged and sent to the model.
- **Restore table** — the `placeholder → original` map lives only in memory and a controlled storage domain (`dsh_mask`); the plaintext never enters the session log.
- **Audit, not plaintext** — the `mask/applied` session event records only "replaced N values + type distribution", never the original text or the mapping.
- **`/mask` command** — `status` (counts + distribution), `on`/`off` (runtime toggle), `restore <text>` (unmap placeholders), `help`.
- **`mask_test` tool** — run a snippet through the detector and see the placeholder result; it never reveals the original values.

```text
user message ──agent/pre-step──▶ placeholders ──model──▶ placeholders ──restore──▶ display
                                   ▲                                                    │
                                   └──────── restore table (memory + dsh_mask) ────────┘
```

## Quick start

```sh
# 1. install the bundle into your profile
dsh plugin --profile web add "github:PerryLink/dsh-mask#main"

# or from npm (published releases)
dsh plugin --profile web add dsh-mask

# 2. verify the row mounts
dsh --profile web --dump-config | grep -A2 'id: mask'
```

Then tailor the entity list in your profile patch:

```yaml
- insert:
    - id: mask
      name: dsh-mask
      config:
        entities: [phone, email, id-card, bank-card, key]
```

```
> /mask status
> /mask restore <PHONE_1>
```

## Install & uninstall

- **git channel** (latest `main`): `dsh plugin --profile web add "github:PerryLink/dsh-mask#main"` (equivalent to installing from `git+https://github.com/PerryLink/dsh-mask.git`). No build step — `index.mjs` and `lib/` are the shipped artifacts.
- **npm channel** (published releases): `dsh plugin --profile web add dsh-mask`.
- **tarball channel**: `pnpm pack` in this repo, then `dsh plugin --profile web add ./dsh-mask-<version>.tgz`.
- **uninstall**: `dsh plugin --profile web remove dsh-mask` (or remove the row from the profile patch).

## Configuration

All tunables are Schemastery `Config` fields (changeable from cordis.yml). An id-targeted override replaces the whole row — restate every key you need. `cordis.patch.yml` documents each key inline.

| Key | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Master switch; `false` unregisters the listener, the `/mask` command, and the `mask_test` tool |
| `mode` | `regex` | Detection mode; only `regex` is implemented (`regex+ner` for name/address recognition is reserved and fails loud) |
| `entities` | `[phone, email, id-card, bank-card, key]` | Which PII types to mask; `ip` is also regex-capable (opt-in), `person`/`address` require NER |
| `scope` | `messages` | Masking surface; only `messages` (agent messages) is implemented (`tools` argument masking is reserved) |
| `registerCommand` | `true` | Register the `/mask` command |
| `registerTools` | `true` | Register the `mask_test` tool when the tools service is present |
| `persistRestoreTable` | `true` | Persist the restore table to the controlled `dsh_mask` storage domain (`false` = memory only) |
| `maxRestoreEntriesPerSession` | `500` | Per-session restore entry cap (oldest evicted first) |
| `maxSessions` | `1000` | In-memory session cap (least-recently-used evicted, mapping reloaded on demand) |

Example override in your profile patch:

```yaml
- insert:
    - id: mask
      name: dsh-mask
      config:
        entities: [phone, email, id-card, bank-card, key, ip]
        persistRestoreTable: false
        registerCommand: true
```

## Tools & surfaces

| Surface | Reveals plaintext | Notes |
|---|---|---|
| `agent/pre-step` masking | never | Rewrites messages to placeholders before they are logged or sent to the model |
| `/mask status` | never | Enabled state, total replaced, type distribution |
| `/mask on` / `/mask off` | never | Runtime toggle (resets to `config.enabled` on restart) |
| `/mask restore <text>` | yes (explicit) | Unmaps placeholders back to the values stored for this session |
| `mask_test` | never | Masks a snippet and reports the placeholder result + counts |

## Permissions & data

- **Permissions**: `dsh-mask` performs no network requests and stores no credentials; it only reads the session at the `agent/pre-step` boundary and writes its own `dsh_mask` storage domain. The `dshWorkshop` manifest declares `network:none` and `credentials:none`.
- **Data**: the `placeholder → original` restore table lives in memory and, when `persistRestoreTable: true`, in the controlled `dsh_mask` storage domain — this is the only place plaintext PII is stored, and it is never written to the session log.
- **Session log**: `mask/applied` is declared in `types.d.ts` and appended only when the host records the type (see Known limitations). Its payload is counts + type distribution only.

## Security boundaries

- **Plaintext never enters the session log.** The masked (placeholder) form is what gets logged and sent to the model, so model-visible content is reconstructable from the log in placeholder form; the originals stay in the restore table.
- **Sanitize before display/log.** `lib/sanitize.mjs` redacts PII, secrets, and URL credentials before any text reaches the model or the log; `mask_test` and `/mask status` never echo originals.
- **Controlled restore.** `/mask restore` is the single explicit reveal surface, and it only reads the mapping for the active session.
- **Fail closed.** Unimplemented `mode` (`regex+ner`), `scope` (`tools`), NER-only entities, and out-of-bounds numbers all fail loudly at load.
- **Registrations are effects.** The listener, command, tool, and storage-domain close are all Cordis effects — stop/hot-reload removes them.

## Known limitations

- **Regex only.** Name (`person`) and address (`address`) recognition needs an external NER recognizer, which the pure-host zero-dependency form does not bundle; `mode: regex+ner` and those entities fail loudly at load. The PII types covered out of the box are phone, email, ID card, bank card, key, and (opt-in) IP.
- **Display-layer restore needs a client half.** Masking is fully host-side, but transparently un-masking the assistant bubbles in the client UI is a browser-half feature this pure-host form does not ship; the restore table and `restore()` are the complete host-side seam a client plugin would consume, and `/mask restore` covers interactive needs today.
- **Session events on `0.1.0-rc.8`.** The harness does not yet record `mask/*` event types, and its `Session.append` does not stamp the `ignorable` envelope, so on rc.8 the session-log audit appends are skipped (sessions keep loading); the plugin enables them automatically once a host records the types or supports the `ignorable` envelope.

## Development

```sh
pnpm install                                       # node ^22.19 || >=24
pnpm run typecheck && pnpm run typecheck:ci        # tsc --checkJs against the published rc.8 peers
pnpm test                                          # node --test
pnpm run verify:self-contained                     # dependency specs resolve from the registry
pnpm run verify:artifacts                          # shipped files present + index.mjs importable
pnpm run check:readmes                             # five-language README consistency
pnpm pack                                          # the published tarball
```

There is no build step: pure ESM, `index.mjs` and `lib/` are the shipped artifacts.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creator and maintainer: the regex PII detector ported from Pii-Stripper-Middleware, the `agent/pre-step` masking seam, the restore table, the `/mask` command and `mask_test` tool, and the five-language docs.

## PerryLink DSH Plugin Family

This project is one of the [DeepSeek Harness plugins](https://github.com/PerryLink) maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | Engineering-discipline guard: requirements grill, test gates, adversary review |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | Durable background child agents with a Web UI sidebar, messaging and interrupt |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | LSP diagnostics, formatting, completion, code actions and rename over language servers |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | Claude Code outputStyles-equivalent runtime style switching |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code-style declarative allow/deny/ask permission rules with audit |
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | Second-model auto-review on the approval chain, fail-closed by default |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | Security-audit skill pack: secret scan, dependency and supply-chain review |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | Pin sessions in the Web sidebar with durable ordering |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Terminal-style input history for the web composer: arrows, Ctrl+R search |
| [dsh-github](https://github.com/PerryLink/dsh-github) | GitHub PR/issues integration for DSH, every write gated by approval |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | Plugin-development knowledge base as an on-demand agent skill |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH |

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

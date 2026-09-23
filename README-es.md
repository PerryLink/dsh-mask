<div align="center">

# dsh-mask
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-mask` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Middleware de enmascaramiento de PII para DeepSeek Harness: anonimiza los datos personales antes de que lleguen al modelo y los restaura en la capa de visualización.**

*Teléfonos, correos, documentos, tarjetas, claves y más se convierten en marcadores de posición en el límite del modelo; el texto plano nunca entra en tu registro de sesión.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-mask)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-mask.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-mask?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-mask?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

## Compatibility

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.7-alpha.2` (adaptado el 2026-09-18): el sobre de sesión conserva su campo ignorable solo para compatibilidad de lectura de logs almacenados - Session.append aún no puede estamparlo, por lo que el comportamiento de la puerta no cambia. Verificado el 2026-09-18 contra el checkout master `dsh-v0.1.7-alpha.1` (cadena completa de puertas + smoke de instalación de perfil). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Donde corra DSH (host puro, regex sin dependencias; sin mitad de navegador) |
| Modelo | Modelos de texto totalmente soportados |

## What you get

`dsh-mask` anonimiza datos personales **en el límite del modelo** y mantiene una tabla de restauración para volver de los marcadores a los originales:

- **Enmascarado antes de la petición** — reescribe los mensajes de `agent/pre-step` para que teléfonos, correos, documentos, tarjetas, claves e IP (opt-in) se vuelvan marcadores como `<PHONE_1>`. El texto enmascarado es lo que se registra y se envía al modelo.
- **Tabla de restauración** — el mapa `marcador → original` vive solo en memoria y en un dominio de almacenamiento controlado (`dsh_mask`); el texto plano nunca entra en el registro de sesión.
- **Auditoría sin texto plano** — el evento `mask/applied` solo registra «N valores reemplazados + distribución por tipo».
- **Comando `/mask`** — `status`, `on`/`off`, `restore <text>`, `help`.
- **Herramienta `mask_test`** — prueba un fragmento y ve el resultado con marcadores; nunca revela los valores originales.

```text
mensaje de usuario ──agent/pre-step──▶ marcadores ──modelo──▶ marcadores ──restore──▶ pantalla
                                          ▲                                              │
                                          └──── tabla de restauración (memoria + dsh_mask) ─┘
```

## Quick start

```sh
dsh plugin --profile web add "github:PerryLink/dsh-mask#main"
# o desde npm
dsh plugin --profile web add dsh-mask
dsh --profile web --dump-config | grep -A2 'id: mask'
```

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

- **Canal git**: `dsh plugin --profile web add "github:PerryLink/dsh-mask#main"` (equivale a `git+https://github.com/PerryLink/dsh-mask.git`). Sin paso de build.
- **Canal npm**: `dsh plugin --profile web add dsh-mask`.
- **Canal tarball**: `pnpm pack` y luego `dsh plugin --profile web add ./dsh-mask-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-mask`.

`dsh-mask` ya no incluye la pila de almacenamiento. Los perfiles que ya la componen (el perfil `web` lo hace, vía `@deepseek-ai/dsh-web-app`) aportan `storageDomain`, así que la persistencia funciona de inmediato. En un perfil bare sin almacenamiento el plugin se monta y enmascara igualmente, pero la tabla es solo en memoria (se pierde al reiniciar): compón la pila de almacenamiento en tu parche de perfil, o pon `persistRestoreTable: false`.

## Configuration

Todas las opciones son campos Schemastery `Config` (modificables desde cordis.yml). `cordis.patch.yml` documenta cada clave.

| Clave | Predeterminado | Significado |
|---|---|---|
| `enabled` | `true` | Interruptor maestro |
| `mode` | `regex` | Solo `regex` implementado (`regex+ner` reservado) |
| `entities` | `[phone, email, id-card, bank-card, key]` | Tipos de PII a enmascarar; `ip` opt-in, `person`/`address` requieren NER |
| `scope` | `[messages]` | Superficies: `messages` (mensajes agent/pre-step) y `tools` (texto de resultados de herramientas). Acepta una cadena o un array, p. ej. `[messages, tools]` |
| `registerCommand` | `true` | Registra el comando `/mask` |
| `registerTools` | `true` | Registra la herramienta `mask_test` |
| `persistRestoreTable` | `true` | Persiste la tabla en el dominio `dsh_mask` |
| `maxRestoreEntriesPerSession` | `500` | Tope de entradas por sesión |
| `maxSessions` | `1000` | Tope de sesiones en memoria |

## Tools & surfaces

| Superficie | Revela texto plano | Notas |
|---|---|---|
| Enmascarado `agent/pre-step` | nunca | Reescribe mensajes a marcadores |
| `/mask status` | nunca | Estado, total reemplazado, distribución |
| `/mask on` / `/mask off` | nunca | Alternancia en tiempo de ejecución |
| `/mask restore <text>` | sí (explícito) | Desmapea marcadores a los valores de esta sesión |
| `mask_test` | nunca | Enmascara un fragmento y reporta el resultado |

## Permissions & data

- **Permisos**: sin red, sin credenciales (`network:none`, `credentials:none`).
- **Datos**: la tabla `marcador → original` vive en memoria y, con `persistRestoreTable: true`, en el dominio `dsh_mask`; nunca en el registro de sesión.
- **Registro de sesión**: `mask/applied` se declara en `types.d.ts` y se añade solo cuando el host registra el tipo.

## Security boundaries

- **El texto plano nunca entra en el registro de sesión.** Lo registrado y enviado es la forma enmascarada; los originales quedan en la tabla de restauración.
- **Sanitizar antes de mostrar/registrar.** `lib/sanitize.mjs` redacta PII, secretos y credenciales de URL.
- **Restauración controlada.** `/mask restore` es la única superficie de revelado explícita.
- **Fallo cerrado.** `mode`/`scope`/entidades no implementados y números fuera de rango fallan al cargar.
- **Registros como efectos.** Listener, comando, herramienta y cierre de dominio son efectos Cordis.

## Known limitations

- **Solo regex.** `person` y `address` requieren un reconocedor NER externo; fallan al cargar. Cubierto de serie: teléfono, correo, documento, tarjeta, clave e IP (opt-in).
- **Patrones específicos de región.** Los detectores `phone` e `id-card` solo reconocen formatos de China continental: `phone` es `1[3-9]` seguido de nueve dígitos, e `id-card` es un documento de residente chino de 18 caracteres (17 dígitos más un dígito o `X`). Los teléfonos y documentos de otros países no se detectan. `email`, `ip` y `key` no dependen de la región; `bank-card` acepta cualquier secuencia de 16-19 dígitos con menor confianza.
- **La restauración visual necesita una mitad de cliente.** Enmascarar es host-side; desenmascarar burbujas en la UI es una función de navegador que esta forma host puro no incluye. El host conserva la tabla y el seam `RestoreStore` exportado (sus métodos piden un id de sesión), así que una futura mitad de cliente debe consumirlos mediante un remoto del host, no directamente; hoy la superficie de desenmascarado es el comando `/mask restore <text>`, y la clave `maskClientEnabled` se declara y valida pero ningún código en ejecución la lee todavía.
- **Eventos en `0.1.6-alpha.2`.** El host registra 58 tipos de evento de sesión y ninguno es `mask/*`; su `Session.append` tampoco puede estampar el sobre `ignorable`, así que los appends de auditoría se omiten (las sesiones siguen cargando). La puerta no es silenciosa: la primera negativa de cada sesión registra un aviso visible con el tipo omitido y esta limitación documentada. El append se habilita automáticamente cuando un host registra el tipo o admite el sobre `ignorable`.

## Development

```sh
pnpm install
pnpm run typecheck && pnpm run typecheck:ci
pnpm test
pnpm run verify:self-contained
pnpm run verify:artifacts
pnpm run check:readmes
pnpm pack
```

Sin paso de build: ESM puro, `index.mjs` y `lib/` son los artefactos enviados.

### Benchmark

El benchmark de PII (P/R/F1 por tipo sobre 108 muestras sintéticas) está en [`benchmark/RESULTS.md`](benchmark/RESULTS.md); regenéralo con `node benchmark/run.mjs` (sin build, cero dependencias nuevas).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor.

## PerryLink DSH Plugin Family

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |


## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.

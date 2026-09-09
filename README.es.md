<div align="center">

# dsh-mask
- **Canal 1024 store**: `npm i -g dsh1024` una vez, luego `dsh1024 plugin --profile web add dsh-mask` (cuenta para el ranking de instalaciones de [deepseek1024.com](https://deepseek1024.com)).

**Middleware de enmascaramiento de PII para DeepSeek Harness: anonimiza los datos personales antes de que lleguen al modelo y los restaura en la capa de visualización.**

*Teléfonos, correos, documentos, tarjetas, claves y más se convierten en marcadores de posición en el límite del modelo; el texto plano nunca entra en tu registro de sesión.*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## Compatibility

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.5-alpha.1` (adaptado el 2026-09-09): el sobre de sesión conserva su campo ignorable solo para compatibilidad de lectura de logs almacenados - Session.append aún no puede estamparlo, por lo que el comportamiento de la puerta no cambia. Verificado el 2026-09-09 contra el checkout master `dsh-v0.1.5-alpha.1` (cadena completa de puertas + smoke de instalación de perfil). |
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
- **La restauración visual necesita una mitad de cliente.** Enmascarar es host-side; desenmascarar burbujas en la UI es una función de navegador que esta forma host puro no incluye. La tabla y `restore()` son el seam host-side completo.
- **Eventos en `0.1.2-rc.1`.** El host aún no registra `mask/*`, así que los appends de auditoría se omiten (las sesiones siguen cargando).

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

Este proyecto es uno de los [37 complementos de DeepSeek Harness](https://github.com/PerryLink) mantenidos por [PerryLink](https://github.com/PerryLink). Si este te ayuda, probablemente los demás también:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Auto-revisión de segundo modelo en la cadena de aprobación, con cierre en fallo por defecto | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Agentes hijos en segundo plano durables con barra lateral de UI web, mensajería e interrupción | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Gobernanza de costes para DeepSeek Harness: presupuestos, carbono y latencia en un panel. | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Equivalente a /rewind de Claude Code: instantáneas, bifurcaciones de sesión, restauración de un solo uso | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migra sesiones, memoria, habilidades y CLAUDE.md de Claude Code a DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Control de escritorio nativo multiplataforma para DeepSeek Harness — Windows primero. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Historial de entrada estilo terminal para el compositor web: flechas, búsqueda Ctrl+R | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Comprobaciones de calidad de datasets y verificación de citas (el puente numérico opcional consumido aquí) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Defensa contra inyección de prompts, jailbreak y fuga de secretos para DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Guardián de disciplina de ingeniería: interrogatorio de requisitos, puertas de pruebas, revisión adversaria | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Enrutamiento unificado de generación de imágenes estáticas para DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Diagnóstico de rendimiento de solo lectura para DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Informes de investigación deterministas para fondos mutuos públicos chinos | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | Integración de PR/issues de GitHub para DSH, cada escritura controlada por aprobación | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Orquestación de investigación sectorial que sella sus entregables mediante el `ctx.researchReport.assemble` de este plugin | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Base de conocimiento documental local para DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Integración de modelos locales (Ollama) para DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | Diagnósticos, formato, autocompletado, acciones de código y renombrado LSP sobre servidores de lenguaje | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Panel de tiempo de ejecución MCP de solo lectura: comando /mcp + pestaña Settings con estado, herramientas y errores | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Memoria entre sesiones controlada por aprobación: costura ctx.memory + SQLite + herramienta de memoria | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | Exportador de observabilidad OpenTelemetry y Langfuse para DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Cambio de estilo en tiempo de ejecución equivalente a outputStyles de Claude Code | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Reglas de permisos declarativas allow/deny/ask estilo Claude Code con auditoría | |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | Inyector de directivas personales con interruptor en la barra superior (edición framework) |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Base de conocimiento de desarrollo de plugins como habilidad de agente bajo demanda | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Puente multicanal de aprobación/preguntas: WeChat/Telegram/Feishu, consola de sesión |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Motor de informes de investigación verificables con evidencia direccionada por contenido | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Puntuación de calidad multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Fija sesiones en la barra lateral web con orden durable | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Sincronización de sesiones entre dispositivos para DeepSeek Harness — un espejo git dedicado de tu almacén de sesiones. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Paquete de habilidades de auditoría de seguridad: escaneo de secretos, revisión de dependencias y cadena de suministro | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Bucle de sesión con voz para DeepSeek Harness: háblale y escucha su respuesta. | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Pruebas de instalación y humo aisladas para plugins de DeepSeek Harness. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | Puente de tareas TickTick/Dida365: panel de cabecera de sesión + 11 herramientas |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Traducción de parámetros entre proveedores y reparación determinista de JSON para DeepSeek Harness. | |
| **[dsh-wechat](https://github.com/PerryLink/dsh-wechat)** | Puente WeChat ↔ DSH (bot Tencent iLink): texto/imagen/archivo/voz, aprobaciones en el chat |

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.

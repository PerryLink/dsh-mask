<div align="center">

# dsh-mask

**Middleware de enmascaramiento de PII para DeepSeek Harness: anonimiza los datos personales antes de que lleguen al modelo y los restaura en la capa de visualización.**

*Teléfonos, correos, documentos, tarjetas, claves y más se convierten en marcadores de posición en el límite del modelo; el texto plano nunca entra en tu registro de sesión.*

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

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
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

## Configuration

Todas las opciones son campos Schemastery `Config` (modificables desde cordis.yml). `cordis.patch.yml` documenta cada clave.

| Clave | Predeterminado | Significado |
|---|---|---|
| `enabled` | `true` | Interruptor maestro |
| `mode` | `regex` | Solo `regex` implementado (`regex+ner` reservado) |
| `entities` | `[phone, email, id-card, bank-card, key]` | Tipos de PII a enmascarar; `ip` opt-in, `person`/`address` requieren NER |
| `scope` | `messages` | Solo `messages` implementado |
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
- **Eventos en `0.1.0-rc.6`.** El host aún no registra `mask/*`, así que los appends de auditoría se omiten (las sesiones siguen cargando).

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

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor.

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

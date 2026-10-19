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

```sh
dsh plugin --profile <name> add dsh-mask
```


</div>

---


**📖 Base de conocimiento del ecosistema** — datos medidos, no marketing: [guía de desarrollo · datos de selección · criterios de mantenimiento](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->
## Install & uninstall

- **Canal git**: `dsh plugin --profile web add github:PerryLink/dsh-mask` (equivale a `git+https://github.com/PerryLink/dsh-mask.git`). Sin paso de build.
- **Canal npm**: `dsh plugin --profile web add dsh-mask`.
- **Canal tarball**: `pnpm pack` y luego `dsh plugin --profile web add ./dsh-mask-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-mask`.

`dsh-mask` ya no incluye la pila de almacenamiento. Los perfiles que ya la componen (el perfil `web` lo hace, vía `@deepseek-ai/dsh-web-app`) aportan `storageDomain`, así que la persistencia funciona de inmediato. En un perfil bare sin almacenamiento el plugin se monta y enmascara igualmente, pero la tabla es solo en memoria (se pierde al reiniciar): compón la pila de almacenamiento en tu parche de perfil, o pon `persistRestoreTable: false`.

## ⭐ 如果它帮到了你

Este plugin forma parte de la [familia de plugins DSH](https://github.com/PerryLink) (más de 40, todos Apache-2.0). Si te resulta útil, **dale una estrella**: no desbloquea nada, pero ayuda a que la siguiente persona lo encuentre antes.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-mask?

Middleware de enmascaramiento de PII para DeepSeek Harness: anonimiza los datos personales antes de que lleguen al modelo y los restaura en la capa de visualización.

Teléfonos, correos, documentos, tarjetas, claves y más se convierten en marcadores de posición en el límite del modelo; el texto plano nunca entra en tu registro de sesión.

![Diagrama de flujo de dsh-mask: llamada → plugin → resultado.](docs/assets/dsh-mask-flow.svg)

*Resumen del flujo: llamada → plugin → resultado. Los ejemplos siguientes usan la superficie de comandos real.*


*La misma ejecución, animada.*

## Comparison

![Gráfico comparativo medido de dsh-mask](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-evidence.png)

108 synthetic samples (60 positive, 48 negative) · from benchmark/RESULTS.md

## Compatibility

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (adaptado el 2026-09-18): el sobre de sesión conserva su campo ignorable solo para compatibilidad de lectura de logs almacenados - Session.append aún no puede estamparlo, por lo que el comportamiento de la puerta no cambia. Verificado el 2026-09-18 contra el checkout master `dsh-v0.1.7-alpha.1` (cadena completa de puertas + smoke de instalación de perfil). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Donde corra DSH (host puro, regex sin dependencias; sin mitad de navegador) |
| Modelo | Modelos de texto totalmente soportados |

## What you get

`dsh-mask` anonimiza datos personales **en el límite del modelo** y mantiene una tabla de restauración para volver de los marcadores a los originales:

- **Enmascarado antes de la petición** — reescribe los mensajes de `agent/pre-step` para que teléfonos, correos, documentos, tarjetas, claves e IP (opt-in) se vuelvan marcadores como `<PHONE_1>`. El texto enmascarado es lo que se registra y se envía al modelo.
- **Tabla de restauración** — el mapa `marcador → original` vive solo en memoria y en un dominio de almacenamiento controlado (`dsh_mask`); el texto plano nunca entra en el registro de sesión.
- **Auditoría sin texto plano** — el evento `mask/applied` solo registra «N valores reemplazados + distribución por tipo».
- **Comando `/mask`** — `status`, `on`/`off`, `restore <text>` (desmapea marcadores y entrega el texto plano como archivo, nunca como texto registrable), `help`.
- **Herramienta `mask_test`** — prueba un fragmento y ve el resultado con marcadores; nunca revela los valores originales.

```text
mensaje de usuario ──agent/pre-step──▶ marcadores ──modelo──▶ marcadores ──restore──▶ archivo controlado
                                          ▲                                                 │
                                          └──── tabla de restauración (memoria + dsh_mask) ──┘
```

## Quick start

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
```

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
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
mask: restored 1 placeholder(s): <PHONE_1>
  file: /tmp/dsh-mask-restore/restore-1f0c….txt  (mode 0600, one file per session)
```

### Ejemplos

Son los puntos de entrada reales; instala y llama a uno.

#### Ejemplo detallado

**Comando**

~~~sh
mask_test
~~~

**Entrada**

~~~json
{"text":"电话 13812345678"}
~~~

**Salida**

~~~text
mask_test: replaced 1 PII value(s) (PHONE=1)
masked:
电话 <PHONE_1>
~~~

*Observado en `plugins/dsh-mask/index.mjs:243-250; test/index.test.mjs:306-315`*

#### Ejemplos breves

- `mask_test`
- `/mask restore <text>`

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
| `restoreDir` | `''` | Dónde entrega `/mask restore` el texto plano. Vacío = `os.tmpdir()/dsh-mask-restore`; un valor relativo se resuelve contra el cwd del proceso host. El directorio se crea `0700` y el archivo se escribe `0600`, uno por sesión |

## Tools & surfaces

| Superficie | Revela texto plano | Notas |
|---|---|---|
| Enmascarado `agent/pre-step` | nunca | Reescribe mensajes a marcadores |
| `/mask status` | nunca | Estado, total reemplazado, distribución |
| `/mask on` / `/mask off` | nunca | Alternancia en tiempo de ejecución |
| `/mask restore <text>` | sí (explícito) | Desmapea marcadores a los valores de esta sesión y los escribe en un archivo controlado (uno por sesión, modo `0600`); el texto del resultado y el registro de sesión solo llevan esa ruta y los nombres de los marcadores |
| `mask_test` | nunca | Enmascara un fragmento y reporta el resultado |

## Permissions & data

- **Permisos**: sin red, sin credenciales (`network:none`, `credentials:none`). El manifest declara `filesystem:write` por el archivo de entrega de `/mask restore`.
- **Datos**: la tabla `marcador → original` vive en memoria y, con `persistRestoreTable: true`, en el dominio `dsh_mask`; nunca en el registro de sesión. La única otra copia en texto plano es el archivo de entrega que escribe un `/mask restore` explícito (`restoreDir`, modo `0600`, uno por sesión, sobrescrito por la siguiente restauración); nada escribe texto plano en disco de forma implícita.
- **Registro de sesión**: `mask/applied` se declara en `types.d.ts` y se añade solo cuando el host registra el tipo.

## Security boundaries

- **El texto plano nunca entra en el registro de sesión.** Lo registrado y enviado es la forma enmascarada; los originales quedan en la tabla de restauración. La misma regla rige el revelado: el host registra el texto del resultado de un comando **literalmente** y lo usa para renderizar la salida visible, así que `/mask restore` escribe el texto plano en un archivo controlado y solo devuelve la ruta.
- **Sanitizar antes de mostrar/registrar.** `lib/sanitize.mjs` redacta PII, secretos y credenciales de URL; `mask_test`, `/mask status` y todas las rutas de error de `/mask` nunca muestran originales.
- **Restauración controlada.** `/mask restore` es la única superficie de revelado explícita. Si falla la entrega, falla cerrado: un error, nunca un respaldo que muestre el texto plano.
- **Fallo cerrado.** `mode`/`scope`/entidades no implementados y números fuera de rango fallan al cargar.
- **Registros como efectos.** Listener, comando, herramienta y cierre de dominio son efectos Cordis.

## Known limitations

- **Solo regex.** `person` y `address` requieren un reconocedor NER externo; fallan al cargar. Cubierto de serie: teléfono, correo, documento, tarjeta, clave e IP (opt-in).
- **Patrones específicos de región.** Los detectores `phone` e `id-card` solo reconocen formatos de China continental: `phone` es `1[3-9]` seguido de nueve dígitos, e `id-card` es un documento de residente chino de 18 caracteres (17 dígitos más un dígito o `X`). Los teléfonos y documentos de otros países no se detectan. `email`, `ip` y `key` no dependen de la región; `bank-card` acepta cualquier secuencia de 16-19 dígitos con menor confianza.
- **La restauración visual necesita una mitad de cliente.** Enmascarar es host-side; desenmascarar burbujas en la UI es una función de navegador que esta forma host puro no incluye. El host conserva la tabla y el seam `RestoreStore` exportado (sus métodos piden un id de sesión), así que una futura mitad de cliente debe consumirlos mediante un remoto del host, no directamente; hoy la superficie de desenmascarado es el comando `/mask restore <text>`, que entrega el texto plano como archivo porque el resultado de un comando se registra literalmente, y la clave `maskClientEnabled` se declara y valida pero ningún código en ejecución la lee todavía.
- **No hay `/mask restore` sin argumentos.** Restaurar *todos* los marcadores del último mensaje del asistente no se ofrece, y el comando lo dice si se invoca sin texto. Dos hechos del host lo impiden: la tabla de restauración es un mapa plano `{marcador: original}` por sesión, **sin índice por mensaje**, así que ese mensaje hay que localizarlo en el registro de eventos de la sesión; y el host marcó `Session.snapshotEvents()` / `eventAt()` / `ownEvents()` como obsoletos con un «prohibido llamarlos desde código nuevo», y la única alternativa sancionada (mantener una proyección incremental) no es fiable en el corredor de hosts declarado (`>=0.1.2-rc.1`). Los marcadores siguen restaurándose de uno en uno: `/mask restore <PHONE_1>`.
- **Eventos en `0.1.7-rc.2`.** El host registra 59 tipos de evento de sesión y ninguno es `mask/*`; su `Session.append` tampoco puede estampar el sobre `ignorable`, así que los appends de auditoría se omiten (las sesiones siguen cargando). La puerta no es silenciosa: la primera negativa de cada sesión registra un aviso visible con el tipo omitido y esta limitación documentada. El append se habilita automáticamente cuando un host registra el tipo o admite el sobre `ignorable`.

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

## Interoperability with other DSH plugins

Verificado contra **DSH `0.2.0-rc.2`** (el runtime para el que se publica este README) y el conjunto de plugins con más estrellas sondeado el 2026-10-05.

Este plugin **no interfiere** con otros plugins, incluidos los de más estrellas:

- **Sin colisión de nombres de herramienta.** Todas las herramientas llevan espacio de nombres; ninguna ocupa un nombre desnudo ya perteneciente a una herramienta incluida u otro plugin.
- **Sin colisión de clave de servicio.** No provee ninguna clave de servicio, así que no puede colisionar en una.
- **Sin colisión de slot.** No registra ninguna clave de slot de cliente, así que no disputa un asiento `shadows-shipped-ui`.
- **Sin colisión de ruta HTTP.** No registra ningún prefijo `webServer`.
- **Sin colisión en la capa de patch.** El patch del bundle solo hace `insert` de su propia fila; nunca sobrescribe el `config` de una fila incluida.
- **Sin mutación global.** No parchea prototipos, ni reescribe `process.env`, ni reemplaza el dispatcher global de fetch.

**Los listeners de eventos compartidos no interfieren por construcción.** Observa los eventos sensibles al orden `agent/pre-step`, `tools/post-execute` con `ctx.on()` — el registro de difusión de Cordis, donde cada listener se ejecuta y ninguno puede dejar sin turno a otro. **Todos los listeners aquí delegan por `next()`**, así que la cadena nunca se cortocircuita:
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).

Evidencia estática: `dsh-plugin-doctor` K10–K13 dan `pass` en todas las comprobaciones de este repositorio.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — creador y mantenedor.

## PerryLink DSH Plugin Family

Este proyecto forma parte de la familia de plugins de DeepSeek Harness de [PerryLink](https://github.com/PerryLink). El registro permanece plegado abajo para que cada README conserve una primera pantalla corta; expándelo para ver cada fila y su estado.

<details>
<summary>Expandir todos los plugins</summary>

| Plugin | Estado |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver el README del repositorio |

</details>

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### Instalar desde el mercado de DSH Desktop

Todos los plugins de PerryLink pueden explorarse en el mercado integrado de DSH Desktop: **Market → Sources → add source → pegar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ seleccionarlo**. La instalación sigue pasando por la verificación de identidad npm del mercado y tu confirmación.

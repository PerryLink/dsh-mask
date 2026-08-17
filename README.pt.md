# dsh-mask

<div align="center">

**Middleware de mascaramento de PII para o DeepSeek Harness: anonimize dados pessoais antes que cheguem ao modelo e restaure-os na camada de exibição.**

*Telefones, e-mails, documentos, cartões, chaves e mais viram marcadores no limite do modelo; o texto simples nunca entra no seu registro de sessão.*

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

| Superfície | Estado |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Onde o DSH rodar (host puro, regex sem dependências; sem metade de navegador) |
| Modelo | Modelos de texto totalmente suportados |

## What you get

O `dsh-mask` anonimiza dados pessoais **no limite do modelo** e mantém uma tabela de restauração:

- **Mascaramento antes da requisição** — reescreve mensagens de `agent/pre-step` para que telefones, e-mails, documentos, cartões, chaves e IPs (opt-in) virem marcadores como `<PHONE_1>`. O texto mascarado é o que é registrado e enviado ao modelo.
- **Tabela de restauração** — o mapa `marcador → original` vive só em memória e num domínio de armazenamento controlado (`dsh_mask`); o texto simples nunca entra no registro de sessão.
- **Auditoria sem texto simples** — o evento `mask/applied` registra apenas «N valores substituídos + distribuição por tipo».
- **Comando `/mask`** — `status`, `on`/`off`, `restore <text>`, `help`.
- **Ferramenta `mask_test`** — teste um trecho e veja o resultado com marcadores; nunca revela os originais.

```text
mensagem do usuário ──agent/pre-step──▶ marcadores ──modelo──▶ marcadores ──restore──▶ tela
                                          ▲                                            │
                                          └──── tabela de restauração (memória + dsh_mask) ─┘
```

## Quick start

```sh
dsh plugin --profile web add "github:PerryLink/dsh-mask#main"
# ou via npm
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

- **Canal git**: `dsh plugin --profile web add "github:PerryLink/dsh-mask#main"` (equivale a `git+https://github.com/PerryLink/dsh-mask.git`). Sem etapa de build.
- **Canal npm**: `dsh plugin --profile web add dsh-mask`.
- **Canal tarball**: `pnpm pack` e depois `dsh plugin --profile web add ./dsh-mask-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-mask`.

## Configuration

Todas as opções são campos Schemastery `Config` (alteráveis via cordis.yml). O `cordis.patch.yml` documenta cada chave.

| Chave | Padrão | Significado |
|---|---|---|
| `enabled` | `true` | Interruptor mestre |
| `mode` | `regex` | Só `regex` implementado (`regex+ner` reservado) |
| `entities` | `[phone, email, id-card, bank-card, key]` | Tipos de PII; `ip` opt-in, `person`/`address` exigem NER |
| `scope` | `messages` | Só `messages` implementado |
| `registerCommand` | `true` | Registra o comando `/mask` |
| `registerTools` | `true` | Registra a ferramenta `mask_test` |
| `persistRestoreTable` | `true` | Persiste a tabela no domínio `dsh_mask` |
| `maxRestoreEntriesPerSession` | `500` | Limite de entradas por sessão |
| `maxSessions` | `1000` | Limite de sessões em memória |

## Tools & surfaces

| Superfície | Revela texto simples | Notas |
|---|---|---|
| Mascaramento `agent/pre-step` | nunca | Reescreve mensagens para marcadores |
| `/mask status` | nunca | Estado, total substituído, distribuição |
| `/mask on` / `/mask off` | nunca | Alternância em tempo de execução |
| `/mask restore <text>` | sim (explícito) | Desmapeia marcadores para os valores desta sessão |
| `mask_test` | nunca | Mascara um trecho e reporta o resultado |

## Permissions & data

- **Permissões**: sem rede, sem credenciais (`network:none`, `credentials:none`).
- **Dados**: a tabela `marcador → original` vive em memória e, com `persistRestoreTable: true`, no domínio `dsh_mask`; nunca no registro de sessão.
- **Registro de sessão**: `mask/applied` é declarado em `types.d.ts` e anexado só quando o host registra o tipo.

## Security boundaries

- **Texto simples nunca entra no registro de sessão.** O registrado e enviado é a forma mascarada; os originais ficam na tabela.
- **Sanitizar antes de exibir/registrar.** `lib/sanitize.mjs` redige PII, segredos e credenciais de URL.
- **Restauração controlada.** `/mask restore` é a única superfície de revelação explícita.
- **Falha fechada.** `mode`/`scope`/entidades não implementados e números fora de faixa falham ao carregar.
- **Registros como efeitos.** Listener, comando, ferramenta e fechamento de domínio são efeitos Cordis.

## Known limitations

- **Somente regex.** `person` e `address` exigem um reconhecedor NER externo; falham ao carregar. Coberto de série: telefone, e-mail, documento, cartão, chave e IP (opt-in).
- **A restauração visual precisa de uma metade de cliente.** Mascarar é host-side; desmascarar bolhas na UI é uma função de navegador que esta forma host puro não inclui. A tabela e `restore()` são o seam host-side completo.
- **Eventos em `0.1.0-rc.6`.** O host ainda não registra `mask/*`, então os appends de auditoria são omitidos (sessões continuam carregando).

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

Sem etapa de build: ESM puro, `index.mjs` e `lib/` são os artefatos enviados.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor.

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

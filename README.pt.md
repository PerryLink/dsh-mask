<div align="center">

# dsh-mask
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-mask` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Middleware de mascaramento de PII para o DeepSeek Harness: anonimize dados pessoais antes que cheguem ao modelo e restaure-os na camada de exibição.**

*Telefones, e-mails, documentos, cartões, chaves e mais viram marcadores no limite do modelo; o texto simples nunca entra no seu registro de sessão.*

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

| Superfície | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.3-alpha.1` (adaptado em 2026-09-02): o envelope de sessão mantém seu campo ignorable apenas para compatibilidade de leitura de logs armazenados - o Session.append ainda não consegue estampá-lo, então o comportamento da porta não muda. Verificado em 2026-09-06 contra o checkout master `dsh-v0.1.3-alpha.1` (cadeia completa de portas + smoke de instalação de perfil). |
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

`dsh-mask` não inclui mais a pilha de armazenamento. Perfis que já a compõem (o perfil `web` o faz, via `@deepseek-ai/dsh-web-app`) fornecem `storageDomain`, então a persistência funciona imediatamente. Em um perfil bare sem armazenamento o plugin monta e mascara mesmo assim, mas a tabela é só em memória (perdida ao reiniciar): componha a pilha de armazenamento no seu patch de perfil, ou defina `persistRestoreTable: false`.

## Configuration

Todas as opções são campos Schemastery `Config` (alteráveis via cordis.yml). O `cordis.patch.yml` documenta cada chave.

| Chave | Padrão | Significado |
|---|---|---|
| `enabled` | `true` | Interruptor mestre |
| `mode` | `regex` | Só `regex` implementado (`regex+ner` reservado) |
| `entities` | `[phone, email, id-card, bank-card, key]` | Tipos de PII; `ip` opt-in, `person`/`address` exigem NER |
| `scope` | `[messages]` | Superfícies: `messages` (mensagens agent/pre-step) e `tools` (texto de resultados de ferramentas). Aceita string ou array, ex. `[messages, tools]` |
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
- **Eventos em `0.1.2-rc.1`.** O host ainda não registra `mask/*`, então os appends de auditoria são omitidos (sessões continuam carregando).

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

### Benchmark

O benchmark de PII (P/R/F1 por tipo em 108 amostras sintéticas) está em [`benchmark/RESULTS.md`](benchmark/RESULTS.md); regenere-o com `node benchmark/run.mjs` (sem build, zero dependências novas).

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor.

## PerryLink DSH Plugin Family

Este projeto é um dos [37 plugins de DeepSeek Harness](https://github.com/PerryLink) mantidos por [PerryLink](https://github.com/PerryLink). Se este ajuda você, os outros provavelmente também:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Auto-revisão de segundo modelo na cadeia de aprovação, com falha fechada por padrão | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Agentes filhos em segundo plano duráveis com barra lateral de UI web, mensagens e interrupção | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Governança de custos para DeepSeek Harness: orçamentos, carbono e latência em um painel. | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Equivalente ao /rewind do Claude Code: instantâneos, bifurcações de sessão, restauração de uso único | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migre sessões, memória, habilidades e CLAUDE.md do Claude Code para o DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Controle de desktop nativo multiplataforma para DeepSeek Harness — Windows primeiro. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Histórico de entrada estilo terminal para o compositor web: setas, busca Ctrl+R | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Verificações de qualidade de datasets e verificação de citações (a ponte numérica opcional consumida aqui) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Defesa contra injeção de prompt, jailbreak e vazamento de segredos para DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Guardião de disciplina de engenharia: sabatina de requisitos, portões de teste, revisão adversária | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Roteamento unificado de geração de imagens estáticas para DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Diagnóstico de desempenho só de leitura para DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Relatórios de pesquisa deterministas para fundos mútuos públicos chineses | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | Integração de PR/issues do GitHub para o DSH, cada escrita controlada por aprovação | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Orquestração de pesquisa setorial que sela as suas entregas através do `ctx.researchReport.assemble` deste plugin | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Base de conhecimento documental local para DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Integração de modelos locais (Ollama) para DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | Diagnósticos, formatação, autocompletar, ações de código e renomeação LSP sobre servidores de linguagem | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Painel de tempo de execução MCP somente leitura: comando /mcp + aba Settings com status, ferramentas e erros | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Memória entre sessões controlada por aprovação: costura ctx.memory + SQLite + ferramenta de memória | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | Exportador de observabilidade OpenTelemetry e Langfuse para DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Troca de estilo em tempo de execução equivalente ao outputStyles do Claude Code | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Regras de permissão declarativas allow/deny/ask estilo Claude Code com auditoria | |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | Injetor de diretivas pessoais com alternância na barra superior (edição framework) |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Base de conhecimento de desenvolvimento de plugins como habilidade de agente sob demanda | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Ponte multicanal de aprovação/perguntas: WeChat/Telegram/Feishu, console de sessão |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Motor de relatórios de pesquisa verificáveis com evidência endereçada por conteúdo | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Pontuação de qualidade multidimensional para plugins de DeepSeek Harness. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Fixe sessões na barra lateral web com ordenação durável | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Sincronização de sessões entre dispositivos para DeepSeek Harness — um espelho git dedicado do seu armazenamento de sessões. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Pacote de habilidades de auditoria de segurança: varredura de segredos, revisão de dependências e cadeia de suprimentos | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Loop de sessão com voz para DeepSeek Harness: fale e ouça a resposta. | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Test drives isolados de instalação e smoke para plugins de DeepSeek Harness. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | Ponte de tarefas TickTick/Dida365: painel no cabeçalho da sessão + 11 ferramentas |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Tradução de parâmetros entre fornecedores e reparo determinístico de JSON para DeepSeek Harness. | |
| **[dsh-wechat](https://github.com/PerryLink/dsh-wechat)** | Ponte WeChat ↔ DSH (bot Tencent iLink): texto/imagem/arquivo/voz, aprovações no chat |

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.

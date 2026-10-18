<div align="center">

# dsh-mask
- **Canal 1024 store**: `npm i -g dsh1024` uma vez, depois `dsh1024 plugin --profile web add dsh-mask` (conta para o ranking de instalações do [deepseek1024.com](https://deepseek1024.com)).

**Middleware de mascaramento de PII para o DeepSeek Harness: anonimize dados pessoais antes que cheguem ao modelo e restaure-os na camada de exibição.**

*Telefones, e-mails, documentos, cartões, chaves e mais viram marcadores no limite do modelo; o texto simples nunca entra no seu registro de sessão.*

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
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-mask?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-mask?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-mask
```


</div>

---


**📖 Base de conhecimento do ecossistema** — dados medidos, não marketing: [guia de desenvolvimento · dados de seleção · critérios de manutenção](https://perrylink.github.io/dsh-plugin-guide/).

<!-- star-cta -->
## Install & uninstall

- **Canal git**: `dsh plugin --profile web add github:PerryLink/dsh-mask` (equivale a `git+https://github.com/PerryLink/dsh-mask.git`). Sem etapa de build.
- **Canal npm**: `dsh plugin --profile web add dsh-mask`.
- **Canal tarball**: `pnpm pack` e depois `dsh plugin --profile web add ./dsh-mask-<version>.tgz`.
- **Desinstalar**: `dsh plugin --profile web remove dsh-mask`.

`dsh-mask` não inclui mais a pilha de armazenamento. Perfis que já a compõem (o perfil `web` o faz, via `@deepseek-ai/dsh-web-app`) fornecem `storageDomain`, então a persistência funciona imediatamente. Em um perfil bare sem armazenamento o plugin monta e mascara mesmo assim, mas a tabela é só em memória (perdida ao reiniciar): componha a pilha de armazenamento no seu patch de perfil, ou defina `persistRestoreTable: false`.

## ⭐ 如果它帮到了你

Este plugin faz parte da [família de plugins DSH](https://github.com/PerryLink) (mais de 40, todos Apache-2.0). Se for útil, **deixe uma estrela**: não desbloqueia nada, mas ajuda a próxima pessoa a encontrá-lo.

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-mask?

Middleware de mascaramento de PII para o DeepSeek Harness: anonimize dados pessoais antes que cheguem ao modelo e restaure-os na camada de exibição.

Telefones, e-mails, documentos, cartões, chaves e mais viram marcadores no limite do modelo; o texto simples nunca entra no seu registro de sessão.

![Demonstração de terminal do dsh-mask: dsh-mask — PII becomes placeholders before the model sees it](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-hero.png)

![Animated terminal demo of dsh-mask](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-demo.gif)

*A mesma execução, animada.*

## Comparison

![Gráfico comparativo medido do dsh-mask](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-evidence.png)

108 synthetic samples (60 positive, 48 negative) · from benchmark/RESULTS.md

## Compatibility

| Superfície | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (adaptado em 2026-09-18): o envelope de sessão mantém seu campo ignorable apenas para compatibilidade de leitura de logs armazenados - o Session.append ainda não consegue estampá-lo, então o comportamento da porta não muda. Verificado em 2026-09-18 contra o checkout master `dsh-v0.1.7-alpha.1` (cadeia completa de portas + smoke de instalação de perfil). |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Plataformas | Onde o DSH rodar (host puro, regex sem dependências; sem metade de navegador) |
| Modelo | Modelos de texto totalmente suportados |

## What you get

O `dsh-mask` anonimiza dados pessoais **no limite do modelo** e mantém uma tabela de restauração:

- **Mascaramento antes da requisição** — reescreve mensagens de `agent/pre-step` para que telefones, e-mails, documentos, cartões, chaves e IPs (opt-in) virem marcadores como `<PHONE_1>`. O texto mascarado é o que é registrado e enviado ao modelo.
- **Tabela de restauração** — o mapa `marcador → original` vive só em memória e num domínio de armazenamento controlado (`dsh_mask`); o texto simples nunca entra no registro de sessão.
- **Auditoria sem texto simples** — o evento `mask/applied` registra apenas «N valores substituídos + distribuição por tipo».
- **Comando `/mask`** — `status`, `on`/`off`, `restore <text>` (desmapeia marcadores e entrega o texto simples como arquivo, nunca como texto registrável), `help`.
- **Ferramenta `mask_test`** — teste um trecho e veja o resultado com marcadores; nunca revela os originais.

```text
mensagem do usuário ──agent/pre-step──▶ marcadores ──modelo──▶ marcadores ──restore──▶ arquivo controlado
                                          ▲                                                 │
                                          └──── tabela de restauração (memória + dsh_mask) ──┘
```

## Quick start

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
```

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
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
mask: restored 1 placeholder(s): <PHONE_1>
  file: /tmp/dsh-mask-restore/restore-1f0c….txt  (mode 0600, one file per session)
```

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
| `restoreDir` | `''` | Onde o `/mask restore` entrega o texto simples. Vazio = `os.tmpdir()/dsh-mask-restore`; um valor relativo é resolvido contra o cwd do processo host. O diretório é criado `0700` e o arquivo escrito `0600`, um por sessão |

## Tools & surfaces

| Superfície | Revela texto simples | Notas |
|---|---|---|
| Mascaramento `agent/pre-step` | nunca | Reescreve mensagens para marcadores |
| `/mask status` | nunca | Estado, total substituído, distribuição |
| `/mask on` / `/mask off` | nunca | Alternância em tempo de execução |
| `/mask restore <text>` | sim (explícito) | Desmapeia marcadores para os valores desta sessão e os escreve num arquivo controlado (um por sessão, modo `0600`); o texto do resultado e o registro de sessão levam apenas esse caminho e os nomes dos marcadores |
| `mask_test` | nunca | Mascara um trecho e reporta o resultado |

## Permissions & data

- **Permissões**: sem rede, sem credenciais (`network:none`, `credentials:none`). O manifest declara `filesystem:write` por causa do arquivo de entrega do `/mask restore`.
- **Dados**: a tabela `marcador → original` vive em memória e, com `persistRestoreTable: true`, no domínio `dsh_mask`; nunca no registro de sessão. A única outra cópia em texto simples é o arquivo de entrega que um `/mask restore` explícito escreve (`restoreDir`, modo `0600`, um por sessão, sobrescrito pela próxima restauração); nada escreve texto simples em disco de forma implícita.
- **Registro de sessão**: `mask/applied` é declarado em `types.d.ts` e anexado só quando o host registra o tipo.

## Security boundaries

- **Texto simples nunca entra no registro de sessão.** O registrado e enviado é a forma mascarada; os originais ficam na tabela. A mesma regra vale para a revelação: o host registra o texto do resultado de um comando **literalmente** e o usa para renderizar a saída visível, então `/mask restore` escreve o texto simples num arquivo controlado e devolve apenas o caminho.
- **Sanitizar antes de exibir/registrar.** `lib/sanitize.mjs` redige PII, segredos e credenciais de URL; `mask_test`, `/mask status` e todos os caminhos de erro do `/mask` nunca exibem originais.
- **Restauração controlada.** `/mask restore` é a única superfície de revelação explícita. Se a entrega falhar, falha fechado: um erro, nunca um fallback que exiba o texto simples.
- **Falha fechada.** `mode`/`scope`/entidades não implementados e números fora de faixa falham ao carregar.
- **Registros como efeitos.** Listener, comando, ferramenta e fechamento de domínio são efeitos Cordis.

## Known limitations

- **Somente regex.** `person` e `address` exigem um reconhecedor NER externo; falham ao carregar. Coberto de série: telefone, e-mail, documento, cartão, chave e IP (opt-in).
- **Padrões específicos de região.** Os detectores `phone` e `id-card` reconhecem apenas formatos da China continental: `phone` é `1[3-9]` seguido de nove dígitos, e `id-card` é um documento de residente chinês de 18 caracteres (17 dígitos mais um dígito ou `X`). Telefones e documentos de outros países não são detectados. `email`, `ip` e `key` não dependem da região; `bank-card` aceita qualquer sequência de 16-19 dígitos com menor confiança.
- **A restauração visual precisa de uma metade de cliente.** Mascarar é host-side; desmascarar bolhas na UI é uma função de navegador que esta forma host puro não inclui. O host mantém a tabela e o seam `RestoreStore` exportado (seus métodos pedem um id de sessão), então uma futura metade de cliente precisa consumi-los por um remoto do host, não diretamente; hoje a superfície de desmascaramento é o comando `/mask restore <text>`, que entrega o texto simples como arquivo porque o resultado de um comando é registrado literalmente, e a chave `maskClientEnabled` é declarada e validada mas nenhum código em execução a lê ainda.
- **Não há `/mask restore` sem argumentos.** Restaurar *todos* os marcadores da última mensagem do assistente não é oferecido, e o comando diz isso quando invocado sem texto. Dois fatos do host impedem: a tabela de restauração é um mapa plano `{marcador: original}` por sessão, **sem índice por mensagem**, então essa mensagem precisa ser localizada no registro de eventos da sessão; e o host marcou `Session.snapshotEvents()` / `eventAt()` / `ownEvents()` como obsoletos com um «proibido para novos chamadores», e a única alternativa sancionada (manter uma projeção incremental) não é confiável no corredor de hosts declarado (`>=0.1.2-rc.1`). Os marcadores continuam sendo restaurados um a um: `/mask restore <PHONE_1>`.
- **Eventos em `0.1.7-rc.2`.** O host registra 59 tipos de evento de sessão e nenhum é `mask/*`; seu `Session.append` também não consegue estampar o envelope `ignorable`, então os appends de auditoria são omitidos (sessões continuam carregando). A porta não é silenciosa: a primeira recusa de cada sessão registra um aviso visível com o tipo omitido e esta limitação documentada. O append é habilitado automaticamente quando um host registra o tipo ou aceita o envelope `ignorable`.

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

## Interoperability with other DSH plugins

Verificado contra **DSH `0.2.0-rc.2`** (o runtime para o qual este README é publicado) e o conjunto de plugins com mais estrelas pesquisado em 2026-10-05.

Este plugin **não interfere** em outros plugins, incluindo os de mais estrelas:

- **Sem colisão de nome de ferramenta.** Todas as ferramentas têm namespace; nenhuma ocupa um nome puro já pertencente a uma ferramenta embutida ou a outro plugin.
- **Sem colisão de chave de serviço.** Não fornece nenhuma chave de serviço, portanto não pode colidir em uma.
- **Sem colisão de slot.** Não registra nenhuma chave de slot de cliente, então não disputa um assento `shadows-shipped-ui`.
- **Sem colisão de rota HTTP.** Não registra nenhum prefixo `webServer`.
- **Sem colisão na camada de patch.** O patch do bundle apenas faz `insert` da própria linha; nunca sobrescreve o `config` de uma linha embutida.
- **Sem mutação global.** Não altera protótipos, não reescreve `process.env` nem substitui o dispatcher global de fetch.

**Listeners de eventos compartilhados não interferem por construção.** Observa os eventos sensíveis à ordem `agent/pre-step`, `tools/post-execute` com `ctx.on()` — o registro de difusão do Cordis, onde cada listener executa e nenhum pode privar outro do turno. **Todos os listeners aqui delegam via `next()`**, então a cadeia nunca é curto-circuitada:
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).

Evidência estática: `dsh-plugin-doctor` K10–K13 retornam `pass` em todas as verificações deste repositório.

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — criador e mantenedor.

## PerryLink DSH Plugin Family

Este projeto é um dos **87 plugins ativamente mantidos** do DeepSeek Harness da [PerryLink](https://github.com/PerryLink). O registro da família tem **95** plugins — **5 congelados**, **3 retirados** — e fica recolhido abaixo para que cada README mantenha uma primeira tela curta. Expanda para ver cada linha, com o motivo na coluna Status.

<details>
<summary>Expandir os 95 plugins</summary>

| Plugin | Uma linha | Status |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.

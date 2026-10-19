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

![Diagrama de fluxo de dsh-mask: chamada → plugin → resultado.](docs/assets/dsh-mask-flow.svg)

*Visão geral do fluxo: chamada → plugin → resultado. Os exemplos abaixo usam a superfície real de comandos.*


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

### Exemplos

São os pontos de entrada reais; instale e chame um.

#### Exemplo detalhado

**Comando**

~~~sh
mask_test
~~~

**Entrada**

~~~json
{"text":"电话 13812345678"}
~~~

**Saída**

~~~text
mask_test: replaced 1 PII value(s) (PHONE=1)
masked:
电话 <PHONE_1>
~~~

*Observado em `plugins/dsh-mask/index.mjs:243-250; test/index.test.mjs:306-315`*

#### Exemplos breves

- `mask_test`
- `/mask restore <text>`

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

Este projeto faz parte da família de plugins do DeepSeek Harness da [PerryLink](https://github.com/PerryLink). O registro fica recolhido abaixo para que cada README mantenha uma primeira tela curta; expanda para ver cada linha e seu status.

<details>
<summary>Expandir todos os plugins</summary>

| Plugin | Status |
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
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver o README do repositório |

</details>

## License

[LICENSE](LICENSE) (Apache License 2.0) © 2026 dsh-mask contributors

### Instalar a partir do mercado do DSH Desktop

Todos os plugins PerryLink podem ser explorados no mercado integrado do DSH Desktop: **Market → Sources → add source → colar** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ selecionar**. A instalação continua passando pela verificação de identidade npm do mercado e pela sua confirmação.

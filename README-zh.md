<div align="center">

# dsh-mask
- **1024 商店渠道**：先 `npm i -g dsh1024`，再 `dsh1024 plugin --profile web add dsh-mask`（计入 [deepseek1024.com](https://deepseek1024.com) 安装排行）。

**面向 DeepSeek Harness 的 PII 脱敏中间件——在个人数据进入模型前匿名化，在展示层还原。**

*电话、邮箱、身份证、银行卡、密钥等在模型边界变成占位符；原文绝不进入会话日志。*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-mask)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-mask.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-mask/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-mask/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-mask?label=version)](https://github.com/PerryLink/dsh-mask/releases)
[![npm version](https://img.shields.io/npm/v/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![npm downloads](https://img.shields.io/npm/dm/dsh-mask)](https://www.npmjs.com/package/dsh-mask)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-mask?metric=downloads&lang=zh)](https://dshfind.com/zh/plugins/PerryLink/dsh-mask?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-mask
```


</div>

---


**📖 生态实测知识库**（实测数据，不是营销）：[插件开发指南 · 选型实测数据 · 维护取舍判据](https://perrylink.github.io/dsh-plugin-guide/)。

<!-- star-cta -->
## Install & uninstall

- **git 通道**（最新 `main`）：`dsh plugin --profile web add github:PerryLink/dsh-mask`（等价于从 `git+https://github.com/PerryLink/dsh-mask.git` 安装）。无构建步骤——`index.mjs` 与 `lib/` 即发布产物。
- **npm 通道**（发布版本）：`dsh plugin --profile web add dsh-mask`。
- **tarball 通道**：在本仓库 `pnpm pack`，再 `dsh plugin --profile web add ./dsh-mask-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-mask`（或从 profile patch 删掉该行）。

`dsh-mask` 不再自带 storage 栈。已组合该栈的 profile（`web` profile 通过 `@deepseek-ai/dsh-web-app` 提供）自带 `storageDomain`，持久化开箱即用。未组合 storage 的 bare profile 仍可正常挂载与遮罩，但恢复表仅存内存（重启丢失）——请在 profile patch 中组合 storage 栈，或将 `persistRestoreTable` 设为 `false`。

## ⭐ 如果它帮到了你

这个插件是 [DSH 插件家族](https://github.com/PerryLink)的一员（95 个，全部 Apache-2.0）。如果你在用，**给个 star** —— 它不会解锁任何功能，但会让下一个人在搜索里更容易找到它。

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-mask?

面向 DeepSeek Harness 的 PII 脱敏中间件——在个人数据进入模型前匿名化，在展示层还原。

电话、邮箱、身份证、银行卡、密钥等在模型边界变成占位符；原文绝不进入会话日志。

![dsh-mask 终端演示：dsh-mask — PII becomes placeholders before the model sees it](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-hero.png)

![Animated terminal demo of dsh-mask](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-demo.gif)

*同一次运行，动图版。*

## Comparison

![dsh-mask 的实测对比柱状图](https://raw.githubusercontent.com/PerryLink/dsh-mask/main/docs/assets/dsh-mask-evidence.png)

108 synthetic samples (60 positive, 48 negative) · from benchmark/RESULTS.md

## Compatibility

| 维度 | 状态 |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1`（2026-09-18 已适配）：会话信封保留 ignorable 字段但仅用于存量日志读取兼容——Session.append 仍无法盖章，门控行为不变。已于 2026-09-18 针对 `dsh-v0.1.7-alpha.1` master checkout 核验（全量门禁链 + profile 安装冒烟测试）。 |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 平台 | 任何 DSH 可运行处（纯 host、零依赖正则；无浏览器半） |
| 模型 | 文本模型完全支持；无需额外模型能力 |

## What you get

`dsh-mask` 在**模型边界**匿名化个人数据——消息进入模型之前——并维护一张恢复表，以便在展示层把占位符映射回原文：

- **请求前遮罩** —— 重写 `agent/pre-step` 消息，使电话、邮箱、身份证、银行卡、密钥（默认开启）与 IP（可选）变成 `<PHONE_1>` 之类的占位符。被遮罩的文本才是落盘并发送给模型的内容。
- **恢复表** —— `占位符 → 原文` 映射只存内存与受控 storage domain（`dsh_mask`）；原文绝不进会话日志。
- **审计不含明文** —— `mask/applied` 会话事件只记「替换了 N 处 + 类型分布」，不记原文与映射。
- **`/mask` 命令** —— `status`（计数 + 分布）、`on`/`off`（运行时开关）、`restore <text>`（还原占位符，并把原文交付为文件而不是可落盘的文本）、`help`。
- **`mask_test` 工具** —— 试跑一段文本看替换效果；绝不回显原文。

```text
用户消息 ──agent/pre-step──▶ 占位符 ──模型──▶ 占位符 ──restore──▶ 受控文件
                               ▲                                        │
                               └──── 恢复表（内存 + dsh_mask）──────────┘
```

## Quick start

```sh
dsh plugin --profile web add github:PerryLink/dsh-mask
```

```sh
# 1. 把 bundle 安装进 profile
dsh plugin --profile web add github:PerryLink/dsh-mask

# 或从 npm（发布版本）
dsh plugin --profile web add dsh-mask

# 2. 校验行是否挂载
dsh --profile web --dump-config | grep -A2 'id: mask'
```

然后在 profile patch 里调整实体列表：

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

所有可调项都是 Schemastery `Config` 字段（可从 cordis.yml 覆盖）。按 id 覆盖会替换整行——请重述所有需要的键。`cordis.patch.yml` 逐键内联注释。

| 键 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `true` | 总开关；`false` 卸载监听器、`/mask` 命令与 `mask_test` 工具 |
| `mode` | `regex` | 检测模式；只有 `regex` 实现（`regex+ner` 姓名/地址识别预留并响亮失败） |
| `entities` | `[phone, email, id-card, bank-card, key]` | 要遮罩的 PII 类型；`ip` 也支持正则（可选），`person`/`address` 需要 NER |
| `scope` | `[messages]` | 遮罩作用域；`messages` 遮罩 agent/pre-step 消息，`tools` 遮罩 tools/post-execute 工具结果。可为字符串或数组，如 `[messages, tools]` |
| `registerCommand` | `true` | 注册 `/mask` 命令 |
| `registerTools` | `true` | tools 服务存在时注册 `mask_test` 工具 |
| `persistRestoreTable` | `true` | 把恢复表持久化到受控 `dsh_mask` 领域（`false` = 仅内存） |
| `maxRestoreEntriesPerSession` | `500` | 每会话恢复条目上限（最旧先逐出） |
| `maxSessions` | `1000` | 内存会话上限（LRU 逐出，映射按需回载） |
| `restoreDir` | `''` | `/mask restore` 交付原文的位置。空 = `os.tmpdir()/dsh-mask-restore`；相对值相对宿主进程 cwd 解析。目录按 `0700` 创建、文件按 `0600` 写入，每会话一个文件 |

profile patch 覆盖示例：

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

| 表面 | 是否回显原文 | 说明 |
|---|---|---|
| `agent/pre-step` 遮罩 | 永不 | 把消息重写为占位符后再落盘/送模型 |
| `/mask status` | 永不 | 启用状态、替换总数、类型分布 |
| `/mask on` / `/mask off` | 永不 | 运行时开关（重启回到 `config.enabled`） |
| `/mask restore <text>` | 是（显式） | 把占位符还原为本会话存储的值并写进受控文件（每会话一个，mode `0600`）；结果文本与会话日志只带该路径与占位符名 |
| `mask_test` | 永不 | 遮罩一段文本并报告占位符结果 + 计数 |

## Permissions & data

- **权限**：`dsh-mask` 不做网络请求、不存凭据；只在 `agent/pre-step` 边界读取会话，写入自己的 `dsh_mask` 领域，并写入 `/mask restore` 的交付文件（manifest 正是为此声明 `filesystem:write`）。`dshWorkshop` manifest 还声明 `network:none` 与 `credentials:none`。
- **数据**：`占位符 → 原文` 恢复表存内存；`persistRestoreTable: true` 时另存受控 `dsh_mask` 领域——绝不写会话日志。唯一另一份原文副本是显式 `/mask restore` 写下的交付文件（`restoreDir`，mode `0600`，每会话一个，下次还原覆盖）；没有任何路径会隐式把原文写盘。
- **会话日志**：`mask/applied` 在 `types.d.ts` 声明，仅在宿主收录该类型时 append（见 Known limitations）。载荷只有计数 + 类型分布。

## Security boundaries

- **原文绝不进会话日志。** 落盘并送模型的是遮罩（占位符）形式，因此模型可见内容可自日志以占位符形式重建；原文留在恢复表。还原方向同理：宿主把命令结果文本**原样**写进日志、并从那一条事件渲染用户可见输出，所以 `/mask restore` 把原文写进受控文件，只回路径。
- **展示/日志前脱敏。** `lib/sanitize.mjs` 在文本进入模型或日志前打码 PII、密钥与 URL 凭据；`mask_test`、`/mask status` 与所有 `/mask` 错误路径永不回显原文。
- **受控还原。** `/mask restore` 是唯一的显式还原面，且只读当前会话的映射。失败关闭：交付文件写不出时命令报错，绝不回退成回显原文。
- **失败关闭。** 未实现的 `mode`（`regex+ner`）、`scope`（`tools`）、NER 实体与越界数值均在加载期响亮失败。
- **注册即 effect。** 监听器、命令、工具与领域关闭都是 Cordis effect——停止/热重载即可撤销。

## Known limitations

- **仅正则。** 姓名（`person`）与地址（`address`）识别需要外部 NER 识别器，纯 host 零依赖形态未捆绑；`mode: regex+ner` 与这些实体在加载期响亮失败。开箱即用覆盖电话、邮箱、身份证、银行卡、密钥与（可选）IP。
- **正则具地域局限。** `phone` 与 `id-card` 只匹配中国大陆格式：`phone` 为 `1[3-9]` 加九位数字，`id-card` 为 18 位中国居民身份证（17 位数字加一位数字或 `X`）。其他国家的电话号码与证件号码不会被检出。`email`、`ip`、`key` 与地域无关；`bank-card` 以较低置信度接受任意 16-19 位数字串。
- **展示层还原需要浏览器半。** 遮罩完全在 host 侧，但客户端 UI 中透明还原助手气泡属于浏览器半功能，本纯 host 形态未交付。host 侧保留恢复表与已导出的 `RestoreStore` seam（其方法需要会话 id），因此未来的客户端半需经 host 远程面间接消费，而非直接使用；当前的反遮罩入口是 `/mask restore <text>` 命令，它把原文交付为文件（因为命令结果会被原样记入日志，见「Security boundaries」）；`maskClientEnabled` 键会被 schema 声明与校验，但尚无任何运行时代码读取它。
- **不提供无参 `/mask restore`。** 「还原最近一条助手消息里的全部占位符」这一形态未提供，且无参调用时命令会明确说明。两个宿主事实挡住了它：恢复表是每会话扁平的 `{占位符: 原文}` 映射、**没有按消息的索引**，因此必须去会话事件日志里定位那条消息；而宿主已把 `Session.snapshotEvents()` / `eventAt()` / `ownEvents()` 标为 deprecated 并明令**禁止新调用方**，其唯一被认可的替代（按投递事件增量维护投影）又超出本插件声明的宿主走廊（`>=0.1.2-rc.1`）所能依赖的范围。占位符仍可逐个还原：`/mask restore <PHONE_1>`。
- **`0.1.7-rc.2` 会话事件。** 宿主收录 59 个会话事件类型，其中没有 `mask/*`；其 `Session.append` 也无法盖章 `ignorable` 信封，因此会话日志审计 append 被跳过（会话仍可加载）。门控不再静默：每个会话首次被拒时打一条可见告警，写明被跳过的事件类型与本限制。宿主收录该类型或支持 `ignorable` 信封后自动开启。

## Development

```sh
pnpm install                                       # node ^22.19 || >=24
pnpm run typecheck && pnpm run typecheck:ci        # 两把尺子：checkout 面（带守卫，无 checkout 时不可验证）+ 已发布线面
pnpm test                                          # node --test
pnpm run verify:self-contained                     # 依赖 spec 均来自 registry
pnpm run verify:artifacts                          # 发布文件齐全 + index.mjs 可 import
pnpm run check:readmes                             # 五语 README 一致性
pnpm pack                                          # 发布 tarball
```

无构建步骤：纯 ESM，`index.mjs` 与 `lib/` 即发布产物。

### Benchmark

PII 基准（108 个合成样本的逐类 P/R/F1）见 [`benchmark/RESULTS.md`](benchmark/RESULTS.md)；用 `node benchmark/run.mjs` 复现（无需构建、零新依赖）。

## Interoperability with other DSH plugins

已对照 **DSH `0.2.0-rc.2`**（本 README 面向的运行时）与 2026-10-05 实测的高星插件集验证。

本插件**不干扰**其他插件，包括广泛安装的高星插件：

- **无工具名冲突。** 所有工具都带命名空间，不占用任何已被内置工具或其他插件持有的裸名。
- **无服务键冲突。** 不提供任何服务键，因此不存在服务键冲突。
- **无 slot 冲突。** 不注册客户端 slot key，因此不参与 `shadows-shipped-ui` 座位争抢。
- **无 HTTP 路由冲突。** 不注册任何 `webServer` 前缀。
- **无 patch 层冲突。** 组合包 patch 只 `insert` 自己那一行，从不覆写内置行的 `config`。
- **无全局改写。** 不改原型、不改写 `process.env`、不替换全局 fetch dispatcher。

**共享事件监听器在构造上就不互相干扰。** 它用 `ctx.on()` 监听顺序敏感事件 `agent/pre-step`, `tools/post-execute` —— Cordis 的**广播**语义：每个监听器都会运行，任何一个都无法饿死其他监听器。**此处每个监听器都通过 `next()` 委托**，因此链条绝不会被短路；改写作用在 `next()` 产出的值上，而不是用它顶替返回：
  - `agent/pre-step` — also used by `dsh-routing-suite` (7000★, 7 listeners), `modlens` (4122★), `dsh-purge` (3317★), `dsh-agent-teams` (1923★), `dsh-context` (1849★).
  - `tools/post-execute` — also used by `cc-safety-net` (1576★).

静态证据：`dsh-plugin-doctor` 的 K10–K13 在本仓全部为 `pass`。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：从 Pii-Stripper-Middleware 移植的正则 PII 检测器、`agent/pre-step` 遮罩 seam、恢复表、`/mask` 命令与 `mask_test` 工具、五语文档。

## PerryLink DSH Plugin Family

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 DeepSeek Harness 插件家族成员：**87 个活跃维护**，名册共 **95** 个，其中 **5 个已冻结**、**3 个已退役**。完整名单默认折叠，避免每个 README 的首屏被长表淹没；点击展开可查看每一行，原因见「状态」列。

<details>
<summary>展开全部 95 个插件</summary>

| 插件 | 一句话 | 状态 |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 已退役 — 见仓库 README |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 已冻结 — 见仓库 README |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 已冻结 — 见仓库 README |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 已冻结 — 见仓库 README |
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
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 已冻结 — 见仓库 README |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 已退役 — 见仓库 README |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 已退役 — 见仓库 README |
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

[LICENSE](LICENSE)（Apache License 2.0）© 2026 dsh-mask contributors

### 从 DSH Desktop 市场安装

所有 PerryLink 插件均可在 DSH Desktop 内置市场中浏览：**市场 → 来源 → 添加来源 → 粘贴** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ 选中**。安装仍需通过市场的 npm 身份校验与你的确认。

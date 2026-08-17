<div align="center">

# dsh-mask

**面向 DeepSeek Harness 的 PII 脱敏中间件——在个人数据进入模型前匿名化，在展示层还原。**

*电话、邮箱、身份证、银行卡、密钥等在模型边界变成占位符；原文绝不进入会话日志。*

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

| 维度 | 状态 |
|---|---|
| Harness | DeepSeek Harness `0.1.0-rc.6` |
| Node | `^22.19.0 \|\| >=24.0.0` |
| 平台 | 任何 DSH 可运行处（纯 host、零依赖正则；无浏览器半） |
| 模型 | 文本模型完全支持；无需额外模型能力 |

## What you get

`dsh-mask` 在**模型边界**匿名化个人数据——消息进入模型之前——并维护一张恢复表，以便在展示层把占位符映射回原文：

- **请求前遮罩** —— 重写 `agent/pre-step` 消息，使电话、邮箱、身份证、银行卡、密钥与 IP（均可按需开启）变成 `<PHONE_1>` 之类的占位符。被遮罩的文本才是落盘并发送给模型的内容。
- **恢复表** —— `占位符 → 原文` 映射只存内存与受控 storage domain（`dsh_mask`）；原文绝不进会话日志。
- **审计不含明文** —— `mask/applied` 会话事件只记「替换了 N 处 + 类型分布」，不记原文与映射。
- **`/mask` 命令** —— `status`（计数 + 分布）、`on`/`off`（运行时开关）、`restore <text>`（还原占位符）、`help`。
- **`mask_test` 工具** —— 试跑一段文本看替换效果；绝不回显原文。

```text
用户消息 ──agent/pre-step──▶ 占位符 ──模型──▶ 占位符 ──restore──▶ 展示
                               ▲                                        │
                               └──── 恢复表（内存 + dsh_mask）──────────┘
```

## Quick start

```sh
# 1. 把 bundle 安装进 profile
dsh plugin --profile web add "github:PerryLink/dsh-mask#main"

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
```

## Install & uninstall

- **git 通道**（最新 `main`）：`dsh plugin --profile web add "github:PerryLink/dsh-mask#main"`（等价于从 `git+https://github.com/PerryLink/dsh-mask.git` 安装）。无构建步骤——`index.mjs` 与 `lib/` 即发布产物。
- **npm 通道**（发布版本）：`dsh plugin --profile web add dsh-mask`。
- **tarball 通道**：在本仓库 `pnpm pack`，再 `dsh plugin --profile web add ./dsh-mask-<version>.tgz`。
- **卸载**：`dsh plugin --profile web remove dsh-mask`（或从 profile patch 删掉该行）。

## Configuration

所有可调项都是 Schemastery `Config` 字段（可从 cordis.yml 覆盖）。按 id 覆盖会替换整行——请重述所有需要的键。`cordis.patch.yml` 逐键内联注释。

| 键 | 默认值 | 含义 |
|---|---|---|
| `enabled` | `true` | 总开关；`false` 卸载监听器、`/mask` 命令与 `mask_test` 工具 |
| `mode` | `regex` | 检测模式；只有 `regex` 实现（`regex+ner` 姓名/地址识别预留并响亮失败） |
| `entities` | `[phone, email, id-card, bank-card, key]` | 要遮罩的 PII 类型；`ip` 也支持正则（可选），`person`/`address` 需要 NER |
| `scope` | `messages` | 遮罩作用域；只有 `messages`（agent 消息）实现（`tools` 入参遮罩预留） |
| `registerCommand` | `true` | 注册 `/mask` 命令 |
| `registerTools` | `true` | tools 服务存在时注册 `mask_test` 工具 |
| `persistRestoreTable` | `true` | 把恢复表持久化到受控 `dsh_mask` 领域（`false` = 仅内存） |
| `maxRestoreEntriesPerSession` | `500` | 每会话恢复条目上限（最旧先逐出） |
| `maxSessions` | `1000` | 内存会话上限（LRU 逐出，映射按需回载） |

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
| `/mask restore <text>` | 是（显式） | 把占位符还原为本会话存储的值 |
| `mask_test` | 永不 | 遮罩一段文本并报告占位符结果 + 计数 |

## Permissions & data

- **权限**：`dsh-mask` 不做网络请求、不存凭据；只在 `agent/pre-step` 边界读取会话，并写入自己的 `dsh_mask` 领域。`dshWorkshop` manifest 声明 `network:none` 与 `credentials:none`。
- **数据**：`占位符 → 原文` 恢复表存内存；`persistRestoreTable: true` 时另存受控 `dsh_mask` 领域——这是 PII 原文唯一落点，绝不写会话日志。
- **会话日志**：`mask/applied` 在 `types.d.ts` 声明，仅在宿主收录该类型时 append（见 Known limitations）。载荷只有计数 + 类型分布。

## Security boundaries

- **原文绝不进会话日志。** 落盘并送模型的是遮罩（占位符）形式，因此模型可见内容可自日志以占位符形式重建；原文留在恢复表。
- **展示/日志前脱敏。** `lib/sanitize.mjs` 在文本进入模型或日志前打码 PII、密钥与 URL 凭据；`mask_test` 与 `/mask status` 永不回显原文。
- **受控还原。** `/mask restore` 是唯一的显式还原面，且只读当前会话的映射。
- **失败关闭。** 未实现的 `mode`（`regex+ner`）、`scope`（`tools`）、NER 实体与越界数值均在加载期响亮失败。
- **注册即 effect。** 监听器、命令、工具与领域关闭都是 Cordis effect——停止/热重载即可撤销。

## Known limitations

- **仅正则。** 姓名（`person`）与地址（`address`）识别需要外部 NER 识别器，纯 host 零依赖形态未捆绑；`mode: regex+ner` 与这些实体在加载期响亮失败。开箱即用覆盖电话、邮箱、身份证、银行卡、密钥与（可选）IP。
- **展示层还原需要浏览器半。** 遮罩完全在 host 侧，但客户端 UI 中透明还原助手气泡属于浏览器半功能，本纯 host 形态未交付；恢复表与 `restore()` 是供客户端插件消费的完整 host 侧 seam，交互需求现由 `/mask restore` 覆盖。
- **`0.1.0-rc.6` 会话事件。** 宿主尚未收录 `mask/*` 事件类型，因此 rc.6 上会话日志审计 append 被跳过（会话仍可加载）；宿主收录类型或支持 `ignorable` 信封后自动开启。

## Development

```sh
pnpm install                                       # node ^22.19 || >=24
pnpm run typecheck && pnpm run typecheck:ci        # tsc --checkJs（对照 rc.6 peers）
pnpm test                                          # node --test
pnpm run verify:self-contained                     # 依赖 spec 均来自 registry
pnpm run verify:artifacts                          # 发布文件齐全 + index.mjs 可 import
pnpm run check:readmes                             # 五语 README 一致性
pnpm pack                                          # 发布 tarball
```

无构建步骤：纯 ESM，`index.mjs` 与 `lib/` 即发布产物。

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security`

## Contributors

- [@PerryLink](https://github.com/PerryLink) —— 创建者与维护者：从 Pii-Stripper-Middleware 移植的正则 PII 检测器、`agent/pre-step` 遮罩 seam、恢复表、`/mask` 命令与 `mask_test` 工具、五语文档。

## PerryLink DSH Plugin Family

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 [DeepSeek Harness 插件](https://github.com/PerryLink)之一。如果你觉得这个插件有用，其余的很可能同样有用：

| 插件 | 一句话说明 |
|---|---|
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII 脱敏中间件：模型边界匿名化、展示层还原 |
| [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) | 只读 MCP 运行时面板：/mcp 命令 + 设置页，状态/工具/错误一览 |
| [dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck) | 工程纪律守门：需求审讯、测试证据门、对抗评审 |
| [dsh-background-agents](https://github.com/PerryLink/dsh-background-agents) | 持久化后台子代理：Web 侧边栏进度、随时留言与打断 |
| [dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions) | 基于语言服务器的诊断/格式化/补全/代码动作/重命名 |
| [dsh-output-styles](https://github.com/PerryLink/dsh-output-styles) | 对标 Claude Code outputStyles 的运行时风格切换 |
| [dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind) | 对标 Claude Code /rewind：快照、会话 fork、一键回退 |
| [dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules) | Claude Code 风格声明式 allow/deny/ask 权限规则，带审计 |
| [dsh-auto-review](https://github.com/PerryLink/dsh-auto-review) | 审批链上的第二模型自动审查，默认 fail-closed |
| [dsh-memento](https://github.com/PerryLink/dsh-memento) | 带审批门的跨会话记忆：ctx.memory + SQLite + memory 工具 |
| [dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security) | 安全审计技能包：密钥扫描、依赖与供应链审查 |
| [dsh-session-pin](https://github.com/PerryLink/dsh-session-pin) | 在 Web 侧边栏置顶会话，持久排序 |
| [dsh-composer-history](https://github.com/PerryLink/dsh-composer-history) | Web 作曲器终端式输入历史：方向键、Ctrl+R 搜索 |
| [dsh-github](https://github.com/PerryLink/dsh-github) | DSH 的 GitHub PR/issue 集成，所有写操作经审批门 |
| [dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | 插件开发知识库，随 bundle 安装的按需 agent 技能 |
| [dsh-claude-move](https://github.com/PerryLink/dsh-claude-move) | 把 Claude Code 会话、记忆、技能和 CLAUDE.md 迁入 DSH |

## License

[LICENSE](LICENSE)（Apache License 2.0）© 2026 dsh-mask contributors

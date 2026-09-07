// index.mjs — dsh-mask 插件入口（唯一 host 面文件）。
//
// 功能：模型边界的 PII 匿名化-恢复中间件。
// - 请求前遮罩：监听 agent/pre-step（waterfall，直通 next()），把进入模型的
//   UserMessage 文本块里的 PII（电话/邮箱/身份证/银行卡/密钥/IP 可配）替换为
//   `<LABEL_N>` 占位符；遮罩后消息才作为 user/message 落盘 → 模型可见内容可自
//   日志重建（占位符形式），原文绝不进会话日志。
// - 恢复表：占位符→原文映射只存内存 + 受控 storageDomain（dsh_mask/restore），
//   绝不进会话日志明文；/mask restore 与恢复 seam 按需回载。
// - 审计：mask/applied 会话事件只记"替换了 N 处 + 类型分布"（log-only，自适应
//   门），不记明文与映射。
// - 表面：/mask 命令（status|on|off|restore|help）与 mask_test 工具（试跑一段
//   文本看替换效果，绝不回显原文）。
//
// 只消费公开服务：commands（inject 声明）、storageDomain（ctx.get 可选，缺失时
// 恢复表降级为纯内存并一次性告警），tools 经 ctx.inject 可选注册；lib/ 零 DSH
// 依赖，服务只在边界接线。

import { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import SessionStore, { KNOWN_SESSION_EVENT_TYPES } from '@deepseek-ai/dsh-session'
import { defineTool } from '@deepseek-ai/dsh-tools'
import {
  COMMAND_NAME,
  DEFAULTS,
  ENTITY_NAMES,
  LIMITS,
  MODES,
  NER_ENTITIES,
  PLUGIN_NAME,
  REGEX_ENTITIES,
  SCOPES,
  SESSION_EVENTS,
  TOOL_MASK_TEST,
} from './lib/constants.mjs'
import { badConfig, messageOf, nerModeUnsupported, nerUnsupported, scopeUnsupported } from './lib/errors.mjs'
import { createStripper } from './lib/strip.mjs'
import { maskMessages, maskContentBlocks } from './lib/mask.mjs'
import { makeEventGate, maybeAppendSessionEvent } from './lib/gate.mjs'
import { RestoreStore } from './lib/store.mjs'
import { dshMaskDomainSpec } from './lib/domain.mjs'

export const name = PLUGIN_NAME

/**
 * 必需服务：缺失即加载失败（响亮）。storageDomain 是可选服务（apply 内
 * ctx.get 读取，缺失时恢复表降级为纯内存），不再作为 inject 硬依赖——否则
 * bare profile 会卡在 `pending (waiting for service: storageDomain)`。
 */
export const inject = ['commands']

/**
 * 宿主 append 是否盖章 ignorable 信封（运行时能力探测）。
 * 在全新 detached Context 上构造 SessionStore（绝不接入宿主持久化）：追加一条带
 * { ignorable: true } 的探测事件并回读信封标记。rc.2 的 append 只消费
 * surfaceOp/sourceEventSeqs，静默丢弃未知选项键 → 标记缺失 → false（门保持关闭）；
 * 支持 ignorable 信封的宿主 → true。
 * 探测留下的空壳 Context/SessionStore 不持有宿主句柄、定时器或监听器，
 * 返回后即成为 GC 垃圾，无需（也没有 API 可）显式收尾。
 * @returns {boolean} 宿主支持 ignorable 信封。
 */
export function probeIgnorableAppend() {
  try {
    const store = new SessionStore(new Context())
    const session = store.create()
    const event = session.append(SESSION_EVENTS.APPLIED, {
      sessionId: 'probe',
      replaced: 0,
      distribution: {},
    // @ts-ignore rc.2 append takes no envelope option for non-surface types — probing it is the point.
    }, /** @type {any} */ ({ ignorable: true }))
    return event?.ignorable === true
  } catch {
    return false
  }
}

/**
 * Service Definition — 服务契约：下方 Config schema 与 makeMaskTestTool 的工具 schema。
 */
/**
 * 插件配置（Schemastery，全部可 cordis.yml 覆盖；无硬编码 tunable）。
 * @typedef {import('./types.d.ts').Config} Config
 */
export const Config = Schema.object({
  enabled: Schema.boolean().default(DEFAULTS.ENABLED),
  mode: Schema.union([MODES.REGEX, MODES.REGEX_NER]).default(DEFAULTS.MODE),
  entities: Schema.array(Schema.string()).default(DEFAULTS.ENTITIES),
  scope: Schema.union([
    Schema.array(Schema.union([SCOPES.MESSAGES, SCOPES.TOOLS])),
    Schema.union([SCOPES.MESSAGES, SCOPES.TOOLS]),
  ]).default(DEFAULTS.SCOPE),
  registerCommand: Schema.boolean().default(DEFAULTS.REGISTER_COMMAND),
  registerTools: Schema.boolean().default(DEFAULTS.REGISTER_TOOLS),
  persistRestoreTable: Schema.boolean().default(DEFAULTS.PERSIST_RESTORE_TABLE),
  maxRestoreEntriesPerSession: Schema.number().default(DEFAULTS.MAX_RESTORE_ENTRIES_PER_SESSION),
  maxSessions: Schema.number().default(DEFAULTS.MAX_SESSIONS),
  maskClientEnabled: Schema.boolean().default(DEFAULTS.MASK_CLIENT_ENABLED),
})

/**
 * 显式补齐默认 + 加载期校验（非法配置响亮失败）。
 * @param {Partial<Config>|undefined} config - cordis loader 传入的配置。
 * @returns {Required<Config> & {entities: string[]}} 校验后的配置。
 */
export function resolveConfig(config = {}) {
  const rawScope = config.scope ?? DEFAULTS.SCOPE
  const resolved = {
    enabled: config.enabled ?? DEFAULTS.ENABLED,
    mode: config.mode ?? DEFAULTS.MODE,
    entities: [...(config.entities ?? DEFAULTS.ENTITIES)],
    scope: typeof rawScope === 'string' ? [rawScope] : [...rawScope],
    registerCommand: config.registerCommand ?? DEFAULTS.REGISTER_COMMAND,
    registerTools: config.registerTools ?? DEFAULTS.REGISTER_TOOLS,
    persistRestoreTable: config.persistRestoreTable ?? DEFAULTS.PERSIST_RESTORE_TABLE,
    maxRestoreEntriesPerSession: config.maxRestoreEntriesPerSession ?? DEFAULTS.MAX_RESTORE_ENTRIES_PER_SESSION,
    maxSessions: config.maxSessions ?? DEFAULTS.MAX_SESSIONS,
    maskClientEnabled: config.maskClientEnabled ?? DEFAULTS.MASK_CLIENT_ENABLED,
  }
  if (resolved.enabled === false) return resolved

  if (resolved.mode === MODES.REGEX_NER) {
    throw nerModeUnsupported(resolved.mode)
  }
  if (resolved.mode !== MODES.REGEX) {
    throw badConfig(`mode ${JSON.stringify(resolved.mode)} must be one of regex|regex+ner`)
  }
  const scopeSeen = new Set()
  resolved.scope = resolved.scope.filter((surface) => {
    if (scopeSeen.has(surface)) return false
    scopeSeen.add(surface)
    return true
  })
  if (resolved.scope.length === 0) {
    throw badConfig('scope must list at least one surface (messages and/or tools)')
  }
  for (const surface of resolved.scope) {
    if (surface !== SCOPES.MESSAGES && surface !== SCOPES.TOOLS) {
      throw scopeUnsupported(surface)
    }
  }
  const seen = new Set()
  resolved.entities = resolved.entities.filter((entity) => {
    if (seen.has(entity)) return false
    seen.add(entity)
    return true
  })
  if (resolved.entities.length === 0) {
    throw badConfig('entities must list at least one entity type')
  }
  if (resolved.entities.length > LIMITS.MAX_ENTITY_COUNT) {
    throw badConfig(`entities must list at most ${LIMITS.MAX_ENTITY_COUNT} types`)
  }
  for (const entity of resolved.entities) {
    if (!ENTITY_NAMES.includes(entity)) {
      throw badConfig(`unknown entity ${JSON.stringify(entity)}; valid: ${ENTITY_NAMES.join(', ')}`)
    }
    if (NER_ENTITIES.includes(entity)) {
      throw nerUnsupported(entity)
    }
  }
  if (!Number.isInteger(resolved.maxRestoreEntriesPerSession)
    || resolved.maxRestoreEntriesPerSession < LIMITS.MIN_RESTORE_ENTRIES
    || resolved.maxRestoreEntriesPerSession > LIMITS.MAX_RESTORE_ENTRIES) {
    throw badConfig(`maxRestoreEntriesPerSession must be an integer in [${LIMITS.MIN_RESTORE_ENTRIES}, ${LIMITS.MAX_RESTORE_ENTRIES}]`)
  }
  if (!Number.isInteger(resolved.maxSessions)
    || resolved.maxSessions < LIMITS.MIN_SESSIONS
    || resolved.maxSessions > LIMITS.MAX_SESSIONS) {
    throw badConfig(`maxSessions must be an integer in [${LIMITS.MIN_SESSIONS}, ${LIMITS.MAX_SESSIONS}]`)
  }
  return resolved
}

/** /mask 命令帮助文案。 */
const HELP_TEXT = [
  'mask: usage — /mask [status | on | off | restore <text> | help]',
  '  status   show masking state: enabled, total replaced, type distribution (default)',
  '  on       enable masking at runtime (config.enabled is the persistent switch)',
  '  off      disable masking at runtime',
  '  restore  unmap placeholders in <text> back to the values stored for this session',
].join('\n')

/**
 * /mask status 渲染（纯函数）。
 * @param {{enabled: boolean, replaced: number, distribution: Record<string, number>}} stats - 统计。
 * @returns {string} 状态文本。
 */
export function renderStatus(stats) {
  const distribution = Object.entries(stats.distribution ?? {}).sort((a, b) => b[1] - a[1])
  return [
    `mask: ${stats.enabled ? 'enabled' : 'disabled (runtime off)'}`,
    `  replaced: ${stats.replaced} total`,
    `  distribution: ${distribution.length === 0 ? '(none yet)' : distribution.map(([label, count]) => `${label}=${count}`).join(', ')}`,
  ].join('\n')
}

/**
 * mask_test 结果渲染（纯函数）。
 * @param {{ok: boolean, masked?: string, replaced?: number, distribution?: Array<{label?: string, count?: number}>, error?: string}} value - 工具结果。
 * @returns {string} 渲染文本。
 */
export function renderMaskTest(value) {
  if (!value.ok) return `mask_test failed: ${value.error ?? 'unknown error'}`
  const distribution = (value.distribution ?? []).map((entry) => `${entry.label}=${entry.count}`).join(', ')
  return [
    `mask_test: replaced ${value.replaced} PII value(s)${distribution ? ` (${distribution})` : ''}`,
    'masked:',
    value.masked,
  ].join('\n')
}

/**
 * mask_test 工具定义：试跑一段文本看替换效果；绝不回显原文。
 * @param {string[]} entities - 启用的实体类型。
 * @param {number} maxEntries - 单次 stripper 条目上限。
 * @returns {object} 工具定义。
 */
export function makeMaskTestTool(entities, maxEntries) {
  return defineTool({
    name: TOOL_MASK_TEST,
    description: 'Mask a snippet of text through the PII detector and report the placeholder result plus the replacement count and type distribution. It never returns the original values.',
    parameters: {
      text: { type: 'string', required: true, description: 'The text to run through the PII masker. Detected PII (phone, email, ID card, bank card, key, IP, as configured) is replaced with <TYPE_N> placeholders.' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          masked: { type: 'string' },
          replaced: { type: 'integer' },
          distribution: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                label: { type: 'string' },
                count: { type: 'integer' },
              },
            },
          },
          error: { type: 'string' },
        },
      },
      render(_args, value) {
        return [{ type: 'text', text: renderMaskTest(value) }]
      },
    },
    async execute(args, exec) {
      exec.signal?.throwIfAborted()
      try {
        const stripper = createStripper({ entities, maxEntries })
        const masked = stripper.strip(args.text)
        const stats = stripper.stats()
        return {
          ok: true,
          masked,
          replaced: stats.replaced,
          distribution: Object.entries(stats.distribution).map(([label, count]) => ({ label, count })),
        }
      } catch (error) {
        return { ok: false, masked: '', replaced: 0, distribution: [], error: messageOf(error) }
      }
    },
  })
}

/**
 * 插件挂载。enabled:false 时不注册任何东西；非法配置在加载期响亮抛错。
 * @param {import('@deepseek-ai/cordis').Context} ctx - Cordis 上下文。
 * @param {Partial<Config>} [config] - 插件配置。
 */
export function apply(ctx, config = {}) {
  const resolved = resolveConfig(config)
  if (resolved.enabled === false) return

  const logger = ctx.logger(PLUGIN_NAME)
  const warn = (message) => logger.warn(message)
  const eventGate = makeEventGate(KNOWN_SESSION_EVENT_TYPES, probeIgnorableAppend())

  // --- 恢复表：可选 storageDomain 的 'dsh_mask' 领域（异步打开，操作路径 await）。
  // storageDomain 缺失（bare profile 未组合存储栈）时降级为纯内存恢复表，
  // persistRestoreTable 视为 no-op 并一次性告警（可选 seam 失败关闭，绝不卡 pending）。
  const storageDomain = ctx.get('storageDomain')
  /** @type {Promise<any>|null} 打开的领域（含 table/close），RestoreStore 按需消费。 */
  let domainPromise = null
  if (storageDomain !== undefined) {
    domainPromise = storageDomain.open(dshMaskDomainSpec).then((domain) => {
      ctx.effect(() => () => { void domain.close() }, `${PLUGIN_NAME}.domain.close`)
      return domain
    })
    domainPromise.catch(() => {}) // 消费方各自处理拒绝；此处仅避免未处理拒绝告警。
  } else if (resolved.persistRestoreTable) {
    warn('storageDomain not composed: the restore table is memory-only (lost on restart). Compose the storage stack (storage / storage-json / storage-domain) in the profile, or set persistRestoreTable: false.')
  }

  const store = new RestoreStore({
    entities: resolved.entities,
    maxEntries: resolved.maxRestoreEntriesPerSession,
    maxSessions: resolved.maxSessions,
    persist: resolved.persistRestoreTable,
    domainPromise: resolved.persistRestoreTable ? domainPromise : null,
    onError: (error) => warn(messageOf(error)),
  })

  // --- 运行时开关（/mask on|off；重启回到 config.enabled）。
  let runtimeEnabled = true

  // --- agent/pre-step 遮罩（waterfall：先 next() 取下游决策，再遮罩其消息）。
  if (resolved.scope.includes(SCOPES.MESSAGES)) {
    ctx.on('agent/pre-step', async ({ agent, messages }, next) => {
      if (!runtimeEnabled) return next()
      const decision = await next()
      if (decision.kind !== 'enter') return decision
      const sessionId = agent?.session?.id
      if (sessionId === undefined || sessionId === null || sessionId === '') return decision
      const stripper = store.stripperFor(sessionId)
      const before = stripper.stats()
      const { messages: maskedMessages, replaced } = maskMessages(decision.messages, stripper)
      if (replaced === 0) return decision
      const after = stripper.stats()
      const distribution = {}
      for (const [label, count] of Object.entries(after.distribution)) {
        const delta = count - (before.distribution[label] ?? 0)
        if (delta > 0) distribution[label] = delta
      }
      void store.persist(sessionId)
      maybeAppendSessionEvent(agent.session, SESSION_EVENTS.APPLIED, {
        sessionId,
        replaced,
        distribution,
      }, eventGate, warn)
      return { kind: 'enter', messages: maskedMessages }
    })
  }

  // --- tools/post-execute 遮罩（scope: tools）：工具结果 text 块里的 PII 在回喂模型
  // 与落盘前脱敏为占位符。工具入参本身无法在 pre-execute 改写（上游契约），故 tools
  // 作用域落在结果这一可改写的模型可见面（见 ARCHITECTURE.md）。
  if (resolved.scope.includes(SCOPES.TOOLS)) {
    ctx.on('tools/post-execute', async (exec, result, next) => {
      if (!runtimeEnabled) return next()
      const decision = await next()
      if (decision.kind !== 'accept') return decision
      const sessionId = exec?.agent?.session?.id
      if (sessionId === undefined || sessionId === null || sessionId === '') return decision
      const stripper = store.stripperFor(sessionId)
      const before = stripper.stats()
      const { blocks: maskedBlocks, replaced } = maskContentBlocks(result.content, stripper)
      if (replaced === 0) return decision
      const after = stripper.stats()
      const distribution = {}
      for (const [label, count] of Object.entries(after.distribution)) {
        const delta = count - (before.distribution[label] ?? 0)
        if (delta > 0) distribution[label] = delta
      }
      void store.persist(sessionId)
      maybeAppendSessionEvent(exec.agent?.session, SESSION_EVENTS.APPLIED, {
        sessionId,
        replaced,
        distribution,
      }, eventGate, warn)
      return { kind: 'accept', content: maskedBlocks }
    })
  }

  // Service Provider — 实现注册处：ctx.commands.register（/mask 命令）与 ctx.inject(['tools']) 的工具注册（下方两段）。
  // --- /mask 命令（Consumer）。
  if (resolved.registerCommand) {
    ctx.commands.register({
      name: COMMAND_NAME,
      description: 'PII masking status and controls: status (replaced count + type distribution), on/off (runtime toggle), restore <text> (unmap placeholders to this session\'s values), help.',
      input: { hint: '[status | on | off | restore <text> | help]' },
      async handler(invocation) {
        return handleMaskCommand(invocation)
      },
    })
  }

  /**
   * /mask 命令处理器。
   * @param {import('@deepseek-ai/dsh-commands').CommandInvocation} invocation - 命令调用。
   * @returns {Promise<import('@deepseek-ai/dsh-commands').CommandResult>} 命令结果。
   */
  async function handleMaskCommand(invocation) {
    const { agent, rawInput } = invocation
    const sessionId = agent?.session?.id
    const input = (rawInput ?? '').trim()
    const [action, ...rest] = input.split(/\s+/u)
    const actionKey = (action || 'status').toLowerCase()
    try {
      if (actionKey === 'help' || !['status', 'on', 'off', 'restore'].includes(actionKey)) {
        return { kind: 'success', text: HELP_TEXT }
      }
      if (actionKey === 'on') {
        runtimeEnabled = true
        return { kind: 'success', text: 'mask: masking enabled (runtime; config.enabled is the persistent switch)' }
      }
      if (actionKey === 'off') {
        runtimeEnabled = false
        return { kind: 'success', text: 'mask: masking disabled (runtime; re-enable with /mask on)' }
      }
      if (actionKey === 'status') {
        const stats = sessionId ? store.stats(sessionId) : { replaced: 0, distribution: {} }
        return { kind: 'success', text: renderStatus({ enabled: runtimeEnabled, ...stats }) }
      }
      if (actionKey === 'restore') {
        const snippet = rest.join(' ')
        if (sessionId === undefined || sessionId === null || sessionId === '') {
          return { kind: 'error', text: 'mask: restore requires an active session' }
        }
        if (snippet === '') {
          return { kind: 'error', text: 'mask: restore needs text, e.g. /mask restore <PHONE_1>' }
        }
        const restored = await store.restore(sessionId, snippet)
        return { kind: 'success', text: `mask: restored\n${restored}` }
      }
      return { kind: 'success', text: HELP_TEXT }
    } catch (error) {
      const message = `mask: ${actionKey} failed: ${messageOf(error)}`
      logger.error(message)
      return { kind: 'error', text: message }
    }
  }

  // --- mask_test 模型工具（Consumer；tools 服务存在时才注册，随 fiber 卸载撤销）。
  if (resolved.registerTools) {
    ctx.inject(['tools'], (toolCtx) => {
      toolCtx.tools.register(makeMaskTestTool(resolved.entities, resolved.maxRestoreEntriesPerSession))
    })
  }
}

export {
  // 复用/测试面：纯函数与词汇。
  RestoreStore,
  createStripper,
  maskMessages,
  maskContentBlocks,
  makeEventGate,
  maybeAppendSessionEvent,
  dshMaskDomainSpec,
  nerUnsupported,
  nerModeUnsupported,
  scopeUnsupported,
}

// lib/constants.mjs — 词汇表与协议常量（零依赖）。

// 插件标识、命令名与工具名。
export const PLUGIN_NAME = 'mask'
export const COMMAND_NAME = 'mask'
export const TOOL_MASK_TEST = 'mask_test'

// ctx.storageDomain 领域名（恢复表 + 统计表）。
// 下划线命名：storage-domain 的域名正则不允许连字符。
export const DOMAIN_NAME = 'dsh_mask'

// 存储领域表名。
export const RESTORE_TABLE = 'restore'

// 实体类型词汇（与 lib/strip.mjs 的检测器同源）。
// regex-capable：纯正则可检出；ner-only：需外部识别器（mode: regex+ner）。
export const ENTITY_NAMES = Object.freeze([
  'phone',
  'email',
  'id-card',
  'bank-card',
  'key',
  'ip',
  'person',
  'address',
])

export const REGEX_ENTITIES = Object.freeze(['phone', 'email', 'id-card', 'bank-card', 'key', 'ip'])
export const NER_ENTITIES = Object.freeze(['person', 'address'])

// 实体类型 -> 占位符标签（与上游 Pii-Stripper 的 ENTITY_LABEL_MAP 对齐）。
export const ENTITY_LABELS = Object.freeze({
  phone: 'PHONE',
  email: 'EMAIL',
  'id-card': 'ID_CARD',
  'bank-card': 'BANK_CARD',
  key: 'KEY',
  ip: 'IP',
  person: 'PERSON',
  address: 'ADDRESS',
})

// 检测模式词汇：regex 是唯一实现；regex+ner 为外部识别器预留（加载期响亮失败）。
export const MODES = Object.freeze({
  REGEX: 'regex',
  REGEX_NER: 'regex+ner',
})

// 作用域词汇：messages 是唯一实现（agent/pre-step 消息遮罩）；
// tools（工具入参遮罩）预留并响亮失败。
export const SCOPES = Object.freeze({
  MESSAGES: 'messages',
})

// 会话事件类型（插件自有；运行时是否 append 取决于宿主是否收录该类型，
// 或宿主 append 是否支持 ignorable 信封，见 lib/gate.mjs 的自适应门）。
export const SESSION_EVENTS = Object.freeze({
  APPLIED: 'mask/applied',
})

// 领域错误码（稳定、可路由）。
export const ERROR_CODES = Object.freeze({
  BAD_CONFIG: 'BAD_CONFIG',
  NER_UNSUPPORTED: 'NER_UNSUPPORTED',
  SCOPE_UNSUPPORTED: 'SCOPE_UNSUPPORTED',
  REGISTRY_UNAVAILABLE: 'REGISTRY_UNAVAILABLE',
})

// 默认值（Config schema 的默认与 DEFAULT_* 常量同源；cordis.yml 可整体覆盖）。
export const DEFAULTS = Object.freeze({
  ENABLED: true,
  MODE: MODES.REGEX,
  ENTITIES: ['phone', 'email', 'id-card', 'bank-card', 'key'],
  SCOPE: SCOPES.MESSAGES,
  REGISTER_COMMAND: true,
  REGISTER_TOOLS: true,
  PERSIST_RESTORE_TABLE: true,
  MAX_RESTORE_ENTRIES_PER_SESSION: 500,
  MAX_SESSIONS: 1000,
})

// 配置字段合法性边界（加载期校验，越界响亮失败）。
export const LIMITS = Object.freeze({
  MIN_RESTORE_ENTRIES: 1,
  MAX_RESTORE_ENTRIES: 1_000_000,
  MIN_SESSIONS: 1,
  MAX_SESSIONS: 1_000_000,
  MAX_ENTITY_COUNT: 64,
  MAX_TEXT_LENGTH: 1_000_000,
})

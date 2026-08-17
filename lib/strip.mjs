// lib/strip.mjs — PII 脱敏/还原纯函数（零依赖）。
//
// 移植自上游 Pii-Stripper-Middleware 的 core.py（发送前匿名化 + 返回后恢复），
// 逐条对齐：正则检测、重叠消解（同起点取高分、区间不重叠）、相同原文复用同一
// 占位符、还原按占位符长度降序。新增：KEY（密钥）检测器（规格要求的"密钥"）、
// 每会话累计计数与类型分布（审计用，绝不含明文）、有界逐出（maxEntries）。
// 函数绝不访问 I/O；输入非字符串时保守转字符串。

import { ENTITY_LABELS, LIMITS } from './constants.mjs'

/**
 * 内置正则检测器（实体 -> 多条 pattern，各自带置信度）。
 * 与上游 REGEX_PATTERNS + 中文自定义识别器对齐，新增 key（密钥）检测器。
 * 每条 pattern 都以 g 标志编译（供 matchAll 遍历）。
 */
export const BUILTIN_PATTERNS = Object.freeze([
  { entity: 'phone', source: /(?<!\d)1[3-9]\d{9}(?!\d)/gu, score: 0.95 },
  { entity: 'id-card', source: /(?<!\d)\d{17}[\dXx](?!\d)/gu, score: 0.92 },
  { entity: 'email', source: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gu, score: 0.9 },
  { entity: 'bank-card', source: /(?<!\d)\d{16,19}(?!\d)/gu, score: 0.65 },
  { entity: 'ip', source: /\b(?:\d{1,3}\.){3}\d{1,3}\b/gu, score: 0.85 },
  { entity: 'key', source: /sk-[A-Za-z0-9_-]{16,}/gu, score: 0.95 },
  { entity: 'key', source: /gh[pousr]_[A-Za-z0-9]{16,}/gu, score: 0.95 },
  { entity: 'key', source: /xox[baprs]-[A-Za-z0-9-]{10,}/gu, score: 0.9 },
  { entity: 'key', source: /AKIA[0-9A-Z]{16}/gu, score: 0.9 },
  { entity: 'key', source: /Bearer[ \t]+[A-Za-z0-9._~+/=-]{8,}/gu, score: 0.9 },
])

/**
 * 检测到的一个 PII 实体片段。
 * @typedef {{text: string, entity: string, label: string, start: number, end: number, score: number}} PIIEntity
 */

/**
 * PII 脱敏器：把 PII 替换为 `<LABEL_N>` 占位符，并能按映射还原。
 *
 * 同一会话内跨请求累计（stripInto 不重置），保证同一原文始终复用同一占位符，
 * 使模型在整段历史里看到的占位符语义一致；strip() 是单次模式（每次重置），
 * 供 mask_test 这类"试跑一段文本"的独立场景使用。
 */
export class Stripper {
  /**
   * @param {object} options - {patterns: Array<{entity: string, source: RegExp, score: number}>, maxEntries?: number}。
   */
  constructor(options) {
    this.patterns = options.patterns
    this.maxEntries = options.maxEntries ?? LIMITS.MAX_RESTORE_ENTRIES
    this.reset()
  }

  /** 清空占位符计数、映射与统计（每次单次 strip 前调用）。 */
  reset() {
    /** @type {Map<string, number>} 标签 -> 已生成占位符数（单调递增，保证跨请求唯一）。 */
    this.counter = new Map()
    /** @type {Map<string, string>} 占位符 -> 原文（还原用）。 */
    this.placeholderMap = new Map()
    /** @type {Map<string, string>} 原文 -> 占位符（相同原文复用）。 */
    this.valueMap = new Map()
    this.totalReplaced = 0
    /** @type {Map<string, number>} 标签 -> 累计替换次数（审计分布）。 */
    this.distribution = new Map()
  }

  /**
   * 单次脱敏：先重置再替换，返回脱敏文本（上游 strip 语义）。
   * @param {unknown} text - 待脱敏文本（非字符串保守转字符串）。
   * @returns {string} 脱敏后的文本。
   */
  strip(text) {
    this.reset()
    return this._apply(text)
  }

  /**
   * 累计脱敏：不重置，返回本次替换的增量统计。
   * @param {unknown} text - 待脱敏文本（非字符串保守转字符串）。
   * @returns {{text: string, replaced: number, distribution: Record<string, number>}} 脱敏文本 + 本次增量。
   */
  stripInto(text) {
    const startReplaced = this.totalReplaced
    const startDist = new Map(this.distribution)
    const out = this._apply(text)
    const replaced = this.totalReplaced - startReplaced
    const distribution = /** @type {Record<string, number>} */ ({})
    for (const [label, count] of this.distribution) {
      const before = startDist.get(label) ?? 0
      if (count > before) distribution[label] = count - before
    }
    return { text: out, replaced, distribution }
  }

  /**
   * 把脱敏文本中的占位符还原为原文（按占位符长度降序，避免短占位符提前匹配）。
   * @param {string} text - 含占位符的文本。
   * @returns {string} 还原后的文本。
   */
  restore(text) {
    if (typeof text !== 'string') return String(text)
    let result = text
    const entries = [...this.placeholderMap.entries()].sort((a, b) => b[0].length - a[0].length)
    for (const [placeholder, original] of entries) {
      result = result.split(placeholder).join(original)
    }
    return result
  }

  /** @returns {Record<string, string>} {占位符: 原文} 只读副本。 */
  mapping() {
    return Object.fromEntries(this.placeholderMap)
  }

  /**
   * 从持久化的 {占位符: 原文} 映射回载（恢复表跨重启还原）。
   * 回载后重建各标签计数，保证后续新占位符编号继续单调不冲突。
   * 累计统计（totalReplaced/distribution）属于进程内遥测，不回载。
   * @param {Record<string, string>} entries - 占位符到原文的映射。
   */
  loadMapping(entries) {
    for (const [placeholder, original] of Object.entries(entries ?? {})) {
      this.placeholderMap.set(placeholder, original)
      this.valueMap.set(original, placeholder)
      const match = /^<([A-Z_]+)_(\d+)>$/u.exec(placeholder)
      if (match !== null) {
        const label = match[1]
        const number = Number(match[2])
        const current = this.counter.get(label) ?? 0
        if (number > current) this.counter.set(label, number)
      }
    }
  }

  /**
   * 累计统计（审计用）：替换总数 + 类型分布。绝不含原文与映射。
   * @returns {{replaced: number, distribution: Record<string, number>}} 统计。
   */
  stats() {
    return { replaced: this.totalReplaced, distribution: Object.fromEntries(this.distribution) }
  }

  /**
   * 检测 + 重叠消解 + 替换，返回脱敏文本（核心管道）。
   * @param {unknown} input - 任意文本（非字符串保守转字符串）。
   * @returns {string} 脱敏文本。
   */
  _apply(input) {
    const text = typeof input === 'string' ? input : String(input)
    if (text.length === 0 || text.length > LIMITS.MAX_TEXT_LENGTH) return text
    const entities = this._detect(text)
    const resolved = this._resolveOverlaps(entities)
    return this._applyReplacements(text, resolved)
  }

  /**
   * 正则检测全部实体。
   * @param {string} text - 文本。
   * @returns {PIIEntity[]} 实体列表。
   */
  _detect(text) {
    /** @type {PIIEntity[]} */
    const entities = []
    for (const pattern of this.patterns) {
      for (const match of text.matchAll(pattern.source)) {
        entities.push({
          text: match[0],
          entity: pattern.entity,
          label: ENTITY_LABELS[pattern.entity] ?? pattern.entity,
          start: match.index,
          end: match.index + match[0].length,
          score: pattern.score,
        })
      }
    }
    return entities
  }

  /**
   * 重叠消解：按起点升序、同起点按置信度降序；与已选实体重叠者丢弃
   * （上游先到先得 + 同位置取高分语义）。
   * @param {PIIEntity[]} entities - 未消解实体。
   * @returns {PIIEntity[]} 消解后实体。
   */
  _resolveOverlaps(entities) {
    if (entities.length === 0) return []
    const sorted = [...entities].sort((a, b) => a.start - b.start || b.score - a.score)
    const result = []
    let lastEnd = -1
    for (const entity of sorted) {
      if (entity.start >= lastEnd) {
        result.push(entity)
        lastEnd = entity.end
      }
    }
    return result
  }

  /**
   * 逐实体替换为占位符（相同原文复用同一占位符），并累计统计。
   * @param {string} text - 原文。
   * @param {PIIEntity[]} entities - 已消解实体（按起点升序）。
   * @returns {string} 脱敏文本。
   */
  _applyReplacements(text, entities) {
    const parts = []
    let lastEnd = 0
    for (const entity of [...entities].sort((a, b) => a.start - b.start)) {
      parts.push(text.slice(lastEnd, entity.start))
      const original = entity.text
      let placeholder = this.valueMap.get(original)
      if (placeholder === undefined) {
        placeholder = this._makePlaceholder(entity.label)
        this.placeholderMap.set(placeholder, original)
        this.valueMap.set(original, placeholder)
      }
      parts.push(placeholder)
      lastEnd = entity.end
      this.totalReplaced += 1
      this.distribution.set(entity.label, (this.distribution.get(entity.label) ?? 0) + 1)
    }
    parts.push(text.slice(lastEnd))
    this._prune()
    return parts.join('')
  }

  /**
   * 生成唯一占位符 `<LABEL_N>`；计数单调递增，跨请求不重复。
   * @param {string} label - 实体标签。
   * @returns {string} 占位符。
   */
  _makePlaceholder(label) {
    const count = (this.counter.get(label) ?? 0) + 1
    this.counter.set(label, count)
    return `<${label}_${count}>`
  }

  /** 超过 maxEntries 时逐出最旧映射（计数仍单调，还原旧占位符会失效，可预期）。 */
  _prune() {
    while (this.placeholderMap.size > this.maxEntries) {
      const oldest = this.placeholderMap.keys().next().value
      const original = this.placeholderMap.get(oldest)
      this.placeholderMap.delete(oldest)
      if (original !== undefined) this.valueMap.delete(original)
    }
  }
}

/**
 * 按启用的实体集创建脱敏器。
 * @param {object} [options] - {entities?: string[], maxEntries?: number}。
 * @returns {Stripper} 配置好的脱敏器。
 */
export function createStripper(options = {}) {
  const enabled = new Set(options.entities ?? Object.keys(ENTITY_LABELS))
  const patterns = BUILTIN_PATTERNS.filter(pattern => enabled.has(pattern.entity))
  return new Stripper({ patterns, maxEntries: options.maxEntries })
}

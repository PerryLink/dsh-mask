// lib/store.mjs — 恢复表存储（内存 Stripper + 受控 storageDomain 持久化，零 I/O 除领域读写）。

import { createStripper } from './strip.mjs'
import { DEFAULTS, RESTORE_TABLE } from './constants.mjs'
import { registryUnavailable } from './errors.mjs'

/**
 * 恢复表：每会话一个累计 Stripper（内存），可选持久化映射到 storageDomain。
 *
 * 不变量：PII 原文只出现在这里的内存 Map 与受控 storageDomain（persist 开启时），
 * 绝不进会话日志。mask/stats 走内存；restore 内存未命中时若 persist 开启则从
 * 领域回载（跨重启还原）。
 */
export class RestoreStore {
  /**
   * @param {object} options - {entities, maxEntries, maxSessions, persist, domainPromise, onError}。
   *   domainPromise 为 Promise<{table(name): {get, put}}> | null。
   */
  constructor(options) {
    this.entities = options.entities ?? DEFAULTS.ENTITIES
    this.maxEntries = options.maxEntries ?? DEFAULTS.MAX_RESTORE_ENTRIES_PER_SESSION
    this.maxSessions = options.maxSessions ?? DEFAULTS.MAX_SESSIONS
    this.persistEnabled = options.persist ?? DEFAULTS.PERSIST_RESTORE_TABLE
    this.domainPromise = options.domainPromise ?? null
    this.onError = options.onError ?? (() => {})
    /** @type {Map<string, import('./strip.mjs').Stripper>} 会话 id -> 累计脱敏器（LRU）。 */
    this.strippers = new Map()
  }

  /**
   * 取得（或创建）会话的累计脱敏器。
   * @param {string} sessionId - 会话 id。
   * @returns {import('./strip.mjs').Stripper} 脱敏器。
   */
  stripperFor(sessionId) {
    let stripper = this.strippers.get(sessionId)
    if (stripper === undefined) {
      stripper = createStripper({ entities: this.entities, maxEntries: this.maxEntries })
      this.strippers.set(sessionId, stripper)
      this._pruneSessions()
    }
    return stripper
  }

  /**
   * 累计遮罩一段文本（本会话占位符不重置）。
   * @param {string} sessionId - 会话 id。
   * @param {string} text - 待遮罩文本。
   * @returns {{text: string, replaced: number, distribution: Record<string, number>}} 遮罩结果 + 本次增量。
   */
  mask(sessionId, text) {
    return this.stripperFor(sessionId).stripInto(text)
  }

  /**
   * 会话累计统计（审计用，绝不含原文）。
   * @param {string} sessionId - 会话 id。
   * @returns {{replaced: number, distribution: Record<string, number>}} 统计。
   */
  stats(sessionId) {
    return this.stripperFor(sessionId).stats()
  }

  /**
   * 还原一段文本中的占位符；内存未命中且 persist 开启时从领域回载。
   * @param {string} sessionId - 会话 id。
   * @param {string} text - 含占位符文本。
   * @returns {Promise<string>} 还原后的文本。
   */
  async restore(sessionId, text) {
    let stripper = this.strippers.get(sessionId)
    if (stripper === undefined && this.persistEnabled && this.domainPromise !== null) {
      stripper = await this._load(sessionId)
    }
    if (stripper === undefined) return text
    return stripper.restore(text)
  }

  /**
   * 持久化会话映射到 storageDomain（尽力而为；失败仅上报，绝不阻断遮罩）。
   * @param {string} sessionId - 会话 id。
   * @returns {Promise<void>}
   */
  async persist(sessionId) {
    if (!this.persistEnabled || this.domainPromise === null) return
    const stripper = this.strippers.get(sessionId)
    if (stripper === undefined) return
    try {
      const domain = await this.domainPromise
      const table = domain.table(RESTORE_TABLE)
      await table.put(sessionId, { sessionId, entries: stripper.mapping(), updatedAt: Date.now() })
    } catch (error) {
      this.onError(registryUnavailable(error instanceof Error ? error.message : String(error)))
    }
  }

  /**
   * 从领域回载会话映射。
   * @param {string} sessionId - 会话 id。
   * @returns {Promise<import('./strip.mjs').Stripper|undefined>} 脱敏器或 undefined。
   */
  async _load(sessionId) {
    try {
      const domain = await this.domainPromise
      const record = await domain.table(RESTORE_TABLE).get(sessionId)
      if (record === undefined || record.entries === undefined) return undefined
      const stripper = createStripper({ entities: this.entities, maxEntries: this.maxEntries })
      stripper.loadMapping(record.entries)
      this.strippers.set(sessionId, stripper)
      this._pruneSessions()
      return stripper
    } catch (error) {
      this.onError(registryUnavailable(error instanceof Error ? error.message : String(error)))
      return undefined
    }
  }

  /** 会话数超限时逐出最久未用（映射仍在领域，restore 按需回载）。 */
  _pruneSessions() {
    while (this.strippers.size > this.maxSessions) {
      const oldest = this.strippers.keys().next().value
      this.strippers.delete(oldest)
    }
  }
}

// lib/errors.mjs — 结构化领域错误（code + details，零依赖）。

import { ERROR_CODES } from './constants.mjs'

/**
 * 插件领域错误基类：稳定 code 供 UI/日志路由，details 携带机器可读事实。
 */
export class MaskError extends Error {
  /**
   * @param {string} code - ERROR_CODES 之一。
   * @param {string} message - 面向用户的说明。
   * @param {object} [details] - 可选结构化事实。
   */
  constructor(code, message, details = undefined) {
    super(message)
    this.name = 'MaskError'
    this.code = code
    this.details = details
  }
}

/**
 * 配置非法（加载期响亮失败用）。
 * @param {string} message - 具体非法项说明。
 * @returns {MaskError} code=BAD_CONFIG。
 */
export function badConfig(message) {
  return new MaskError(ERROR_CODES.BAD_CONFIG, `dsh-mask config: ${message}`)
}

/**
 * 配置请求了 NER（姓名/地址）识别，但纯 host 零依赖形态未捆绑识别器。
 * @param {string} entity - 触发失败的实体名。
 * @returns {MaskError} code=NER_UNSUPPORTED。
 */
export function nerUnsupported(entity) {
  return new MaskError(
    ERROR_CODES.NER_UNSUPPORTED,
    `entity ${JSON.stringify(entity)} requires mode "regex+ner" (name/address recognition), which the pure-host form does not bundle`,
    { entity },
  )
}

/**
 * 配置请求了 regex+ner 检测模式（姓名/地址识别），但纯 host 零依赖形态未捆绑识别器。
 * @param {unknown} mode - 配置值。
 * @returns {MaskError} code=NER_UNSUPPORTED。
 */
export function nerModeUnsupported(mode) {
  return new MaskError(
    ERROR_CODES.NER_UNSUPPORTED,
    `mode ${JSON.stringify(mode)} (name/address recognition) is not bundled in the pure-host zero-dependency form; use "regex"`,
    { mode },
  )
}

/**
 * 配置请求了未实现的作用域。
 * @param {unknown} scope - 配置值。
 * @returns {MaskError} code=SCOPE_UNSUPPORTED。
 */
export function scopeUnsupported(scope) {
  return new MaskError(
    ERROR_CODES.SCOPE_UNSUPPORTED,
    `scope ${JSON.stringify(scope)} is not implemented (only "messages" is; tool-argument masking is reserved)`,
    { scope },
  )
}

/**
 * 恢复/统计领域不可用（打开/读写失败）。
 * @param {string} reason - 失败原因。
 * @returns {MaskError} code=REGISTRY_UNAVAILABLE。
 */
export function registryUnavailable(reason) {
  return new MaskError(ERROR_CODES.REGISTRY_UNAVAILABLE, `dsh-mask storage domain unavailable: ${reason}`, { reason })
}

/**
 * 任意值 → 稳定消息文本（日志/结果用，不信任其字符串转换）。
 * @param {unknown} error - 任意抛出的值。
 * @returns {string} 消息文本。
 */
export function messageOf(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

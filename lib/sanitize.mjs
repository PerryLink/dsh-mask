// lib/sanitize.mjs — 展示/日志脱敏纯函数（零依赖）。
//
// 规则：任何可能携带 PII 原文的文本在进入日志、命令结果或工具结果前都必须
// 过这里的纯函数。函数绝不抛错、绝不访问 I/O；输入不合法时返回保守的脱敏文本。
// 复用 lib/strip.mjs 的检测器词汇，保证"脱敏"与"遮罩"覆盖同一套 PII 类型。

import { BUILTIN_PATTERNS } from './strip.mjs'

/** 合并全部内置检测器为单条脱敏正则（按 PII 原文整体打码）。 */
const REDACT_RE = new RegExp(BUILTIN_PATTERNS.map(pattern => pattern.source.source).join('|'), 'gu')

/** key=value 形态的凭据（值整体打码；键名保留供定位）。 */
const CREDENTIAL_ASSIGNMENT = /\b((?:api[_-]?key|access[_-]?token|auth[_-]?token|refresh[_-]?token|password|passwd|client[_-]?secret|private[_-]?key)\s*=\s*)([^\s&;,]+)/giu

/** URL userinfo（user:password@）——错误消息可能回显远端地址。 */
const URL_USERINFO = /\/\/([^/\s:@]+):([^/\s@]+)@/gu

/**
 * 文本脱敏：PII 实体、密钥赋值、URL 凭据整体打码。
 * 非字符串输入先 String() 强转（绝不抛错——测试锁定此契约）。
 * @param {unknown} text - 任意输出文本（错误消息、命令/工具结果等）。
 * @returns {string} 脱敏文本。
 */
export function redactText(text) {
  if (typeof text !== 'string') return String(text)
  return text
    .replace(URL_USERINFO, '//***@')
    .replace(CREDENTIAL_ASSIGNMENT, '$1***')
    .replace(REDACT_RE, '***')
}

/**
 * 映射表脱敏：把 {占位符: 原文} 归约为 {占位符: '***'} 的安全摘要。
 * 用于任何"必须展示映射却绝不含原文"的边界；正常路径根本不应序列化映射。
 * @param {unknown} mapping - 占位符到原文的映射（或任意输入）。
 * @returns {Record<string, string>} 仅含占位符键的安全摘要。
 */
export function redactMapping(mapping) {
  if (mapping === null || typeof mapping !== 'object') return /** @type {Record<string, string>} */ ({})
  const out = /** @type {Record<string, string>} */ ({})
  for (const [placeholder] of Object.entries(mapping)) {
    out[placeholder] = '***'
  }
  return out
}

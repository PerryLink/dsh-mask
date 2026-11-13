// lib/mask.mjs — 消息遮罩助手（零依赖；把 UserMessage 的文本内容块替换为占位符）。

/**
 * 可脱敏的文本载体：text（可见文本）与 reasoning（思考内容）。
 * reasoning 块在思考模式下会作为 thinking 块回传给模型，而且最常逐字复述
 * 用户原文（含 PII/密钥）；它与 text 一样承载可检测文本，必须同等脱敏。
 * 处理时只替换 text 字段，块类型与块顺序保持不变。
 */
const TEXT_BLOCK_TYPES = new Set(['text', 'reasoning'])

/**
 * 遮罩单条 UserMessage 的文本内容块（text 与 reasoning；保留消息结构与来源，
 * 仅替换 text 字段）。
 * 非文本块（图片、工具调用等）原样保留，向前兼容。
 * @param {object} message - UserMessage（含 content 数组）。
 * @param {import('./strip.mjs').Stripper} stripper - 累计脱敏器。
 * @returns {{message: object, replaced: number}} 遮罩后消息与本次替换数。
 */
export function maskMessage(message, stripper) {
  if (message === null || typeof message !== 'object' || !Array.isArray(message.content)) {
    return { message, replaced: 0 }
  }
  let replaced = 0
  let changed = false
  const content = message.content.map((block) => {
    if (block === null || typeof block !== 'object' || !TEXT_BLOCK_TYPES.has(block.type) || typeof block.text !== 'string') {
      return block
    }
    const result = stripper.stripInto(block.text)
    if (result.replaced > 0) {
      replaced += result.replaced
      changed = true
    }
    return { ...block, text: result.text }
  })
  if (!changed) return { message, replaced: 0 }
  return { message: { ...message, content }, replaced }
}

/**
 * 遮罩消息数组，返回遮罩后数组与总替换数。
 * @param {object[]} messages - UserMessage 数组。
 * @param {import('./strip.mjs').Stripper} stripper - 累计脱敏器。
 * @returns {{messages: object[], replaced: number}} 遮罩后数组与总替换数。
 */
export function maskMessages(messages, stripper) {
  let replaced = 0
  const masked = (Array.isArray(messages) ? messages : []).map((message) => {
    const result = maskMessage(message, stripper)
    replaced += result.replaced
    return result.message
  })
  return { messages: masked, replaced }
}

/**
 * 遮罩任意内容块数组（工具结果等的 text / reasoning 块），非文本块原样保留。
 * @param {object[]} blocks - 内容块数组（含 {type:'text'|'reasoning', text}）。
 * @param {import('./strip.mjs').Stripper} stripper - 累计脱敏器。
 * @returns {{blocks: object[], replaced: number}} 遮罩后数组与本次替换数。
 */
export function maskContentBlocks(blocks, stripper) {
  if (!Array.isArray(blocks)) return { blocks, replaced: 0 }
  let replaced = 0
  let changed = false
  const masked = blocks.map((block) => {
    if (block === null || typeof block !== 'object' || !TEXT_BLOCK_TYPES.has(block.type) || typeof block.text !== 'string') {
      return block
    }
    const result = stripper.stripInto(block.text)
    if (result.replaced > 0) {
      replaced += result.replaced
      changed = true
    }
    return { ...block, text: result.text }
  })
  if (!changed) return { blocks, replaced: 0 }
  return { blocks: masked, replaced }
}

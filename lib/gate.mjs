// lib/gate.mjs — 会话事件自适应门（零依赖）。

import { PLUGIN_NAME } from './constants.mjs'

/**
 * 会话事件自适应门：决策函数返回是否 append 以及是否带 ignorable 信封。
 * 宿主 KNOWN_SESSION_EVENT_TYPES 收录的类型直接 append；未收录但宿主 append
 * 支持 ignorable 信封（运行时探测）时以 { ignorable: true } append；其余
 * 拒绝（rc.6：未收录类型落盘会让会话下次加载被持久化层拒绝）。
 * @param {ReadonlySet<string>} knownTypes - KNOWN_SESSION_EVENT_TYPES。
 * @param {boolean} [ignorableAppend] - 宿主 append 是否盖章 ignorable 信封。
 * @returns {(type: string) => {append: boolean, ignorable: boolean}} 决策函数。
 */
export function makeEventGate(knownTypes, ignorableAppend = false) {
  return (type) => {
    if (knownTypes.has(type)) return { append: true, ignorable: false }
    if (ignorableAppend) return { append: true, ignorable: true }
    return { append: false, ignorable: false }
  }
}

/**
 * 自适应 append：门通过才写会话事件；append 本身失败只警告绝不破坏会话。
 * @param {object|null|undefined} session - Session（缺失即跳过）。
 * @param {string} type - 事件类型。
 * @param {object} data - 载荷。
 * @param {(type: string) => {append: boolean, ignorable: boolean}} gate - makeEventGate 产物。
 * @param {(message: string) => void} warn - 日志警告。
 * @returns {unknown} 已 append 事件或 undefined。
 */
export function maybeAppendSessionEvent(session, type, data, gate, warn) {
  if (session === null || session === undefined) return undefined
  const decision = gate(type)
  if (!decision.append) return undefined
  try {
    return session.append(type, data, decision.ignorable ? { ignorable: true } : undefined)
  } catch (error) {
    warn(`${PLUGIN_NAME} session event ${type} append failed: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
}

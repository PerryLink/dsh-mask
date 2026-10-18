// lib/deliver.mjs — 还原结果的受控明文交付（唯一的非日志用户可见通道，零 DSH 依赖）。
//
// 为什么需要这个模块：宿主把命令结果**原样**写进持久会话日志，并且用户可见的命令
// 输出正是从那条日志事件渲染出来的（两条通道同源，无法分离）：
//   - 落盘：dsh-commands `execute()` → `appendLifecycle(session, 'command/done', {text: result.text})`
//     （`types.ts` 的 `command/done` 声明明说 text 是处理器结果的 verbatim 文本）。
//   - 渲染：client `ui-chat` 的 command 节点由 `command/done` 事件构造，`GenericCommandCard`
//     直接渲染 `node.outcome.text`（即同一条事件的 text）。
// 所以：命令结果里放什么，就等于往会话日志里放什么，也就等于往用户的转录里放什么；
// 宿主没有任何「记日志但不渲染」或「渲染但不记日志」的开关（`recordInput` 只管输入侧）。
// 结论：还原出的明文**绝不可**放进命令结果，只能走这条受控文件通道，把路径回给用户。
//
// 落点与收敛：每个会话固定一个文件（文件名 = 会话 id 的 sha256 前 16 位十六进制，
// 不含会话 id 本身、更不含原文），下一次还原覆盖同一个文件 ⇒ 磁盘上的明文副本数量
// 有界（每会话至多一份），不会随还原次数累积。
//
// 权限与失败关闭：目录 0700、文件 0600（POSIX；Windows 上 chmod 只影响只读位，无害）。
// 目录与目标文件都先 lstat 并拒绝符号链接，避免把 PII 写进他人预置的软链指向处；
// 目录属主不是当前用户时拒绝写入。任何一步失败都抛错，由调用方转成不泄露原文的错误
// 结果——绝不回退到「把明文放进命令结果」。

import { createHash } from 'node:crypto'
import { chmod, lstat, mkdir, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

/** 默认交付目录名（`restoreDir` 配空时的落点，位于系统临时目录下）。 */
export const RESTORE_DIR_NAME = 'dsh-mask-restore'

/** 交付文件名前缀（真正写入前先 lstat 拒绝符号链接）。 */
export const RESTORE_FILE_PREFIX = 'restore-'

/** 0644 会让同机其它用户读到 PII；目录与文件都取最小可读面。 */
const DIR_MODE = 0o700
const FILE_MODE = 0o600

/**
 * 解析交付目录：配置为空串（默认）时落在 `os.tmpdir()/dsh-mask-restore`，
 * 否则按配置解析为绝对路径（相对路径相对宿主进程 cwd）。
 * 纯函数（除 `os.tmpdir()`/`path.resolve` 的宿主事实外无副作用），便于测试。
 * @param {unknown} configured - `restoreDir` 配置值。
 * @returns {string} 绝对目录路径。
 */
export function resolveRestoreDir(configured) {
  const raw = typeof configured === 'string' ? configured.trim() : ''
  return raw === '' ? path.join(os.tmpdir(), RESTORE_DIR_NAME) : path.resolve(raw)
}

/**
 * 会话的交付文件路径：`<dir>/restore-<sha256(sessionId)[0:16]>.txt`。
 * 纯函数；同一会话恒定同一个路径（覆盖语义），不同会话互不覆盖。
 * @param {string} dir - 交付目录（`resolveRestoreDir` 的结果）。
 * @param {unknown} sessionId - 会话 id。
 * @returns {string} 交付文件绝对路径。
 */
export function restoreFilePath(dir, sessionId) {
  const digest = createHash('sha256').update(String(sessionId ?? '')).digest('hex').slice(0, 16)
  return path.join(dir, `${RESTORE_FILE_PREFIX}${digest}.txt`)
}

/**
 * 目标路径必须不是符号链接：否则写入会跟随软链落到他人指定的位置。
 * @param {string} target - 待检查路径。
 * @param {string} what - 错误消息里的对象名。
 * @returns {Promise<import('node:fs').Stats|undefined>} 存在时的 lstat 结果。
 */
async function assertNotSymlink(target, what) {
  try {
    const stats = await lstat(target)
    if (stats.isSymbolicLink()) {
      throw new Error(`${what} is a symbolic link: refusing to write plaintext through it`)
    }
    return stats
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === 'ENOENT') return undefined
    throw error
  }
}

/**
 * 把还原出的明文写进受控文件（覆盖本会话上一份）。
 * 绝不返回、也绝不记录明文本身——只返回落点与字节数供结果文本使用。
 * @param {object} options - {dir, sessionId, text}。
 * @param {string} options.dir - 交付目录。
 * @param {unknown} options.sessionId - 会话 id。
 * @param {string} options.text - 还原后的明文（只写入文件，不进任何日志/结果）。
 * @returns {Promise<{path: string, bytes: number}>} 落点与 UTF-8 字节数。
 */
export async function deliverPlaintext({ dir, sessionId, text }) {
  const target = restoreFilePath(dir, sessionId)
  // Check the existing entry before mkdir: a dangling symlink makes mkdir throw
  // ENOENT, which would mask the real refusal reason and fail the wrong way.
  await assertNotSymlink(dir, 'restoreDir')
  await mkdir(dir, { recursive: true, mode: DIR_MODE })
  const dirStats = await assertNotSymlink(dir, 'restoreDir')
  if (dirStats === undefined || !dirStats.isDirectory()) {
    throw new Error('restoreDir is not a directory')
  }
  const uid = typeof process.getuid === 'function' ? process.getuid() : undefined
  if (uid !== undefined && dirStats.uid !== uid) {
    throw new Error('restoreDir is owned by another user: refusing to write plaintext there')
  }
  // 目录可能早已存在（预置或上次运行），mkdir 的 mode 不会收紧既有权限。
  await chmod(dir, DIR_MODE)
  await assertNotSymlink(target, 'restore file')
  const body = typeof text === 'string' ? text : String(text)
  await writeFile(target, body, { encoding: 'utf8', mode: FILE_MODE, flag: 'w' })
  // 覆盖写不会改既有文件的 mode，显式收紧一次。
  await chmod(target, FILE_MODE)
  return { path: target, bytes: Buffer.byteLength(body, 'utf8') }
}

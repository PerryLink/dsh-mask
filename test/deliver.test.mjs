// test/deliver.test.mjs — 还原明文交付（受控文件通道：路径推导 + 写入 + 权限 + 失败关闭）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { chmod, mkdtemp, readFile, readdir, rm, stat, symlink, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { deliverPlaintext, resolveRestoreDir, restoreFilePath, RESTORE_DIR_NAME } from '../lib/deliver.mjs'

/** 建一个临时父目录（用例自清理），不碰任何真实用户目录。 */
async function tempRoot() {
  return mkdtemp(path.join(os.tmpdir(), 'dsh-mask-deliver-test-'))
}

test('resolveRestoreDir: empty (the default) lands in the OS temp directory', () => {
  assert.equal(resolveRestoreDir(''), path.join(os.tmpdir(), RESTORE_DIR_NAME))
  assert.equal(resolveRestoreDir(undefined), path.join(os.tmpdir(), RESTORE_DIR_NAME))
  assert.equal(resolveRestoreDir('   '), path.join(os.tmpdir(), RESTORE_DIR_NAME))
})

test('resolveRestoreDir: a configured directory is trimmed and made absolute', () => {
  const configured = path.join(os.tmpdir(), 'dsh-mask-configured')
  assert.equal(resolveRestoreDir(`  ${configured}  `), configured)
  const relative = resolveRestoreDir('dsh-mask-relative-restore')
  assert.ok(path.isAbsolute(relative), 'a relative restoreDir resolves against the host cwd')
  assert.ok(relative.endsWith('dsh-mask-relative-restore'))
})

test('restoreFilePath: one stable path per session, no session id in the name', () => {
  const dir = path.join(os.tmpdir(), 'dsh-mask-path-shape')
  const first = restoreFilePath(dir, 'session-1')
  assert.equal(first, restoreFilePath(dir, 'session-1'), 'the same session always maps to one path')
  assert.equal(path.dirname(first), dir)
  assert.ok(first.endsWith('.txt'))
  assert.ok(!first.includes('session-1'), 'the file name must not embed the session id')
  assert.notEqual(first, restoreFilePath(dir, 'session-2'), 'sessions must not overwrite each other')
})

test('deliverPlaintext writes the exact text and returns the path plus byte count', async () => {
  const dir = path.join(await tempRoot(), 'restore')
  const result = await deliverPlaintext({ dir, sessionId: 's1', text: '原始值 13812345678' })
  assert.equal(result.path, restoreFilePath(dir, 's1'))
  assert.equal(result.bytes, Buffer.byteLength('原始值 13812345678', 'utf8'))
  assert.equal(await readFile(result.path, 'utf8'), '原始值 13812345678')
  assert.deepEqual(await readdir(dir), [path.basename(result.path)])
  await rm(path.dirname(dir), { recursive: true, force: true })
})

test('deliverPlaintext overwrites the session file and coerces non-strings', async () => {
  const root = await tempRoot()
  const dir = path.join(root, 'restore')
  const first = await deliverPlaintext({ dir, sessionId: 's1', text: 'first value' })
  const second = await deliverPlaintext({ dir, sessionId: 's1', text: 'second value' })
  assert.equal(first.path, second.path, 'one file per session')
  assert.deepEqual(await readdir(dir), [path.basename(second.path)], 'no accumulation of plaintext files')
  assert.equal(await readFile(second.path, 'utf8'), 'second value')
  const coerced = await deliverPlaintext({ dir, sessionId: 's1', text: /** @type {any} */ (42) })
  assert.equal(await readFile(coerced.path, 'utf8'), '42')
  await rm(root, { recursive: true, force: true })
})

test('deliverPlaintext keeps the directory private (0700) and the file private (0600)', async (t) => {
  const root = await tempRoot()
  const dir = path.join(root, 'restore')
  const written = await deliverPlaintext({ dir, sessionId: 's1', text: 'value' })
  if (process.platform === 'win32') {
    t.diagnostic('POSIX mode bits are not meaningful on Windows; the modes are still requested')
    await rm(root, { recursive: true, force: true })
    return
  }
  assert.equal((await stat(dir)).mode & 0o777, 0o700)
  assert.equal((await stat(written.path)).mode & 0o777, 0o600)
  await rm(root, { recursive: true, force: true })
})

test('deliverPlaintext tightens a pre-existing directory that was world-readable', async (t) => {
  const root = await tempRoot()
  const dir = path.join(root, 'restore')
  await deliverPlaintext({ dir, sessionId: 's1', text: 'value' })
  if (process.platform === 'win32') {
    t.diagnostic('POSIX mode bits are not meaningful on Windows')
    await rm(root, { recursive: true, force: true })
    return
  }
  await chmod(dir, 0o777)
  await deliverPlaintext({ dir, sessionId: 's1', text: 'value2' })
  assert.equal((await stat(dir)).mode & 0o777, 0o700, 'an existing loose directory is tightened')
  await rm(root, { recursive: true, force: true })
})

test('deliverPlaintext refuses a symlinked restoreDir (fail closed)', async (t) => {
  const root = await tempRoot()
  const real = path.join(root, 'real')
  const link = path.join(root, 'link')
  try {
    await symlink(real, link, 'dir')
  } catch (error) {
    t.diagnostic(`symlink unsupported here (${error.code}); skipping`)
    await rm(root, { recursive: true, force: true })
    return
  }
  await assert.rejects(
    () => deliverPlaintext({ dir: link, sessionId: 's1', text: 'value' }),
    /symbolic link/,
  )
  await rm(root, { recursive: true, force: true })
})

test('deliverPlaintext refuses a symlinked target file (fail closed)', async (t) => {
  const root = await tempRoot()
  const dir = path.join(root, 'restore')
  const elsewhere = path.join(root, 'elsewhere.txt')
  await writeFile(elsewhere, 'do not touch', 'utf8')
  const target = restoreFilePath(dir, 's1')
  await deliverPlaintext({ dir, sessionId: 'other', text: 'seed' })
  try {
    await symlink(elsewhere, target, 'file')
  } catch (error) {
    t.diagnostic(`symlink unsupported here (${error.code}); skipping`)
    await rm(root, { recursive: true, force: true })
    return
  }
  await assert.rejects(
    () => deliverPlaintext({ dir, sessionId: 's1', text: 'value' }),
    /symbolic link/,
  )
  assert.equal(await readFile(elsewhere, 'utf8'), 'do not touch', 'the link target is untouched')
  await rm(root, { recursive: true, force: true })
})

test('deliverPlaintext fails loudly when the directory cannot be a directory', async () => {
  const root = await tempRoot()
  const blocked = path.join(root, 'file-not-dir')
  await writeFile(blocked, 'x', 'utf8')
  await assert.rejects(() => deliverPlaintext({ dir: blocked, sessionId: 's1', text: 'value' }))
  await rm(root, { recursive: true, force: true })
})

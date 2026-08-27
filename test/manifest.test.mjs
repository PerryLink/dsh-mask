import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { applyEntryPatches, entryListSchema } from '@deepseek-ai/cordis-plugin-include'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const patchText = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')

// js-yaml 是 cordis-plugin-include 的依赖（pnpm 隔离模式不提升到本仓库根
// node_modules），经 include 的解析路径 resolve 它，再用 loader 同款
// entryListSchema 解析补丁，确保测试与真实 loader 的补丁语义零漂移。
const requireFromHere = createRequire(import.meta.url)
const includeEntry = requireFromHere.resolve('@deepseek-ai/cordis-plugin-include')
const yaml = createRequire(includeEntry)('js-yaml')

/** @type {Array<{id?: string, insert?: any[]}>} 解析后的 bundle patch（PatchOptions[]）。 */
const patch = yaml.load(patchText, { schema: entryListSchema })

/**
 * Row `name:` keys sit at the six-space indent directly under each `- id:`
 * list item of the bundle patch (config keys under `config:` nest deeper).
 * @param {string} text - the bundle patch text.
 * @returns {string[]} the row names in file order.
 */
function rowNames(text) {
  const names = []
  for (const line of text.split('\n')) {
    const match = /^ {6}name:\s*(?:'([^']+)'|"([^"]+)"|(\S+))\s*$/.exec(line)
    if (match) names.push(match[1] ?? match[2] ?? match[3] ?? '')
  }
  return names
}

/**
 * Row `id:` keys sit on the `- id:` list-item line at the four-space indent.
 * @param {string} text - the bundle patch text.
 * @returns {string[]} the row ids in file order.
 */
function rowIds(text) {
  const ids = []
  for (const line of text.split('\n')) {
    const match = /^ {4}- id:\s*(\S+)\s*$/.exec(line)
    if (match) ids.push(match[1])
  }
  return ids
}

test('every external patch row name is declared in dependencies or peerDependencies', () => {
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ])
  for (const name of rowNames(patchText)) {
    const own = name === pkg.name || name.startsWith(`${pkg.name}/`)
    assert.ok(own || declared.has(name), `patch row "${name}" must be declared`)
  }
})

test('the patch no longer inserts the storage stack (the host profile provides it)', () => {
  const ids = rowIds(patchText)
  for (const storage of ['storage', 'storage-json', 'storage-domain']) {
    assert.ok(!ids.includes(storage), `patch must not insert ${storage}: the web profile already composes it`)
  }
})

test('applying the patch to a web profile does not duplicate loader entry ids', () => {
  // @deepseek-ai/dsh-web-app already composes the storage stack with these ids;
  // dsh-mask's patch used to insert the same ids and crash `dsh web` with
  // "duplicate loader entry id: storage" (issue #2).
  const webProfile = [
    { id: 'storage', name: '@deepseek-ai/dsh-storage' },
    { id: 'storage-json', name: '@deepseek-ai/dsh-storage-json' },
    { id: 'storage-domain', name: '@deepseek-ai/dsh-storage-domain' },
  ]
  const composed = applyEntryPatches(webProfile, patch, () => {})
  const ids = composed.map((entry) => entry.id).filter(Boolean)
  assert.equal(new Set(ids).size, ids.length, `duplicate loader entry id under web profile: ${ids.join(', ')}`)
  assert.equal(composed.filter((entry) => entry.id === 'storage').length, 1, 'storage must be provided exactly once')
  assert.ok(ids.includes('mask'), 'the patch must still insert the mask row')
})

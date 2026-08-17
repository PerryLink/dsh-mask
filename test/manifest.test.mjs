import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const patch = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')

/**
 * Row `name:` keys sit at the six-space indent directly under each `- id:`
 * list item of the bundle patch (config keys under `config:` nest deeper).
 * @param {string} patchText - the bundle patch text.
 * @returns {string[]} the row names in file order.
 */
function rowNames(patchText) {
  const names = []
  for (const line of patchText.split('\n')) {
    const match = /^ {6}name:\s*(?:'([^']+)'|"([^"]+)"|(\S+))\s*$/.exec(line)
    if (match) names.push(match[1] ?? match[2] ?? match[3] ?? '')
  }
  return names
}

test('every external patch row name is declared in dependencies or peerDependencies', () => {
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ])
  for (const name of rowNames(patch)) {
    const own = name === pkg.name || name.startsWith(`${pkg.name}/`)
    assert.ok(own || declared.has(name), `patch row "${name}" must be declared`)
  }
})

test('the patch inserts the full storage stack for bare profiles', () => {
  const names = rowNames(patch)
  for (const storage of [
    '@deepseek-ai/dsh-storage',
    '@deepseek-ai/dsh-storage-json',
    '@deepseek-ai/dsh-storage-domain',
  ]) {
    assert.ok(names.includes(storage), `patch must insert ${storage}`)
  }
})

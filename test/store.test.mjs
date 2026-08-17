// test/store.test.mjs — 恢复表（内存累计 + 受控 storageDomain 持久化/回载）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { RestoreStore } from '../lib/store.mjs'

function makeDomain() {
  const restore = new Map()
  return {
    data: { restore },
    domain: {
      table(name) {
        const store = restore // 仅测试 restore 表。
        return {
          async get(key) { return store.get(key) },
          async put(key, value) { store.set(key, value) },
        }
      },
      async close() {},
    },
  }
}

test('mask accumulates per session and restore roundtrips', async () => {
  const store = new RestoreStore({ entities: ['phone', 'email'], maxEntries: 100, maxSessions: 10, persist: false })
  const out = store.mask('s1', '联系 13812345678')
  assert.ok(out.text.includes('<PHONE_1>'))
  assert.equal(out.replaced, 1)
  assert.equal(await store.restore('s1', '已记录 <PHONE_1>'), '已记录 13812345678')
})

test('sessions are isolated (no cross-session placeholder collision)', async () => {
  const store = new RestoreStore({ entities: ['phone'], maxEntries: 100, maxSessions: 10, persist: false })
  store.mask('s1', '13812345678')
  store.mask('s2', '18987654321')
  assert.equal(await store.restore('s1', '<PHONE_1>'), '13812345678')
  assert.equal(await store.restore('s2', '<PHONE_1>'), '18987654321')
})

test('persist writes mapping to the domain and load hydrates it', async () => {
  const { data, domain } = makeDomain()
  const store = new RestoreStore({ entities: ['phone'], maxEntries: 100, maxSessions: 10, persist: true, domainPromise: Promise.resolve(domain) })
  store.mask('s1', '13812345678')
  await store.persist('s1')
  assert.ok(data.restore.has('s1'))
  assert.equal(data.restore.get('s1').entries['<PHONE_1>'], '13812345678')

  // 模拟重启：全新 store 从同一领域回载。
  const store2 = new RestoreStore({ entities: ['phone'], maxEntries: 100, maxSessions: 10, persist: true, domainPromise: Promise.resolve(domain) })
  assert.equal(await store2.restore('s1', '<PHONE_1>'), '13812345678')
})

test('persist=false never touches the domain', async () => {
  const { data, domain } = makeDomain()
  const store = new RestoreStore({ entities: ['phone'], maxEntries: 100, maxSessions: 10, persist: false, domainPromise: Promise.resolve(domain) })
  store.mask('s1', '13812345678')
  await store.persist('s1')
  assert.equal(data.restore.size, 0)
})

test('maxEntries evicts the oldest mapping entries', () => {
  const store = new RestoreStore({ entities: ['phone'], maxEntries: 1, maxSessions: 10, persist: false })
  store.mask('s1', '13812345678')
  store.mask('s1', '18987654321') // 超过 1 条，逐出 <PHONE_1>。
  const mapping = store.stripperFor('s1').mapping()
  assert.equal(Object.keys(mapping).length, 1)
  assert.ok('<PHONE_2>' in mapping)
})

test('maxSessions evicts least-recently-used sessions', () => {
  const store = new RestoreStore({ entities: ['phone'], maxEntries: 10, maxSessions: 2, persist: false })
  store.mask('s1', '13812345678')
  store.mask('s2', '13900000000')
  store.mask('s3', '15000000000') // 逐出 s1。
  assert.ok(store.strippers.has('s3'))
  assert.ok(store.strippers.has('s2'))
  assert.ok(!store.strippers.has('s1'))
})

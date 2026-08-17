// test/mask.test.mjs — 消息遮罩（UserMessage 文本块替换，结构与来源保留）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { maskMessage, maskMessages } from '../lib/mask.mjs'
import { createStripper } from '../lib/strip.mjs'

function stripper() {
  return createStripper({ entities: ['phone', 'email', 'id-card', 'bank-card', 'key', 'ip'], maxEntries: 1000 })
}

test('maskMessage masks text blocks and preserves structure/source', () => {
  const s = stripper()
  const message = {
    content: [{ type: 'text', text: '联系 13812345678 和 a@b.com' }],
    source: { kind: 'user' },
  }
  const { message: masked, replaced } = maskMessage(message, s)
  assert.equal(replaced, 2)
  assert.equal(masked.source.kind, 'user')
  assert.ok(!masked.content[0].text.includes('13812345678'))
  assert.ok(!masked.content[0].text.includes('a@b.com'))
})

test('maskMessage leaves non-text blocks and original message unchanged when no PII', () => {
  const s = stripper()
  const message = {
    content: [{ type: 'text', text: 'no pii here' }, { type: 'image', url: 'http://x' }],
    source: { kind: 'user' },
  }
  const { message: masked, replaced } = maskMessage(message, s)
  assert.equal(replaced, 0)
  assert.equal(masked, message) // 未变化时返回原消息引用（不产生不必要拷贝）。
})

test('maskMessages totals replacements across messages', () => {
  const s = stripper()
  const messages = [
    { content: [{ type: 'text', text: '13812345678' }] },
    { content: [{ type: 'text', text: 'a@b.com' }] },
  ]
  const { messages: masked, replaced } = maskMessages(messages, s)
  assert.equal(replaced, 2)
  assert.equal(masked.length, 2)
  assert.ok(!masked[0].content[0].text.includes('13812345678'))
  assert.ok(!masked[1].content[0].text.includes('a@b.com'))
})

test('maskMessage tolerates malformed messages', () => {
  const s = stripper()
  const { message, replaced } = maskMessage(null, s)
  assert.equal(message, null)
  assert.equal(replaced, 0)
  const { replaced: r2 } = maskMessage({ content: 'not-an-array' }, s)
  assert.equal(r2, 0)
})

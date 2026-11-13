// test/mask.test.mjs — 消息遮罩（UserMessage 文本块替换，结构与来源保留）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { maskMessage, maskMessages, maskContentBlocks } from '../lib/mask.mjs'
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

test('maskMessage masks reasoning blocks in place, keeping type and order', () => {
  const s = stripper()
  const message = {
    content: [
      { type: 'reasoning', text: '用户手机 13812345678，密钥 sk-abcdefghijklmnopqrstuvwx' },
      { type: 'tool-call', id: 'call_1', name: 'noop', arguments: '{}' },
    ],
    source: { kind: 'user' },
  }
  const { message: masked, replaced } = maskMessage(message, s)
  assert.equal(replaced, 2)
  assert.deepEqual(masked.content.map(block => block.type), ['reasoning', 'tool-call'])
  assert.equal(masked.source.kind, 'user')
  assert.ok(!masked.content[0].text.includes('13812345678'))
  assert.ok(!masked.content[0].text.includes('sk-abcdefghijklmnopqrstuvwx'))
  assert.equal(masked.content[1], message.content[1]) // 非文本块原样保留。
})

test('maskMessage reasoning blocks are reversible through restore()', () => {
  const s = stripper()
  const original = '我的邮箱 a@b.com，手机号 13812345678'
  const message = { content: [{ type: 'reasoning', text: original }] }
  const { message: masked } = maskMessage(message, s)
  assert.notEqual(masked.content[0].text, original)
  assert.equal(masked.content[0].type, 'reasoning')
  assert.equal(s.restore(masked.content[0].text), original)
})

test('maskMessage masks text and reasoning in the same mixed message', () => {
  const s = stripper()
  const content = [
    { type: 'text', text: '联系 a@b.com' },
    { type: 'image', url: 'http://x' },
    { type: 'reasoning', text: '手机 13812345678' },
  ]
  const { message: masked, replaced } = maskMessage({ content }, s)
  assert.equal(replaced, 2)
  assert.deepEqual(masked.content.map(block => block.type), ['text', 'image', 'reasoning'])
  assert.equal(masked.content[1], content[1])
  assert.ok(!masked.content[0].text.includes('a@b.com'))
  assert.ok(!masked.content[2].text.includes('13812345678'))
  assert.equal(s.restore(masked.content[0].text), '联系 a@b.com')
  assert.equal(s.restore(masked.content[2].text), '手机 13812345678')
})

test('maskContentBlocks masks reasoning text too', () => {
  const s = stripper()
  const { blocks: masked, replaced } = maskContentBlocks(
    [{ type: 'reasoning', text: '手机 13812345678' }],
    s,
  )
  assert.equal(replaced, 1)
  assert.equal(masked[0].type, 'reasoning')
  assert.ok(!masked[0].text.includes('13812345678'))
  assert.equal(s.restore(masked[0].text), '手机 13812345678')
})

test('maskMessage tolerates malformed messages', () => {
  const s = stripper()
  const { message, replaced } = maskMessage(null, s)
  assert.equal(message, null)
  assert.equal(replaced, 0)
  const { replaced: r2 } = maskMessage({ content: 'not-an-array' }, s)
  assert.equal(r2, 0)
})

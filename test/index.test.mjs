// test/index.test.mjs — 配置校验 + apply() 集成（pre-step 遮罩、/mask 命令、mask_test 工具、审计门）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, resolveConfig, Config } from '../index.mjs'
import { makeEventGate, maybeAppendSessionEvent } from '../lib/gate.mjs'
import { SESSION_EVENTS } from '../lib/constants.mjs'
import { createMockCtx, makeSession, makeAgent, makeTextMessage, makeExec } from './helpers/mock-ctx.mjs'

// ---------------------------------------------------------------------------
// 配置
// ---------------------------------------------------------------------------

test('Config is a Schemastery object schema', () => {
  assert.equal(Config?.type, 'object')
})

test('resolveConfig applies defaults', () => {
  const c = resolveConfig({})
  assert.equal(c.enabled, true)
  assert.equal(c.mode, 'regex')
  assert.deepEqual(c.entities, ['phone', 'email', 'id-card', 'bank-card', 'key'])
  assert.equal(c.scope, 'messages')
  assert.equal(c.maxRestoreEntriesPerSession, 500)
  assert.equal(c.maxSessions, 1000)
})

test('resolveConfig fails loud on unimplemented mode, scope, and NER entities', () => {
  assert.throws(() => resolveConfig({ mode: 'regex+ner' }), /not bundled/)
  assert.throws(() => resolveConfig({ scope: 'tools' }), /not implemented/)
  assert.throws(() => resolveConfig({ entities: ['person'] }), /requires mode "regex\+ner"/)
  assert.throws(() => resolveConfig({ entities: ['address'] }), /requires mode "regex\+ner"/)
})

test('resolveConfig fails loud on unknown entity and out-of-bounds numbers', () => {
  assert.throws(() => resolveConfig({ entities: ['nope'] }), /unknown entity/)
  assert.throws(() => resolveConfig({ maxRestoreEntriesPerSession: 0 }), /maxRestoreEntriesPerSession/)
  assert.throws(() => resolveConfig({ maxSessions: 0 }), /maxSessions/)
})

test('resolveConfig deduplicates entities and disabled returns early', () => {
  const c = resolveConfig({ entities: ['phone', 'phone', 'email'] })
  assert.deepEqual(c.entities, ['phone', 'email'])
  assert.equal(resolveConfig({ enabled: false }).enabled, false)
})

// ---------------------------------------------------------------------------
// 审计门（会话事件自适应门 + 载荷不含明文）
// ---------------------------------------------------------------------------

test('event gate: known type appends, ignorable appends, unknown closes', () => {
  const known = makeEventGate(new Set(['mask/applied']), false)
  assert.deepEqual(known('mask/applied'), { append: true, ignorable: false })
  const ignorable = makeEventGate(new Set(), true)
  assert.deepEqual(ignorable('mask/applied'), { append: true, ignorable: true })
  const closed = makeEventGate(new Set(), false)
  assert.deepEqual(closed('mask/applied'), { append: false, ignorable: false })
})

test('audit event payload carries counts only, never plaintext', () => {
  const session = makeSession()
  const gate = makeEventGate(new Set(['mask/applied']), false)
  maybeAppendSessionEvent(session, SESSION_EVENTS.APPLIED, {
    sessionId: session.id,
    replaced: 3,
    distribution: { PHONE: 1, EMAIL: 2 },
  }, gate, () => {})
  assert.equal(session.events.length, 1)
  const data = session.events[0].data
  assert.deepEqual(data, { sessionId: session.id, replaced: 3, distribution: { PHONE: 1, EMAIL: 2 } })
  assert.ok(!JSON.stringify(data).includes('13812345678'))
})

// ---------------------------------------------------------------------------
// apply() 集成
// ---------------------------------------------------------------------------

function mount(config = {}) {
  const mock = createMockCtx()
  apply(mock.ctx, config)
  return mock
}

test('apply registers the /mask command and mask_test tool', () => {
  const mock = mount()
  assert.equal(mock.commands.length, 1)
  assert.equal(mock.commands[0].name, 'mask')
  assert.equal(mock.tools.length, 1)
  assert.equal(mock.tools[0].name, 'mask_test')
})

test('apply masks PII at agent/pre-step (waterfall delegates via next)', async () => {
  const mock = mount()
  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  const messages = [makeTextMessage('请联系 13812345678 和 a@b.com')]
  const decision = await mock.waterfall('agent/pre-step', { agent, messages, turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages }))
  assert.equal(decision.kind, 'enter')
  const text = decision.messages[0].content[0].text
  assert.ok(!text.includes('13812345678'))
  assert.ok(!text.includes('a@b.com'))
  assert.ok(text.includes('<PHONE_1>'))
  assert.ok(text.includes('<EMAIL_1>'))
  // rc.6 门关闭：审计事件不落会话（会话仍可加载）；模型可见内容（占位符）已可自日志重建。
  assert.equal(session.events.filter((e) => e.type === 'mask/applied').length, 0)
})

test('apply does not mask when nothing to mask (returns downstream decision)', async () => {
  const mock = mount()
  const agent = makeAgent(makeSession({ id: 's1' }))
  const messages = [makeTextMessage('普通文本无 PII')]
  const decision = await mock.waterfall('agent/pre-step', { agent, messages, turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages }))
  assert.equal(decision.messages, messages)
})

test('/mask status reports counts and distribution without plaintext', async () => {
  const mock = mount()
  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  // 先触发一次遮罩，累计统计。
  await mock.waterfall('agent/pre-step', { agent, messages: [makeTextMessage('13812345678')], turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage('13812345678')] }))
  const result = await mock.commands[0].handler({ agent, rawInput: 'status' })
  assert.equal(result.kind, 'success')
  assert.ok(result.text.includes('replaced: 1'))
  assert.ok(result.text.includes('PHONE=1'))
  assert.ok(!result.text.includes('13812345678'))
})

test('/mask off disables masking and /mask restore unmaps placeholders', async () => {
  const mock = mount()
  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  await mock.waterfall('agent/pre-step', { agent, messages: [makeTextMessage('13812345678')], turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage('13812345678')] }))
  const restored = await mock.commands[0].handler({ agent, rawInput: 'restore <PHONE_1>' })
  assert.equal(restored.kind, 'success')
  assert.ok(restored.text.includes('13812345678'))

  await mock.commands[0].handler({ agent, rawInput: 'off' })
  const decision = await mock.waterfall('agent/pre-step', { agent, messages: [makeTextMessage('18987654321')], turn: 2, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage('18987654321')] }))
  assert.ok(decision.messages[0].content[0].text.includes('18987654321')) // 关闭后不再遮罩。
})

test('mask_test tool masks a snippet and never reveals the original', async () => {
  const mock = mount()
  const tool = mock.tools[0]
  const value = await tool.execute({ text: '电话 13812345678' }, makeExec())
  assert.equal(value.ok, true)
  assert.ok(!value.masked.includes('13812345678'))
  assert.ok(value.masked.includes('<PHONE_1>'))
  assert.equal(value.replaced, 1)
  assert.deepEqual(value.distribution, [{ label: 'PHONE', count: 1 }])
})

test('disabled plugin registers nothing', () => {
  const mock = mount({ enabled: false })
  assert.equal(mock.commands.length, 0)
  assert.equal(mock.tools.length, 0)
  assert.equal(mock.listeners.size, 0)
})

// test/index.test.mjs — 配置校验 + apply() 集成（pre-step 遮罩、/mask 命令、mask_test 工具、审计门）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { KNOWN_SESSION_EVENT_TYPES } from '@deepseek-ai/dsh-session'
import { apply, resolveConfig, Config, renderRestore } from '../index.mjs'
import { makeEventGate, maybeAppendSessionEvent } from '../lib/gate.mjs'
import { SESSION_EVENTS } from '../lib/constants.mjs'
import { restoreFilePath } from '../lib/deliver.mjs'
import { createMockCtx, makeSession, makeAgent, makeTextMessage, makeExec } from './helpers/mock-ctx.mjs'

/** 每次交付用例都用自己的临时 restoreDir，绝不在真实临时目录里留明文。 */
async function tempRestoreDir() {
  return mkdtemp(path.join(os.tmpdir(), 'dsh-mask-index-test-'))
}

/** 跑一次还原并断言「明文只在文件里、绝不在命令结果里」。 */
async function restoreThroughCommand(mock, agent, rawInput, expectedPlaintext) {
  const result = await mock.commands[0].handler({ agent, rawInput })
  assert.equal(result.kind, 'success')
  const match = /^\s+file: (.+?)\s+\(mode/mu.exec(result.text)
  assert.ok(match, `the result must name the delivery file:\n${result.text}`)
  const written = await readFile(match[1], 'utf8')
  assert.equal(written, expectedPlaintext)
  return { text: result.text, file: match[1] }
}

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
  assert.deepEqual(c.scope, ['messages'])
  assert.equal(c.maxRestoreEntriesPerSession, 500)
  assert.equal(c.maxSessions, 1000)
  assert.equal(c.maskClientEnabled, false)
})

test('resolveConfig normalizes scope (string or array) and deduplicates', () => {
  assert.deepEqual(resolveConfig({ scope: 'messages' }).scope, ['messages'])
  assert.deepEqual(resolveConfig({ scope: 'tools' }).scope, ['tools'])
  assert.deepEqual(resolveConfig({ scope: ['messages', 'tools'] }).scope, ['messages', 'tools'])
  assert.deepEqual(resolveConfig({ scope: ['tools', 'tools', 'messages'] }).scope, ['tools', 'messages'])
})

test('resolveConfig fails loud on unimplemented mode, unknown scope, and NER entities', () => {
  assert.throws(() => resolveConfig({ mode: 'regex+ner' }), /not bundled/)
  assert.throws(() => resolveConfig({ scope: /** @type {any} */ ('nope') }), /not a valid surface/)
  assert.throws(() => resolveConfig({ scope: [] }), /at least one surface/)
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

test('event gate: a refusal is announced once per session and type, never silently dropped', () => {
  const warnings = []
  const gate = makeEventGate(new Set(), false, (message) => warnings.push(message))
  assert.deepEqual(gate('mask/applied', 's1'), { append: false, ignorable: false })
  assert.deepEqual(gate('mask/applied', 's1'), { append: false, ignorable: false })
  assert.equal(warnings.length, 1, 'the same session+type warns exactly once')
  assert.match(warnings[0], /mask\/applied/u)
  gate('mask/applied', 's2')
  assert.equal(warnings.length, 2, 'a second session reports its own first refusal')
})

test('vocabulary snapshot: the host set is at least the 0.2.1 62-entry list and holds no mask/* type', () => {
  // 快照与宿主代际强绑定：红了 = 宿主词表变了，请重新快照本断言与 README 口径。
  // 0.2.1 line: 62+ entries; the exact host count moves, so assert a floor
  // （宿主 packages/core/session/src/known-event-types.ts 的 tag diff 实测）。
  assert.ok(KNOWN_SESSION_EVENT_TYPES.size >= 62)
  assert.ok(KNOWN_SESSION_EVENT_TYPES.has('developer/message'), 'the single 0.1.7-line addition stays in the host vocabulary')
  assert.equal([...KNOWN_SESSION_EVENT_TYPES].filter((type) => type.startsWith('mask/')).length, 0)
  const gate = makeEventGate(KNOWN_SESSION_EVENT_TYPES, false)
  assert.deepEqual(gate(SESSION_EVENTS.APPLIED, 's1'), { append: false, ignorable: false })
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
  // rc.2 门均关闭（probe 返回 false）：审计事件不落会话（会话仍可加载）；模型可见内容（占位符）已可自日志重建。
  assert.equal(session.events.filter((e) => e.type === 'mask/applied').length, 0)
})

test('apply does not mask when nothing to mask (returns downstream decision)', async () => {
  const mock = mount()
  const agent = makeAgent(makeSession({ id: 's1' }))
  const messages = [makeTextMessage('普通文本无 PII')]
  const decision = await mock.waterfall('agent/pre-step', { agent, messages, turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages }))
  assert.equal(decision.messages, messages)
})

test('apply masks PII in tool results at tools/post-execute (scope: tools)', async () => {
  const mock = mount({ scope: 'tools' })
  assert.ok(!mock.listeners.has('agent/pre-step'))
  assert.ok(mock.listeners.has('tools/post-execute'))
  const session = makeSession({ id: 's1' })
  const exec = makeExec({ agent: makeAgent(session) })
  const result = { isError: false, content: [{ type: 'text', text: '查询结果：手机 13812345678' }], value: {} }
  const decision = await mock.waterfall('tools/post-execute', exec, result, () => Promise.resolve({ kind: 'accept' }))
  assert.equal(decision.kind, 'accept')
  const text = decision.content[0].text
  assert.ok(!text.includes('13812345678'))
  assert.ok(text.includes('<PHONE_1>'))
})

test('apply with scope [messages, tools] registers both listeners', () => {
  const mock = mount({ scope: ['messages', 'tools'] })
  assert.ok(mock.listeners.has('agent/pre-step'))
  assert.ok(mock.listeners.has('tools/post-execute'))
})

test('apply does not mask tool results when nothing to mask (delegates to next)', async () => {
  const mock = mount({ scope: 'tools' })
  const session = makeSession({ id: 's1' })
  const exec = makeExec({ agent: makeAgent(session) })
  const result = { isError: false, content: [{ type: 'text', text: '干净结果' }], value: {} }
  const decision = await mock.waterfall('tools/post-execute', exec, result, () => Promise.resolve({ kind: 'accept' }))
  assert.equal(decision.kind, 'accept')
  assert.equal(decision.content, undefined) // 未替换：不覆盖下游决策。
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
  const restoreDir = await tempRestoreDir()
  const mock = mount({ restoreDir })
  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  await mock.waterfall('agent/pre-step', { agent, messages: [makeTextMessage('13812345678')], turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage('13812345678')] }))
  const restored = await restoreThroughCommand(mock, agent, 'restore <PHONE_1>', '13812345678')
  assert.ok(restored.text.includes('<PHONE_1>'), 'the result names the placeholder it restored')
  assert.ok(!restored.text.includes('13812345678'), 'the plaintext never enters the command result')
  assert.equal(restored.file, restoreFilePath(restoreDir, 's1'), 'delivery lands under the configured restoreDir')

  await mock.commands[0].handler({ agent, rawInput: 'off' })
  const decision = await mock.waterfall('agent/pre-step', { agent, messages: [makeTextMessage('18987654321')], turn: 2, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage('18987654321')] }))
  assert.ok(decision.messages[0].content[0].text.includes('18987654321')) // 关闭后不再遮罩。
  await rm(restoreDir, { recursive: true, force: true })
})

test('/mask restore never puts plaintext in the result text (the host logs that text verbatim)', async () => {
  // 宿主把 command/done.text 原样写进会话日志，客户端又从同一事件渲染用户可见输出，
  // 所以结果文本 = 转录 = 日志：明文只能走文件通道，结果里只允许出现占位符与路径。
  const restoreDir = await tempRestoreDir()
  const mock = mount({ restoreDir })
  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  const secret = 'sk-' + 'a'.repeat(24)
  await mock.waterfall(
    'agent/pre-step',
    { agent, messages: [makeTextMessage(`13812345678 a@b.com ${secret}`)], turn: 1, step: 1, signal: new AbortController().signal },
    () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage(`13812345678 a@b.com ${secret}`)] }),
  )
  const result = await mock.commands[0].handler({ agent, rawInput: 'restore <PHONE_1> <EMAIL_1> <KEY_1>' })
  assert.equal(result.kind, 'success')
  for (const plaintext of ['13812345678', 'a@b.com', secret]) {
    assert.ok(!result.text.includes(plaintext), `result text must not contain ${plaintext.slice(0, 4)}…`)
  }
  const written = await readFile(restoreFilePath(restoreDir, 's1'), 'utf8')
  assert.equal(written, `13812345678 a@b.com ${secret}`)
  await rm(restoreDir, { recursive: true, force: true })
})

test('/mask restore reports an unknown placeholder without writing or revealing anything', async () => {
  const restoreDir = await tempRestoreDir()
  const mock = mount({ restoreDir })
  const agent = makeAgent(makeSession({ id: 's1' }))
  const result = await mock.commands[0].handler({ agent, rawInput: 'restore <PHONE_9>' })
  assert.equal(result.kind, 'success')
  assert.match(result.text, /no placeholder this session knows/u)
  assert.deepEqual(await readdir(restoreDir), [], 'an unmatched restore writes no plaintext file')
  await rm(restoreDir, { recursive: true, force: true })
})

test('/mask restore explains the missing no-argument form and still requires text', async () => {
  const mock = mount({ restoreDir: await tempRestoreDir() })
  const agent = makeAgent(makeSession({ id: 's1' }))
  const result = await mock.commands[0].handler({ agent, rawInput: 'restore' })
  assert.equal(result.kind, 'error')
  assert.match(result.text, /restore needs text/u)
  assert.match(result.text, /no-argument form/u)
})

test('/mask restore requires an active session', async () => {
  const mock = mount({ restoreDir: await tempRestoreDir() })
  const result = await mock.commands[0].handler({ agent: { session: undefined }, rawInput: 'restore <PHONE_1>' })
  assert.equal(result.kind, 'error')
  assert.match(result.text, /active session/u)
})

test('delivery failure fails closed: an error result, never the plaintext', async () => {
  const root = await tempRestoreDir()
  // restoreDir 指向一个普通文件 ⇒ 交付必然失败。
  const blocked = path.join(root, 'not-a-dir')
  await writeFile(blocked, 'x', 'utf8')
  const mock = mount({ restoreDir: blocked })
  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  await mock.waterfall('agent/pre-step', { agent, messages: [makeTextMessage('13812345678')], turn: 1, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ kind: 'enter', messages: [makeTextMessage('13812345678')] }))
  const result = await mock.commands[0].handler({ agent, rawInput: 'restore <PHONE_1>' })
  assert.equal(result.kind, 'error')
  assert.ok(!result.text.includes('13812345678'), 'a failed delivery must not fall back to echoing plaintext')
  assert.equal(await readFile(blocked, 'utf8'), 'x', 'the blocking file is untouched')
  await rm(root, { recursive: true, force: true })
})

test('renderRestore keeps only placeholders and the path', () => {
  const text = renderRestore({ placeholders: ['<PHONE_1>', '<EMAIL_1>'], path: '/tmp/x/restore-abc.txt' })
  assert.ok(text.includes('<PHONE_1>, <EMAIL_1>'))
  assert.ok(text.includes('/tmp/x/restore-abc.txt'))
  assert.match(text, /NOT in this text and NOT in the session log/u)
})

test('resolveConfig validates restoreDir loudly', () => {
  assert.equal(resolveConfig({}).restoreDir, '')
  assert.throws(() => resolveConfig({ restoreDir: /** @type {any} */ (42) }), /restoreDir must be a string/u)
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

test('apply mounts without storageDomain and degrades to a memory-only restore table', async () => {
  // bare profile：未组合存储栈 → storageDomain 服务缺失，插件仍挂载且遮罩/还原可用。
  const restoreDir = await tempRestoreDir()
  const mock = createMockCtx({ storageDomain: false })
  apply(mock.ctx, { restoreDir }) // persistRestoreTable 默认 true，缺失领域时视为 no-op。
  assert.equal(mock.commands.length, 1)
  assert.equal(mock.commands[0].name, 'mask')
  assert.equal(mock.tools.length, 1)
  assert.equal(mock.tools[0].name, 'mask_test')

  const session = makeSession({ id: 's1' })
  const agent = makeAgent(session)
  const messages = [makeTextMessage('请联系 13812345678')]
  const decision = await mock.waterfall(
    'agent/pre-step',
    { agent, messages, turn: 1, step: 1, signal: new AbortController().signal },
    () => Promise.resolve({ kind: 'enter', messages }),
  )
  assert.ok(!JSON.stringify(decision.messages).includes('13812345678'), 'masking still works without storageDomain')

  const restored = await restoreThroughCommand(mock, agent, 'restore <PHONE_1>', '13812345678')
  assert.ok(!restored.text.includes('13812345678'), 'restore works from the in-memory mapping without leaking it')
  await rm(restoreDir, { recursive: true, force: true })
})

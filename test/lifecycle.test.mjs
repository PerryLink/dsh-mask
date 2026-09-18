// test/lifecycle.test.mjs — HMR-safety（C1）与导出契约（C2）套件。
//
// C1：真实 Cordis + 真实 CommandRuntime/ToolRuntime + mock storageDomain/systemPrompt
// 组装；保存贡献 fiber，释放后重查权威注册表，断言 /mask 命令、mask_test 工具消失，
// 且 agent/pre-step 监听不再遮罩消息（行为级断言监听器已随 fiber 撤销）。
// C2：模块命名空间无 default 导出，且 Loader.unwrapExports 往返返回同一命名空间。
// @module dsh-mask/test/lifecycle.test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import CommandRuntime from '@deepseek-ai/dsh-commands'
import * as plugin from '../index.mjs'

/** 极简 mock storageDomain：domain open 返回含单表 KvTable 形状的领域。 */
function makeStorageDomain() {
  return {
    open(spec) {
      const store = new Map()
      return Promise.resolve({
        name: spec.name,
        table() {
          return {
            get: (key) => store.get(key),
            put: async (key, value) => { store.set(key, value) },
            delete: async (key) => { store.delete(key) },
            entries: () => [...store.entries()][Symbol.iterator](),
            keys: () => [...store.keys()][Symbol.iterator](),
            size: () => store.size,
          }
        },
        close: async () => {},
      })
    },
  }
}

/** 合成会话（append 记录事件，供命令生命周期与审计门使用）。 */
function makeSession(id = 's1') {
  const events = []
  return {
    id,
    events,
    append(type, data, appendOpts) {
      const event = { type, seq: events.length, time: Date.now(), data, ignorable: appendOpts?.ignorable === true }
      events.push(event)
      return event
    },
  }
}

function makeAgent(session) {
  return {
    id: session.id,
    options: { provider: 'deepseek', model: 'demo-model' },
    session,
    inbox: {},
    status: 'idle',
    ctx: new Context(),
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  }
}

/** 组装真实 Cordis 上下文（真实 commands/tools 注册表 + mock 存储领域）。 */
async function mountHarness(config = {}) {
  const ctx = new Context()
  ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined })
  ctx.provide('storageDomain', makeStorageDomain())
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(CommandRuntime)
  const agent = /** @type {any} */ (makeAgent(makeSession('s1')))
  const pluginFiber = await ctx.plugin(plugin, config)
  return { ctx, agent, pluginFiber }
}

// ---------------------------------------------------------------------------
// C2：函数插件命名空间必须经 Loader 解包往返
// ---------------------------------------------------------------------------

test('module carries no default export and Loader unwrap round-trips the namespace', () => {
  assert.equal('default' in plugin, false)
  const loader = Object.create(Loader.prototype)
  const unwrapped = loader.unwrapExports(plugin)
  assert.equal(unwrapped, plugin)
  assert.equal(unwrapped.name, 'mask')
  assert.deepEqual(unwrapped.inject, ['commands'])
  assert.ok(unwrapped.Config !== undefined)
  assert.equal(typeof unwrapped.apply, 'function')
})

// ---------------------------------------------------------------------------
// C1：释放贡献 fiber 后，/mask、mask_test 与 agent/pre-step 监听全部消失
// ---------------------------------------------------------------------------

/** 派发一次 agent/pre-step waterfall（终端返回未遮罩决策）。 */
async function dispatchPreStep(ctx, agent, text) {
  const messages = [{ content: [{ type: 'text', text }], source: { kind: 'user' } }]
  const payload = { agent, messages, turn: 1, step: 1, signal: new AbortController().signal }
  return /** @type {any} */ (ctx.waterfall('agent/pre-step', /** @type {any} */ (payload), () => Promise.resolve({ kind: 'enter', messages })))
}

test('disposing the contributing fiber removes /mask, mask_test and the pre-step listener', async () => {
  const harness = await mountHarness()
  try {
    const before = harness.ctx.commands.list(harness.agent).map((entry) => entry.name)
    assert.ok(before.includes('mask'))
    assert.ok(harness.ctx.tools.get('mask_test') !== undefined)

    // 释放前：agent/pre-step 监听遮罩 PII。
    const masked = await dispatchPreStep(harness.ctx, harness.agent, '电话 13812345678')
    assert.ok(!JSON.stringify(masked.messages).includes('13812345678'), 'listener masks PII before dispose')

    await harness.pluginFiber.dispose()

    const after = harness.ctx.commands.list(harness.agent).map((entry) => entry.name)
    assert.equal(after.includes('mask'), false, '/mask should disappear after fiber dispose')
    assert.equal(harness.ctx.tools.get('mask_test'), undefined, 'mask_test should disappear after fiber dispose')

    // 释放后：监听器消失 → 终端决策原样返回（PII 不再被遮罩）。
    const unmasked = await dispatchPreStep(harness.ctx, harness.agent, '电话 13812345678')
    assert.ok(JSON.stringify(unmasked.messages).includes('13812345678'), 'pre-step listener should be gone after fiber dispose')
  } finally {
    await harness.ctx.fiber.dispose()
  }
})

// ---------------------------------------------------------------------------
// A02 T1：域打开是异步的；effect 先注册，disposer 通过闭包持有 domainPromise
// ---------------------------------------------------------------------------

test('A02 T1: unmounting while the domain open is in flight still closes the handle exactly once', async () => {
  const closes = []
  /** @type {(value: any) => void} */
  let resolveOpen
  const opened = new Promise((resolve) => { resolveOpen = resolve })
  const ctx = new Context()
  ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined })
  ctx.provide('storageDomain', { open: () => opened })
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(CommandRuntime)
  const pluginFiber = await ctx.plugin(plugin, {})
  // 卸载发生在 open 仍在飞行时（V1 形态下这里会抛 INACTIVE_EFFECT 并被空 catch 吞掉）。
  await pluginFiber.dispose()
  resolveOpen({
    table: () => ({ get: async () => undefined, put: async () => {} }),
    close: async () => { closes.push(1) },
  })
  await opened
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(closes.length, 1, 'the handle opened during unmount must be closed exactly once')
  await ctx.fiber.dispose()
})

test('A02 T1: a rejected domain open is reported, never left unhandled', async () => {
  const unhandled = []
  const onUnhandled = (reason) => { unhandled.push(reason) }
  process.on('unhandledRejection', onUnhandled)
  try {
    const ctx = new Context()
    ctx.provide('systemPrompt', { tools: () => () => undefined, section: () => () => undefined })
    ctx.provide('storageDomain', { open: () => Promise.reject(new Error('backend down')) })
    await ctx.plugin(ToolRuntime)
    await ctx.plugin(CommandRuntime)
    const pluginFiber = await ctx.plugin(plugin, {})
    // 拒绝必须被显式处理（可见告警），而不是浮空 promise。
    await new Promise((resolve) => setImmediate(resolve))
    await pluginFiber.dispose()
    await ctx.fiber.dispose()
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(unhandled.length, 0, 'the open rejection must be handled, not unhandled')
  } finally {
    process.off('unhandledRejection', onUnhandled)
  }
})

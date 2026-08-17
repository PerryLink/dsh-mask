// test/helpers/mock-ctx.mjs — 极简 Cordis 模拟（集成测试用）。
//
// 只实现 dsh-mask 用到的面：on/effect/provide/get/inject/waterfall/
// commands.register/tools.register/storageDomain.open/logger。语义对齐真 Cordis
// 的关键点：effect 回调返回清理函数，卸载时逆序执行；waterfall 的 next() 续链。

/**
 * 构造 mock 上下文。
 * @param {object} [opts] - {domainData}：storageDomain 领域数据（{restore: Map}）。
 * @returns {object} {ctx, services, tools, commands, listeners, cleanups, domainData, waterfall, dispose}。
 */
export function createMockCtx(opts = {}) {
  const services = new Map()
  const tools = []
  const commands = []
  const listeners = new Map()
  const cleanups = []
  const domainData = opts.domainData ?? { restore: new Map() }

  const mockDomain = {
    table(name) {
      const store = domainData[name] ?? (domainData[name] = new Map())
      return {
        async get(key) { return store.get(key) },
        async put(key, value) { store.set(key, value) },
      }
    },
    async close() {},
  }

  const ctx = {
    on(name, fn, options) {
      const list = listeners.get(name) ?? []
      const record = { fn }
      if (options === true || options?.prepend === true) list.unshift(record)
      else list.push(record)
      listeners.set(name, list)
      return () => true
    },
    effect(callback, _label) {
      let cleanup
      try {
        cleanup = callback()
      } catch (error) {
        cleanup = () => { throw error }
      }
      if (typeof cleanup === 'function') cleanups.push(cleanup)
      return { dispose() {} }
    },
    provide(name, value) {
      services.set(name, value)
      const remove = () => { services.delete(name) }
      cleanups.push(remove)
      return remove
    },
    get(name) {
      return services.get(name)
    },
    inject(deps, callback) {
      const depsCtx = {}
      for (const dep of deps) depsCtx[dep] = services.get(dep)
      callback({ ...depsCtx, get: (name) => services.get(name), effect: ctx.effect })
      return () => true
    },
    commands: {
      register(def) {
        commands.push(def)
        return () => {
          const index = commands.indexOf(def)
          if (index >= 0) commands.splice(index, 1)
        }
      },
    },
    tools: {
      register(def) {
        tools.push(def)
        return () => {
          const index = tools.indexOf(def)
          if (index >= 0) tools.splice(index, 1)
        }
      },
    },
    storageDomain: {
      open() {
        return Promise.resolve(mockDomain)
      },
    },
    logger() {
      return { warn() {}, error() {}, info() {}, debug() {} }
    },
    root: null,
    emit(name, ...args) {
      for (const record of listeners.get(name) ?? []) record.fn(...args)
    },
    waterfall(name, ...args) {
      const terminal = args.pop()
      const fns = (listeners.get(name) ?? []).slice()
      const run = (index, rest) => {
        if (index >= fns.length) return terminal(...rest)
        return fns[index].fn(...rest, (...nextArgs) => run(index + 1, nextArgs))
      }
      return run(0, args)
    },
  }
  ctx.root = ctx
  services.set('tools', ctx.tools)
  services.set('commands', ctx.commands)
  services.set('storageDomain', ctx.storageDomain)
  return {
    ctx,
    services,
    tools,
    commands,
    listeners,
    cleanups,
    domainData,
    waterfall: (name, ...args) => ctx.waterfall(name, ...args),
    /** 模拟 fiber 卸载：逆序执行清理。 */
    dispose() {
      for (const cleanup of cleanups.reverse()) cleanup()
    },
  }
}

/**
 * 合成会话：events 记录 append 内容。
 * @param {object} [opts] - {id}。
 * @returns {object} 会话假件。
 */
export function makeSession(opts = {}) {
  const id = opts.id ?? 'session-test'
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

/**
 * 合成 agent：带 session。
 * @param {object} [session] - makeSession 产物。
 * @returns {object} agent 假件。
 */
export function makeAgent(session) {
  return { session: session ?? makeSession() }
}

/** 合成一条文本 UserMessage。 */
export function makeTextMessage(text) {
  return { content: [{ type: 'text', text }], source: { kind: 'user' } }
}

/** 合成 exec（工具执行上下文）：agent + callId + 未中止的 signal。 */
export function makeExec(opts = {}) {
  const controller = opts.controller ?? new AbortController()
  return {
    agent: 'agent' in opts ? opts.agent : makeAgent(),
    callId: opts.callId ?? 'call-1',
    signal: controller.signal,
    token: {},
    parent: undefined,
    name: 'mask_test',
    arguments: {},
    controller,
  }
}

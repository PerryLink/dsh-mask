// scripts/loader-runner.mjs — real Loader composition runner (community
// five-layer model, layer 4). An independent process boots a real Context,
// mounts the vendored Loader with the Include builtin, reads the given
// cordis.yml (real storage stack + service rows + plugin row + config), then
// asserts the plugin's contributions through the authoritative registries and
// executes one real behavior. Config is applied by the Loader, so the expected
// outcome proves the config in the file was honored.
//
// Usage: node scripts/loader-runner.mjs <cordis.yml> tool|no-tool
// Exit 0 prints DSH_LOADER_RESULT <json>; any assertion or load failure exits
// non-zero with the reason on stderr (used by the invalid-config and
// default-export regression cases).

import { Context } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const configArgument = process.argv[2]
const expected = process.argv[3]
if (configArgument === undefined || (expected !== 'tool' && expected !== 'no-tool')) {
  console.error('usage: loader-runner.mjs <cordis.yml> tool|no-tool')
  process.exit(2)
}

const configPath = resolve(configArgument)
const configRequire = createRequire(resolve(import.meta.dirname, '../package.json'))

const ctx = new Context()
try {
  ctx.baseUrl = `${pathToFileURL(dirname(configPath)).href}/`
  await ctx.plugin(Loader)
  ctx.loader.internal = /** @type {any} */ ({
    version: 'v2',
    async import(specifier) {
      if (specifier.startsWith('file:')) return import(specifier)
      if (specifier.startsWith('node:')) return import(specifier)
      const absolute = /^([a-zA-Z]:)?[\\/]/u.test(specifier)
      return import(pathToFileURL(absolute ? specifier : configRequire.resolve(specifier)).href)
    },
  })
  ctx.loader.builtins.include = Include
  await ctx.loader.create({
    name: 'cordis:include',
    config: { path: pathToFileURL(configPath).href },
  })
  await ctx.loader.await()

  // Authoritative registries carry the plugin's contributions. /mask status only
  // reads agent.session.id, so a fake session with append() suffices for the
  // command lifecycle append.
  const agent = /** @type {any} */ ({
    id: 'agent-1',
    options: { provider: 'deepseek', model: 'demo-model' },
    session: { id: 's1', append() {} },
    inbox: {},
    status: 'idle',
    ctx,
    cancel: () => undefined,
    whenIdle: async () => undefined,
    runMaintenance: async (task) => task(new AbortController().signal),
    send: () => undefined,
    followup: () => undefined,
    steer: () => undefined,
    inject: () => undefined,
  })
  const commands = ctx.commands.list(agent).map((entry) => entry.name)
  if (!commands.includes('mask')) {
    throw new Error('Loader composition: /mask command is missing from the commands registry')
  }

  const toolPresent = ctx.tools.get('mask_test') !== undefined
  if (expected === 'tool' && !toolPresent) {
    throw new Error('Loader composition: mask_test tool is missing (expected registered)')
  }
  if (expected === 'no-tool' && toolPresent) {
    throw new Error('Loader composition: mask_test tool is registered (registerTools: false was not applied)')
  }

  // Real behavior: /mask status through the real commands service.
  // rc.8: commands.execute(agent, line, images, signal) — no images for /mask.
  const execution = await ctx.commands.execute(agent, '/mask status', [], new AbortController().signal)
  const text = execution?.result?.text ?? ''
  if (!text.includes('mask: enabled')) {
    throw new Error(`Loader composition: /mask status returned ${JSON.stringify(execution?.result)}`)
  }

  const summary = {
    commands,
    maskTestTool: toolPresent,
    statusText: text.split('\n')[0],
  }
  process.stdout.write(`DSH_LOADER_RESULT ${JSON.stringify(summary)}\n`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
} finally {
  await ctx.fiber.dispose()
}

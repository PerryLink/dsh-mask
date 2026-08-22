# Third-party notices

## Ported code

The regex PII detector in `lib/strip.mjs` (entity patterns, overlap resolution,
same-value-same-placeholder reuse, and the restore-by-descending-placeholder-length
logic) is ported from:

- **Pii-Stripper-Middleware** — https://github.com/PerryLink/Pii-Stripper-Middleware

License status of the source: the project's asset inventory recorded the upstream
as `NOASSERTION` at clone time; the upstream repository now carries the canonical
Apache-2.0 LICENSE (`Copyright 2026 PerryLink`), which is what this port follows.
The local `upstream/` reference clone may still hold the pre-fix file until refreshed.
The `upstream/` directory is a read-only reference clone kept only for the port and
is gitignored — it is not part of this repository and is not published.

This repository (`dsh-mask`) is licensed under Apache-2.0 (see `LICENSE`). The port
adapts the Python implementation to JavaScript and extends it with a `key` detector;
all other JavaScript here (`index.mjs`, `lib/`, `test/`, `scripts/`) is original work
by the dsh-mask contributors.

## Install-time dependencies

`dsh-mask` bundles no third-party source code. The package depends on the following
software, none of which is bundled into the published tarball:

| Package | Version range | License | Purpose |
|---|---|---|---|
| [zod](https://github.com/colinhacks/zod) | `^4.4.3` | MIT | Runtime schema for the `dsh_mask` storage-domain record (persistence-boundary validator) |
| [typescript](https://github.com/microsoft/TypeScript) | `^5.9.0` | Apache-2.0 | `tsc --checkJs` typecheck gate (`tsconfig.check.json`) |
| [@deepseek-ai/cordis](https://www.npmjs.com/package/@deepseek-ai/cordis) | `^4.0.1` (peer) | See package | The plugin runtime |
| [@deepseek-ai/schemastery](https://www.npmjs.com/package/@deepseek-ai/schemastery) | `^3.18.0` (peer) | See package | Configuration schema |
| `@deepseek-ai/dsh-*` peers | `>=0.1.0-rc.8 <0.2.0` (peer) | See packages | Official harness seams (`dsh-session`, `dsh-storage-domain`, `dsh-tools`) |

Development-only dependencies (not shipped, used by tests and the typecheck gate)
add `@deepseek-ai/dsh-agent` and `@deepseek-ai/dsh-commands` at `0.1.1-rc.2`, and
`@types/node`.

At runtime the plugin only talks to the harness services listed as peerDependencies;
it performs no network requests of its own.

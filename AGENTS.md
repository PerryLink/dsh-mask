# AGENTS.md

Standalone DeepSeek Harness plugin repository (`dsh-mask`). Development follows the dsh-plugin-guide skill and the official plugin contract; this file records repo-local decisions. Read `README.md` (external contract) and `ARCHITECTURE.md` (design decisions) before changing behavior.

## Layout (JS form, pure host, no browser half)

```
index.mjs             single host face: Config schema + resolveConfig, probeIgnorableAppend,
                      agent/pre-step masking listener, /mask command handler,
                      mask_test tool factory, apply()
types.d.ts            Config/result types + mask/applied SessionEventMap declaration merging
lib/                  zero-DSH-dependency modules (see ARCHITECTURE.md module map);
                      the only lib module allowed to import zod/@deepseek-ai/* is
                      lib/domain.mjs (persistence-boundary validator)
test/*.test.mjs       node --test (strip/sanitize/mask/store/index + helpers/mock-ctx.mjs)
scripts/              mechanical gates: verify-self-contained.mjs, verify-artifacts.mjs,
                      verify-readmes.mjs, changelog-section.mjs
cordis.patch.yml      bundle declaration (insert mask); every Config key documented inline
pnpm-workspace.yaml   nearest-workspace root (isolates this repo from the surrounding
                      deepseek-harness workspace during development)
package.json          npm metadata; files whitelist = published content
tsconfig.check.json   tsc --checkJs typecheck gate against the published rc.6 peers
.github/workflows/    CI (3 OS × 2 Node), monthly compat probe, v* npm release
README.md             English primary (GitHub default page; source of truth)
README.{zh,es,pt,hi}.md  translations, top switcher, updated in the same commit
ARCHITECTURE.md       seam roles + module map + design decisions
CHANGELOG.md          Keep a Changelog, [Unreleased] at the top
SECURITY.md           private vulnerability reporting + scope
THIRD_PARTY_NOTICES.md  ported-from attribution + install-time dependencies
LICENSE               Apache-2.0
upstream/             ❌ read-only reference clone (Pii-Stripper-Middleware);
                      gitignored, never committed, never published
```

## Hard rules applied here

- **Optional seams fail closed.** `tools` registers only when present (`ctx.inject(['tools'], …)`); `agent/pre-step` masking is a pure-host seam that never blocks a step (it always calls `next()`).
- **Model-visible ⟺ logged (placeholder form).** The masked messages are what get appended as `user/message`, so the log reconstructs exactly what the model saw; the plaintext stays in the restore table.
- **Plaintext never enters the session log.** The `mask/applied` audit event carries counts + type distribution only; the mapping never reaches the log. `lib/sanitize.mjs` redacts PII/secrets before any display or log text.
- **Session-event adaptive gate is mandatory.** `mask/applied` is declared in `types.d.ts`, but runtime appends only when the host records the type or supports the `ignorable` envelope (`probeIgnorableAppend`). On `0.1.0-rc.6` the gate stays closed so sessions keep loading. Do not remove the gate "just because" — see `ARCHITECTURE.md`.
- **Loud misconfiguration.** Unimplemented `mode` (`regex+ner`), `scope` (`tools`), NER-only entities, unknown entities, and out-of-bounds numbers fail `resolveConfig` at load.
- **Waterfall discipline.** The `agent/pre-step` listener always calls `next()` and only replaces the returned decision's messages; it never short-circuits a step.
- **No build step.** Pure ESM: `index.mjs` + `lib/` are the shipped artifacts. There is no `build`/`prepare` script — keep it that way; do not introduce a bundler.
- **Ported code is attributed.** The regex detector is ported from Pii-Stripper-Middleware; see `THIRD_PARTY_NOTICES.md` and the file header in `lib/strip.mjs`.

## Checks

```sh
pnpm install                                        # node ^22.19 || >=24
pnpm run typecheck && pnpm run typecheck:ci         # tsc --checkJs (tsconfig.check.json)
pnpm test                                           # node --test
pnpm run verify:self-contained                      # dependency specs resolve from the registry
pnpm run verify:artifacts                           # shipped files present + index.mjs importable
pnpm run check:readmes                              # five-language README consistency
pnpm pack                                           # the published tarball
```

`typecheck` resolves `@deepseek-ai/*` from this repo's own `node_modules` (the pinned `0.1.0-rc.6` peers installed by pnpm). The repo must be its own pnpm workspace (`pnpm-workspace.yaml`) so it never resolves into a surrounding `deepseek-harness` checkout's node_modules.

## Release

Version is currently `0.1.0`. For a new version: bump `package.json#version`, stamp the CHANGELOG `[Unreleased]` section into `## [<x.y.z>] - <UTC date>`, re-run the full gate, commit `chore(release): <x.y.z>`, and `git tag -a v<x.y.z>`. `git push origin main --follow-tags` triggers `.github/workflows/release.yml`, which re-runs the gate, publishes to npm with provenance (skipped without the `NPM_TOKEN` secret), and creates the GitHub Release from the stamped CHANGELOG section. Never push a tag for a version already on the registry.

## Docs

- Five-language READMEs (`README.md` is the source; `README.zh.md`, `README.es.md`, `README.pt.md`, `README.hi.md` follow). Every behavior change updates all five in the same commit; `check:readmes` enforces the shared surface in CI.
- GitHub topics `dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `pii`, `mask`, `privacy`, `anonymization`, `security` (mirror `package.json` keywords; the ecosystem's visibility channel is the `dsh-plugin` topic).
- License is Apache-2.0 (`LICENSE` + the package.json `license` field). `THIRD_PARTY_NOTICES.md` records the Pii-Stripper-Middleware port and the install-time dependencies.

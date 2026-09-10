# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.1` line and record `0.1.5-rc.1` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.1`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-rc.1` (verified 2026-09-10).

## [0.2.7] - 2026-09-09

### Changed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` and pin the dev/test dependencies to the published `0.1.5-alpha.1` line: adaptation to DeepSeek Harness `dsh-v0.1.5-alpha.1` (session format V3, `ctx.agent` removal, `Inbox` type-only interface); runtime behavior is unchanged for every supported host line.
- Record `0.1.5-alpha.1` in `dshWorkshop.compatibility.dshVersions`.

### Docs

- Refresh the five-language README compatibility baseline to `dsh-v0.1.5-alpha.1` (verified 2026-09-09).

## [0.2.6] - 2026-09-08

### Docs

- Repair GBK mojibake in a historical CHANGELOG entry: the arrow (U+2192) was corrupted to the U+922B U+003F marker pair; restored to the clean pre-corruption text; no behavior change.


## [0.2.5] - 2026-09-07

### Docs

- Fix the DSH plugin badge URL: shields.io rejects the four-segment static badge form with "404 badge not found"; the label now uses the documented double-dash form (`dsh--plugin`), rendering identically; no behavior change.


## [0.2.4] - 2026-09-07

### Fixed

- Align the `@deepseek-ai/dsh-*` peer ranges to `>=0.1.2-rc.1 <0.2.0`: the older `>=0.1.0-rc.8 <0.2.0` band resolved to only the `0.1.0-rc.8` prerelease under registry-driven resolution and broke fresh tarball installs; no behavior change.

### Docs

- Refresh the five-language README support-version wording: the verified GitHub tag `dsh-v0.1.3-alpha.1` now leads the compatibility claim, while npm `0.1.2-rc.1` stays the published dependency-pin line (peers `>=0.1.2-rc.1 <0.2.0`); no behavior change.


## [0.2.3] - 2026-09-04

### Changed

- Align the devDependency pins to the published dsh `0.1.2-rc.1` line, move the compat CI probes from `0.1.1-rc.2` to `0.1.2-rc.1`, and re-verify the adaptive audit gate (unchanged: the gate stays closed on rc.1); no behavior change.

## [0.2.2] - 2026-09-01

### Changed

- Upgrade the `@deepseek-ai/dsh-*` dev dependencies from `0.1.2-alpha.2` to `0.1.2-alpha.3` (peer ranges stay `>=0.1.0-rc.8 <0.2.0`; the `dsh-commands` peer exact pin is widened to the same range), align the `@deepseek-ai/cordis` / `@deepseek-ai/schemastery` carets to `^4.0.2` / `^3.18.2`, refresh `dshWorkshop.compatibility.dshVersions` and the five-language README version notes to `0.1.2-alpha.3`, and re-verify the adaptive audit gate on alpha.3 (unchanged: the gate stays closed).

## [0.2.1] - 2026-08-27

### Fixed

- The bundle patch no longer inserts the storage stack (`@deepseek-ai/dsh-storage` / `dsh-storage-json` / `dsh-storage-domain`), which crashed `dsh web` with `duplicate loader entry id: storage` because `@deepseek-ai/dsh-web-app` already composes the same ids (issue #2). `storageDomain` is now an optional service: a profile that composes the storage stack provides it, while a bare profile without it degrades to a memory-only restore table with a one-time warning instead of hanging on `pending (waiting for service: storageDomain)`.

## [0.2.0] - 2026-08-26

### Added

- **`tools` masking scope.** `scope` now accepts `'messages'` and/or `'tools'` (string or array, default `['messages']`). The `tools` surface masks tool-result text blocks on `tools/post-execute` before they are logged and fed back to the model. Tool-argument rewriting stays out of scope because the upstream `tools/pre-execute` `PreToolDecision` deliberately offers no input rewrite (logged/rendered arguments must match what ran).
- **Detector Provider seam.** `Stripper`/`createStripper` accept an optional `detector: (text) => PIIEntity[]`; the built-in `regexDetect` remains the zero-dependency default, unchanged, so an external NER recognizer can plug in later without touching the masking pipeline.
- **`maskClientEnabled` feature flag** (default `false`) for the future browser-half reveal bubble; the host restore surface (`/mask restore` + `RestoreStore.restore`) already backs it.

## [0.1.4] - 2026-08-23

### Changed

- Add the `[Unreleased]` Keep-a-Changelog section and refresh the repo-local development notes (`AGENTS.md`) to match the current `0.1.3` release.

## [0.1.3] - 2026-08-22

### Changed

- Upgrade all `@deepseek-ai/dsh-*` devDependencies to `0.1.1-rc.2` and the `dshWorkshop` compatibility manifest to `0.1.1-rc.2`. peerDependencies stay `>=0.1.0-rc.8 <0.2.0` (the plugin uses no rc.2-only API); `@deepseek-ai/cordis` and all non-dsh dependencies are unchanged.
- Sync every hard-coded harness version reference to `0.1.1-rc.2`: the five-language READMEs, `ARCHITECTURE.md`, `AGENTS.md`, `THIRD_PARTY_NOTICES.md`, the CI typecheck label, and the monthly compat probe's `dsh`/`dsh-base`/`dsh-headless` pins.

## [0.1.2] - 2026-08-21

### Changed

- Upgrade all `@deepseek-ai/dsh-*` dependencies to `0.1.0-rc.8`: peerDependencies become `>=0.1.0-rc.8 <0.2.0`, devDependencies pin `0.1.0-rc.8`, and the `dshWorkshop` compatibility manifest declares `0.1.0-rc.8`. `@deepseek-ai/cordis` and all non-dsh dependencies are unchanged.
- Enable `autoInstallPeers` in `pnpm-workspace.yaml` so the composition/lifecycle suites install the rc.8 peers of the mounted `dsh-commands`/`dsh-tools` runtimes.

### Fixed

- `scripts/loader-runner.mjs` adapts to the rc.8 `commands.execute(agent, line, images, signal)` signature (the `images` argument was added in `0.1.0-rc.8`).

## [0.1.1] - 2026-08-17

### Fixed

- The bundle patch now composes the storage stack (`@deepseek-ai/dsh-storage` + `dsh-storage-json` + `dsh-storage-domain`) and declares all three packages, so a bare profile gets the `storageDomain` service the plugin injects instead of hanging with `pending (waiting for service: storageDomain)`.

## [0.1.0] - 2026-08-17

### Added

- PII masking middleware for DeepSeek Harness: request-time anonymization at the `agent/pre-step` boundary (phones, emails, ID cards, bank cards, keys, and opt-in IPs become `<TYPE_N>` placeholders), a `placeholder → original` restore table kept only in memory and the controlled `dsh_mask` storage domain, and a `mask/applied` audit session event that records counts + type distribution only.
- The `/mask` command (`status`/`on`/`off`/`restore <text>`/`help`) and the `mask_test` model tool (mask a snippet, never reveal the original).
- The regex PII detector ported from Pii-Stripper-Middleware (`lib/strip.mjs`), plus a `key` detector for the spec's secret-type PII.
- Pure display/log sanitizers (`lib/sanitize.mjs`) with extreme-case coverage: PII plaintext and the mapping table never leak into logs or results.
- Schemastery configuration with fail-loud bounds; every tunable documented in `cordis.patch.yml` and the five-language READMEs.
- Session-event adaptive gate (`mask/applied` appends only when the host records the type or supports the `ignorable` envelope).

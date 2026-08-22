# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.13] - 2026-09-23

### Changed

- Move the `@deepseek-ai/dsh-*` dev/test pins to the published `0.1.7-alpha.2` line and record `0.1.7-alpha.2` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now installs the `0.1.7-alpha.2` host (`dsh-base` + `dsh-headless`) instead of `0.1.6-alpha.2`, and the five READMEs state that line as the verified one.
- Append the fourth host clause `|| >=0.1.7-0 <0.2.0` to `engines.dsh` and to all six `@deepseek-ai/dsh-*` peer ranges. Under semver's prerelease rule a range whose only prerelease comparators sit on earlier tuples cannot admit a later alpha, so the three-clause band excluded the very host line this release targets. No previously supported host line is dropped.
- Raise the `@deepseek-ai/cordis` dev/test pin to `^4.0.4`.

### Fixed

- Re-snapshot the session-event vocabulary against the new target line: `0.1.7-alpha.2` records **59** session event types where `0.1.6-alpha.2` recorded 58. The single addition is `developer/message` and nothing was removed, so the gate verdict is unchanged — none of the 59 is a `mask/*` type, the adaptive gate still stays closed there, and sessions keep loading. `test/index.test.mjs` pins the new count and the new member, and the Known limitations entry in all five READMEs now names `0.1.7-alpha.2` and the 59-entry list instead of `0.1.6-alpha.2` and 58.

### Docs

- Correct `AGENTS.md`: the session-event gate rule cited "the published `0.1.5-rc.2` line" as the current measurement of a host that cannot stamp the `ignorable` envelope; it now cites `0.1.7-alpha.2`.

## [0.2.12] - 2026-09-19

### Changed

- The release workflow now publishes through **npm trusted publishing** (OIDC) instead of the long-lived `NPM_TOKEN` secret: `setup-node` no longer sets `registry-url` (its empty `_authToken` line made the registry answer 404 on PUT), npm is upgraded to >= 11.5.1 before publishing, and the "NPM_TOKEN is not set -> skip" guard is gone so a missing publisher cannot turn a release into a silent no-op.

- The two type rulers now measure two different universes: 	sconfig.check.json resolves `@deepseek-ai/*` through explicit paths into the deepseek-harness checkout's built types (guarded by `scripts/typecheck-checkout.mjs`, which reports `unverifiable` and exits 0 where no checkout exists), while `typecheck:ci` keeps measuring the published line from this repo's own `node_modules`. Before this, both configs resolved the same 
ode_modules, so the second ruler was decorative.

## [0.2.11] - 2026-09-18

### Fixed

- Close the storage domain through an effect registered before the open resolves. The previous shape registered the `close()` effect from inside the open's `then()`, so unmounting while the open was still in flight threw `INACTIVE_EFFECT` and the domain handle was never closed; that rejection was then swallowed by an empty `catch`. The effect is now registered first and reads the open promise from its closure, so the handle is closed exactly once even when the unmount wins the race, and a failed open is reported with a visible warning instead of a silent swallow. Covered by two lifecycle tests: unmount-during-open (close still called exactly once) and rejected open (no unhandled rejection).

### Changed

- The session-event gate now announces every refused audit append once per session and type. `mask/applied` is still not written on hosts that neither record the type nor stamp the `ignorable` envelope (sessions keep loading), but the refusal is no longer silent: the first refusal per session logs a visible warning naming the type and the documented limitation. No `session.append` behavior changed.

### Added

- `dsh.manifestVersion: 1` and the canonical three-clause `engines.dsh` range (honest manifest declaration; no runtime reader yet).

### Docs

- Re-anchor the five-language compatibility row to `dsh-v0.1.6-alpha.2` (adapted 2026-09-18) and state the audit-gate facts for that line: the host records 58 session event types, none of them `mask/*`, and `Session.append` still cannot stamp the `ignorable` envelope, so audit appends stay skipped while sessions keep loading.
- Describe the two typecheck rulers in the development section: `typecheck` runs the alpha.2 development face and `typecheck:ci` runs the published-line face with cleared paths.

## [0.2.10] - 2026-09-12

### Fixed

- Correct the package description: it claimed the plugin anonymizes "names … and addresses", which the pure-host form never did — `person` and `address` are NER-only entities and `mode: regex+ner` fails loudly at load (see `README.md` Known limitations, `ARCHITECTURE.md`, `SECURITY.md`). The description now states the regex-detectable set (phone, email, ID card, bank card, key, opt-in IP) and records the NER limitation. The false claim was the only one in the repository and was visible on the npm package page; a published version cannot be corrected retroactively, so this takes effect with the next release.
- Correct the display-layer claim in the description and in all five READMEs. Both said the restore table lets placeholders be mapped back "at the display layer" / that "the restore table and `restore()` are the complete host-side seam a client plugin would consume". There is no display-layer restore: the browser half is not shipped, `index.mjs` exports no bare `restore()` (the seam is the `RestoreStore` class, whose methods take a session id), and `RestoreStore` is a host-side class a browser half cannot consume directly. The text now states what exists — the host-side table and `RestoreStore` seam, reached through a host remote by any future client half, with `/mask restore <text>` as today's unmasking surface.
- Describe `maskClientEnabled` accurately rather than as dead code. The key is deliberately part of the published surface — declared in `types.d.ts`, documented in `cordis.patch.yml` with its rationale, defaulted in the `Config` schema, and asserted by `test/index.test.mjs` — so it stays. What the docs now say is narrower and true: the key is schema-declared and validated at load, but no runtime code reads it yet, so it has no effect until the browser half ships.
- Correct the "opt-in" scope in the Chinese README's request-time masking bullet: it called every entity opt-in, while only `ip` is (phone, email, ID card, bank card, and key are on by default). The English copy already said this; the Spanish, Portuguese, and Hindi bullets already scoped `(opt-in)` to `ip` and were left unchanged.

### Docs

- Declare the region-specific scope of the built-in detectors in all five READMEs' Known limitations: `phone` matches mainland-China mobile numbers only (`1[3-9]` plus nine digits) and `id-card` matches the 18-character Chinese resident ID only, so other countries' phone numbers and national identifiers are not detected. `email`, `ip`, and `key` are region-agnostic; `bank-card` accepts any 16-19 digit run at a lower confidence score. The behaviour is unchanged — the limitation was simply undocumented.

## [0.2.9] - 2026-09-12

### Changed

- Rename the four translated READMEs to `README-<lang>.md`. npm selects the package-page readme as the first markdown file matching its `{README,README.*}` glob (`@npmcli/package-json`, publish path), and that glob order puts `README.<lang>.md` ahead of `README.md` — so npm was serving the Simplified-Chinese file for this package too (measured on 15/15 sampled packages of the family). The new names sit outside the glob, so the English source is served again. No content changed apart from the language-switcher link each translation holds to its siblings, and the repo readme gate still passes. Takes effect with the next release; an already-published version cannot gain a corrected readme retroactively.
- Pin the `@deepseek-ai/dsh-*` dev/test dependencies to the published `0.1.5-rc.2` line and record `0.1.5-rc.2` in `dshWorkshop.compatibility.dshVersions`; the monthly Compat workflow now runs against `0.1.5-rc.2`. The peer range `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0` is unchanged, so no supported host line is dropped.

### Fixed

- The release workflow claimed provenance but never passed the flag: it runs `npm publish --access public`, and npm only attests a token-based publish when `--provenance` is given explicitly. The publish step is now `npm publish --access public --provenance`, matching the rest of the family. Takes effect from the next release; an already-published version cannot gain attestations retroactively.
## [0.2.8] - 2026-09-10

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

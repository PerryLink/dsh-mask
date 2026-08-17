# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-17

### Added

- PII masking middleware for DeepSeek Harness: request-time anonymization at the `agent/pre-step` boundary (phones, emails, ID cards, bank cards, keys, and opt-in IPs become `<TYPE_N>` placeholders), a `placeholder → original` restore table kept only in memory and the controlled `dsh_mask` storage domain, and a `mask/applied` audit session event that records counts + type distribution only.
- The `/mask` command (`status`/`on`/`off`/`restore <text>`/`help`) and the `mask_test` model tool (mask a snippet, never reveal the original).
- The regex PII detector ported from Pii-Stripper-Middleware (`lib/strip.mjs`), plus a `key` detector for the spec's secret-type PII.
- Pure display/log sanitizers (`lib/sanitize.mjs`) with extreme-case coverage: PII plaintext and the mapping table never leak into logs or results.
- Schemastery configuration with fail-loud bounds; every tunable documented in `cordis.patch.yml` and the five-language READMEs.
- Session-event adaptive gate (`mask/applied` appends only when the host records the type or supports the `ignorable` envelope).

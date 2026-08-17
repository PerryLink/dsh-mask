# Security policy

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Report privately through GitHub's private vulnerability reporting:

**https://github.com/PerryLink/dsh-mask/security/advisories/new**

That flow keeps the report confidential while we triage, and it is the channel we watch first.

## Before you report

- **Redact sensitive data** from any logs or `/mask` output you attach: tokens, API keys, secrets, Authorization/request headers, personal paths, account identifiers, and — especially — real PII (phones, emails, ID cards, bank cards). Replace them with placeholders such as `<PHONE_1>` before pasting.
- Include, when possible: the plugin version, the harness (`dsh`) version, Node and OS versions, the `entities`/`mode` configuration, and the minimal steps to reproduce.

## What to expect

- **Acknowledgment**: within 5 business days.
- **Triage**: within 10 business days we confirm the issue and assess severity, or ask for more details.
- **Fix**: security fixes are prepared in a private fork, released as a patch version, and announced in the release notes.

## Disclosure and credit

- We follow coordinated disclosure: a public advisory (and CVE request where appropriate) is published once a fix ships.
- Reporters are credited in the advisory unless they ask to remain anonymous. There is no bug bounty program at this time.

## Scope

This plugin anonymizes PII at the model boundary. Its own guarantees are:

- **Plaintext never enters the session log.** The masked (placeholder) form is what gets logged and sent to the model; the originals stay in the restore table (memory, and the controlled `dsh_mask` storage domain when `persistRestoreTable: true`).
- **Audit without plaintext.** The `mask/applied` session event records only counts and a type distribution, never the original text or the mapping.
- **Sanitized output.** `lib/sanitize.mjs` redacts PII, secrets, and URL credentials before any text reaches the model or the log; `mask_test` and `/mask status` never echo originals.
- **Controlled restore.** `/mask restore` is the single explicit reveal surface and reads only the active session's mapping.
- **No network, no credentials.** The plugin performs no network requests and stores no credentials.
- **Fail closed.** Unimplemented `mode` (`regex+ner`), `scope` (`tools`), NER-only entities, and out-of-bounds numbers fail loudly at load.

Two residual risks are the operator's to manage:

- When `persistRestoreTable: true`, the restore table holds plaintext PII on disk inside the `dsh_mask` storage domain. Protect that storage (file permissions, encrypted volume); set `persistRestoreTable: false` for memory-only operation.
- Masking is regex-based; it cannot catch every PII shape (names and addresses need an NER recognizer, which is not bundled). Treat it as a defense-in-depth boundary, not a completeness guarantee.

Vulnerabilities in the harness itself should be reported to the official harness maintainers instead.

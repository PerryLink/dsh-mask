# dsh-mask PII benchmark results

> Deterministic regex-detector benchmark. Regenerate with `node benchmark/run.mjs`
> (no build step, zero new dependencies).

## Method

- **Detector**: `regexDetect` from `lib/strip.mjs` — the exact regex path the
  `agent/pre-step` masking middleware uses. Each entity type is evaluated with only
  that type's patterns enabled, so a match is a per-type detection.
- **Detection** = at least one regex match of that type.
- **Labels**: `label: true` = a PII-shaped value of that type; `label: false` = a
  boundary/non-PII value (wrong length, invalid separator, out-of-range octet, etc.).
- **Not measured**: `person` and `address` are NER-only types — they are not on the
  regex path (`mode: regex+ner` fails loud at load), so this benchmark does not claim
  coverage for them.

## Per-type metrics

| Type | TP | FP | FN | TN | Precision | Recall | F1 | FPR |
|---|---|---|---|---|---|---|---|---|
| phone | 10 | 0 | 0 | 8 | 1.000 | 1.000 | 1.000 | 0.000 |
| email | 10 | 0 | 0 | 8 | 1.000 | 1.000 | 1.000 | 0.000 |
| id-card | 10 | 0 | 0 | 8 | 1.000 | 1.000 | 1.000 | 0.000 |
| bank-card | 10 | 0 | 0 | 8 | 1.000 | 1.000 | 1.000 | 0.000 |
| key | 10 | 0 | 0 | 8 | 1.000 | 1.000 | 1.000 | 0.000 |
| ip | 10 | 4 | 0 | 4 | 0.714 | 1.000 | 0.833 | 0.500 |

## Overall

| Aggregate | Precision | Recall | F1 |
|---|---|---|---|
| Macro (mean of the six types) | 0.952 | 1.000 | 0.972 |
| Micro (pooled TP/FP/FN across types) | 0.938 | 1.000 | 0.968 |

- Samples: 108 total
  (60 positive,
   48 negative).
- Micro false-positive rate: 0.083.

## Per-sample notes

- Missed positives (false negatives): none.
- Flagged negatives (false positives): ip/ip-neg-05, ip/ip-neg-06, ip/ip-neg-07, ip/ip-neg-08.

## Known limitations (honest)

- **`ip` is range-loose.** The regex `\b(?:\d{1,3}\.){3}\d{1,3}\b` accepts
  out-of-range octets (`999.999.999.999`, `300.1.1.1`) and trailing octets
  (`1.2.3.4.5`), so several non-IP negatives are flagged. IPv6 is not covered.
- **Format-only, no checksums.** `id-card` validates the 18-character shape
  (17 digits + digit/X), not the GB-11643 checksum; `bank-card` validates the
  16–19-digit shape, not the Luhn checksum. A synthetic-but-well-formed number is
  detected as PII-shaped by design.
- **No 15-digit Amex / IPv6.** `bank-card` starts at 16 digits, so 15-digit cards are
  missed; `ip` matches dotted-quad IPv4 only.
- **Simple email rule.** Local part, a single `@`, and a dotted TLD; no SMTP/IDN
  validation.

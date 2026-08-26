// benchmark/run.mjs — deterministic PII benchmark runner for dsh-mask.
//
// Runs the real regex detector (lib/strip.mjs `regexDetect`, the exact path the
// masking middleware uses) over the labeled dataset, one entity type at a time
// with only that type's patterns enabled, then writes:
//   benchmark/results.json  — per-type confusion matrix + P/R/F1 + per-sample verdict
//   benchmark/RESULTS.md    — the human-readable report
//
// Zero new dependencies. Run with:  node benchmark/run.mjs
// Exit 0 on success; a malformed dataset or missing detector module exits 1.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUILTIN_PATTERNS, regexDetect } from '../lib/strip.mjs'
import { macroAverage, microAverage, metricsFor } from './metrics.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const datasetPath = join(here, 'dataset', 'pii.json')
const resultsJsonPath = join(here, 'results.json')
const resultsMdPath = join(here, 'RESULTS.md')

const dataset = JSON.parse(readFileSync(datasetPath, 'utf8'))

/** Detected = at least one regex match of the requested type. */
function detectType(text, type) {
  const patterns = BUILTIN_PATTERNS.filter(pattern => pattern.entity === type)
  return regexDetect(text, patterns).length > 0
}

const perType = dataset.types.map(type => {
  const outcomes = type.samples.map(sample => {
    const predicted = detectType(sample.text, type.id)
    return { id: sample.id, label: sample.label, predicted }
  })
  return { id: type.id, metrics: metricsFor(outcomes), samples: outcomes }
})

const classMetrics = perType.map(entry => entry.metrics)
const overall = {
  macro: macroAverage(classMetrics),
  micro: microAverage(classMetrics),
}

const results = {
  name: dataset.name,
  version: dataset.version,
  detector: dataset.detector,
  generatedBy: 'benchmark/run.mjs',
  perType: perType.map(entry => ({
    id: entry.id,
    ...entry.metrics,
    samples: entry.samples,
  })),
  overall,
}

writeFileSync(resultsJsonPath, `${JSON.stringify(results, null, 2)}\n`)

// --- Markdown report ---------------------------------------------------------

const fmt = value => Number(value).toFixed(3)

const rows = perType.map(entry => {
  const m = entry.metrics
  return `| ${entry.id} | ${m.tp} | ${m.fp} | ${m.fn} | ${m.tn} | ${fmt(m.precision)} | ${fmt(m.recall)} | ${fmt(m.f1)} | ${fmt(m.fpr)} |`
}).join('\n')

const misses = []
const falsePositives = []
for (const entry of perType) {
  for (const sample of entry.samples) {
    if (sample.label && !sample.predicted) misses.push(`${entry.id}/${sample.id}`)
    if (!sample.label && sample.predicted) falsePositives.push(`${entry.id}/${sample.id}`)
  }
}

const md = `# dsh-mask PII benchmark results

> Deterministic regex-detector benchmark. Regenerate with \`node benchmark/run.mjs\`
> (no build step, zero new dependencies).

## Method

- **Detector**: \`regexDetect\` from \`lib/strip.mjs\` — the exact regex path the
  \`agent/pre-step\` masking middleware uses. Each entity type is evaluated with only
  that type's patterns enabled, so a match is a per-type detection.
- **Detection** = at least one regex match of that type.
- **Labels**: \`label: true\` = a PII-shaped value of that type; \`label: false\` = a
  boundary/non-PII value (wrong length, invalid separator, out-of-range octet, etc.).
- **Not measured**: \`person\` and \`address\` are NER-only types — they are not on the
  regex path (\`mode: regex+ner\` fails loud at load), so this benchmark does not claim
  coverage for them.

## Per-type metrics

| Type | TP | FP | FN | TN | Precision | Recall | F1 | FPR |
|---|---|---|---|---|---|---|---|---|
${rows}

## Overall

| Aggregate | Precision | Recall | F1 |
|---|---|---|---|
| Macro (mean of the six types) | ${fmt(overall.macro.precision)} | ${fmt(overall.macro.recall)} | ${fmt(overall.macro.f1)} |
| Micro (pooled TP/FP/FN across types) | ${fmt(overall.micro.precision)} | ${fmt(overall.micro.recall)} | ${fmt(overall.micro.f1)} |

- Samples: ${perType.reduce((sum, entry) => sum + entry.samples.length, 0)} total
  (${classMetrics.reduce((sum, m) => sum + m.positives, 0)} positive,
   ${classMetrics.reduce((sum, m) => sum + m.negatives, 0)} negative).
- Micro false-positive rate: ${fmt(overall.micro.fpr)}.

## Per-sample notes

- Missed positives (false negatives): ${misses.length === 0 ? 'none' : misses.join(', ')}.
- Flagged negatives (false positives): ${falsePositives.length === 0 ? 'none' : falsePositives.join(', ')}.

## Known limitations (honest)

- **\`ip\` is range-loose.** The regex \`\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b\` accepts
  out-of-range octets (\`999.999.999.999\`, \`300.1.1.1\`) and trailing octets
  (\`1.2.3.4.5\`), so several non-IP negatives are flagged. IPv6 is not covered.
- **Format-only, no checksums.** \`id-card\` validates the 18-character shape
  (17 digits + digit/X), not the GB-11643 checksum; \`bank-card\` validates the
  16–19-digit shape, not the Luhn checksum. A synthetic-but-well-formed number is
  detected as PII-shaped by design.
- **No 15-digit Amex / IPv6.** \`bank-card\` starts at 16 digits, so 15-digit cards are
  missed; \`ip\` matches dotted-quad IPv4 only.
- **Simple email rule.** Local part, a single \`@\`, and a dotted TLD; no SMTP/IDN
  validation.
`;

writeFileSync(resultsMdPath, md)

// --- stdout summary ----------------------------------------------------------

console.log(`dsh-mask PII benchmark: ${perType.length} types, ${results.perType.reduce((s, t) => s + t.total, 0)} samples`)
for (const entry of perType) {
  const m = entry.metrics
  console.log(`  ${entry.id.padEnd(10)} P=${fmt(m.precision)} R=${fmt(m.recall)} F1=${fmt(m.f1)} (TP ${m.tp}, FP ${m.fp}, FN ${m.fn})`)
}
console.log(`  macro F1=${fmt(overall.macro.f1)}  micro F1=${fmt(overall.micro.f1)}`)
console.log(`wrote ${resultsJsonPath} and ${resultsMdPath}`)

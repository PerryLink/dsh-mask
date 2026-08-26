// test/benchmark.test.mjs — unit tests for the benchmark metrics module and
// the labeled dataset's well-formedness. Runs with the repo's `node --test`.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import {
  confusion,
  f1,
  falsePositiveRate,
  macroAverage,
  metricsFor,
  microAverage,
  precision,
  recall,
} from '../benchmark/metrics.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const dataset = JSON.parse(readFileSync(join(here, '..', 'benchmark', 'dataset', 'pii.json'), 'utf8'))

test('confusion counts TP/FP/FN/TN correctly', () => {
  const outcomes = [
    { label: true, predicted: true },
    { label: true, predicted: true },
    { label: true, predicted: false },
    { label: false, predicted: true },
    { label: false, predicted: false },
    { label: false, predicted: false },
  ]
  assert.deepEqual(confusion(outcomes), { tp: 2, fp: 1, fn: 1, tn: 2 })
})

test('precision/recall/f1 match hand-computed values', () => {
  assert.equal(precision({ tp: 2, fp: 1, fn: 1, tn: 2 }), 2 / 3)
  assert.equal(recall({ tp: 2, fp: 1, fn: 1, tn: 2 }), 2 / 3)
  assert.equal(f1(2 / 3, 2 / 3), 2 / 3)
  assert.equal(falsePositiveRate({ tp: 2, fp: 1, fn: 1, tn: 2 }), 1 / 3)
})

test('metrics are zero (not NaN) when a denominator is empty', () => {
  assert.deepEqual(metricsFor([]), {
    tp: 0, fp: 0, fn: 0, tn: 0, total: 0, positives: 0, negatives: 0,
    precision: 0, recall: 0, f1: 0, fpr: 0,
  })
  assert.equal(precision({ tp: 0, fp: 0, fn: 1, tn: 0 }), 0)
  assert.equal(recall({ tp: 0, fp: 1, fn: 0, tn: 0 }), 0)
})

test('a perfect classifier scores F1 = 1', () => {
  const perfect = metricsFor([
    { label: true, predicted: true },
    { label: false, predicted: false },
  ])
  assert.equal(perfect.precision, 1)
  assert.equal(perfect.recall, 1)
  assert.equal(perfect.f1, 1)
  assert.equal(perfect.fpr, 0)
})

test('macro average is the unweighted mean of per-class F1', () => {
  const a = metricsFor([{ label: true, predicted: true }, { label: false, predicted: false }])
  const b = metricsFor([{ label: true, predicted: false }])
  const avg = macroAverage([a, b])
  assert.equal(avg.classes, 2)
  assert.equal(avg.f1, Number(((a.f1 + b.f1) / 2).toFixed(3)))
})

test('micro average pools counts across classes', () => {
  const a = metricsFor([{ label: true, predicted: true }])
  const b = metricsFor([{ label: true, predicted: false }])
  const micro = microAverage([a, b])
  assert.equal(micro.tp, 1)
  assert.equal(micro.fn, 1)
  assert.equal(micro.recall, 0.5)
})

test('dataset is well-formed: every type has positives and negatives, booleans, and ids', () => {
  assert.ok(Array.isArray(dataset.types) && dataset.types.length === 6, 'six entity types expected')
  for (const type of dataset.types) {
    assert.match(type.id, /^(phone|email|id-card|bank-card|key|ip)$/)
    const positives = type.samples.filter(sample => sample.label === true)
    const negatives = type.samples.filter(sample => sample.label === false)
    assert.ok(positives.length > 0, `${type.id} has no positive samples`)
    assert.ok(negatives.length > 0, `${type.id} has no negative samples`)
    for (const sample of type.samples) {
      assert.equal(typeof sample.label, 'boolean', `${type.id}/${sample.id} label must be boolean`)
      assert.equal(typeof sample.text, 'string', `${type.id}/${sample.id} text must be a string`)
      assert.ok(sample.text.length > 0, `${type.id}/${sample.id} text is empty`)
    }
    const ids = new Set(type.samples.map(sample => sample.id))
    assert.equal(ids.size, type.samples.length, `${type.id} sample ids must be unique`)
  }
})

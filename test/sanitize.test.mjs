// test/sanitize.test.mjs — 展示/日志脱敏（PII 原文、密钥、URL 凭据、映射表绝不泄漏）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { redactText, redactMapping } from '../lib/sanitize.mjs'

test('PII entities are redacted to ***', () => {
  const text = '联系 13812345678，邮箱 a@b.com，证件 110101199001011234，卡 6222021234567890，IP 192.168.1.100'
  const out = redactText(text)
  assert.ok(!out.includes('13812345678'))
  assert.ok(!out.includes('a@b.com'))
  assert.ok(!out.includes('110101199001011234'))
  assert.ok(!out.includes('6222021234567890'))
  assert.ok(!out.includes('192.168.1.100'))
  assert.ok(out.includes('***'))
})

test('secrets (sk/ghp) are redacted', () => {
  const out = redactText('err: sk-fake-pattern leaked; ghp_fake_pattern too')
  assert.ok(!out.includes('sk-fake-pattern'))
  assert.ok(!out.includes('ghp_fake_pattern'))
})

test('key=value credentials are redacted regardless of case', () => {
  const out = redactText('api_key=abc123&password=swordfish; API-KEY = zzz')
  assert.ok(!out.includes('abc123'))
  assert.ok(!out.includes('swordfish'))
  assert.ok(!out.includes('zzz'))
})

test('URL userinfo is redacted', () => {
  const out = redactText("fatal: unable to access 'https://alice:hunter2@example.com/r.git/': 403")
  assert.ok(!out.includes('hunter2'))
  assert.ok(out.includes('//***@example.com'))
})

test('redactText never throws on non-string input', () => {
  assert.equal(redactText(42), '42')
  assert.equal(redactText(null), 'null')
  assert.equal(redactText(undefined), 'undefined')
})

test('redactMapping never reveals originals (mapping table must not leak)', () => {
  const out = redactMapping({ '<PHONE_1>': '13812345678', '<EMAIL_1>': 'a@b.com' })
  assert.deepEqual(out, { '<PHONE_1>': '***', '<EMAIL_1>': '***' })
  assert.ok(!JSON.stringify(out).includes('13812345678'))
  assert.ok(!JSON.stringify(out).includes('a@b.com'))
})

test('redactMapping on garbage returns an empty object', () => {
  assert.deepEqual(redactMapping(null), {})
  assert.deepEqual(redactMapping('x'), {})
})

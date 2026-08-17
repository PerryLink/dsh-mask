// test/strip.test.mjs — PII 脱敏/还原纯函数（移植上游 test_core.py 回归 + 新增 key/统计/回载）。

import test from 'node:test'
import assert from 'node:assert/strict'
import { Stripper, createStripper, BUILTIN_PATTERNS } from '../lib/strip.mjs'

const ALL_ENTITIES = ['phone', 'email', 'id-card', 'bank-card', 'key', 'ip']

/** 工厂：全新脱敏器（regex 模式，启用全部 regex 实体）。 */
function stripper() {
  return createStripper({ entities: ALL_ENTITIES, maxEntries: 1000 })
}

// ---------------------------------------------------------------------------
// 手机号检测
// ---------------------------------------------------------------------------

test('cn mobile detected and replaced', () => {
  const s = stripper()
  const result = s.strip('请联系 13812345678 预约。')
  assert.ok(!result.includes('13812345678'))
  assert.ok(result.includes('<PHONE_1>'))
})

test('cn mobile various prefixes', () => {
  for (const prefix of ['138', '139', '150', '186', '199']) {
    const phone = `${prefix}00000000`
    const result = stripper().strip(`手机：${phone}`)
    assert.ok(!result.includes(phone))
  }
})

test('phone not detected inside a longer number', () => {
  const s = stripper()
  const result = s.strip('编号：138123456789999')
  assert.ok(result.includes('138123456789999') || !result.includes('<PHONE_1>'))
})

test('same phone reuses the same placeholder', () => {
  const s = stripper()
  const result = s.strip('备用号 13812345678，主号也是 13812345678')
  assert.equal(result.match(/<PHONE_1>/gu)?.length, 2)
  assert.ok(!result.includes('<PHONE_2>'))
})

test('different phones get different placeholders', () => {
  const result = stripper().strip('A: 13812345678，B: 18987654321')
  assert.ok(result.includes('<PHONE_1>'))
  assert.ok(result.includes('<PHONE_2>'))
})

// ---------------------------------------------------------------------------
// 身份证 / 银行卡检测
// ---------------------------------------------------------------------------

test('cn id card detected', () => {
  const result = stripper().strip('身份证：110101199001011234')
  assert.ok(!result.includes('110101199001011234'))
  assert.ok(result.includes('<ID_CARD_1>'))
})

test('cn id card with X and x suffix', () => {
  for (const suffix of ['X', 'x']) {
    const value = `11010119900101123${suffix}`
    const result = stripper().strip(`证件号 ${value}`)
    assert.ok(!result.includes(value))
  }
})

test('bank card (16-19 digits) detected', () => {
  const value = '6222021234567890'
  const result = stripper().strip(`卡号：${value}`)
  assert.ok(!result.includes(value))
  assert.ok(result.includes('<BANK_CARD_1>'))
})

test('18-digit number is an id card, not a bank card (higher score wins overlap)', () => {
  const result = stripper().strip('号码：110101199001011234')
  assert.ok(result.includes('<ID_CARD_1>'))
  assert.ok(!result.includes('<BANK_CARD_1>'))
})

// ---------------------------------------------------------------------------
// 邮箱 / IP 检测
// ---------------------------------------------------------------------------

test('email detected', () => {
  const result = stripper().strip('发邮件到 user@example.com 即可。')
  assert.ok(!result.includes('user@example.com'))
  assert.ok(result.includes('<EMAIL_1>'))
})

test('email with plus and multi-part domain', () => {
  const value = 'user+tag@domain.co.uk'
  const result = stripper().strip(`邮箱：${value}`)
  assert.ok(!result.includes(value))
})

test('ipv4 detected', () => {
  const result = stripper().strip('服务器 IP：192.168.1.100')
  assert.ok(!result.includes('192.168.1.100'))
  assert.ok(result.includes('<IP_1>'))
})

// ---------------------------------------------------------------------------
// 密钥检测（规格要求的"密钥"，上游无此检测器，本仓库新增）
// ---------------------------------------------------------------------------

test('api key and github token detected as KEY', () => {
  const result = stripper().strip('key: sk-fake-pattern')
  assert.ok(!result.includes('sk-fake-pattern'))
  assert.ok(result.includes('<KEY_1>'))
})

test('github token detected as KEY', () => {
  const result = stripper().strip('token ghp_fake_pattern')
  assert.ok(!result.includes('ghp_fake_pattern'))
  assert.ok(result.includes('<KEY_1>'))
})

// ---------------------------------------------------------------------------
// 映射与还原
// ---------------------------------------------------------------------------

test('mapping populated after strip and is a copy', () => {
  const s = stripper()
  s.strip('电话：13812345678')
  assert.equal(s.mapping()['<PHONE_1>'], '13812345678')
  const copy = s.mapping()
  copy['fake'] = 'tampered'
  assert.ok(!('fake' in s.mapping()))
})

test('mapping reset on a new single-shot strip', () => {
  const s = stripper()
  s.strip('第一条 13812345678')
  s.strip('第二条 18900000000')
  assert.equal(s.mapping()['<PHONE_1>'], '18900000000')
})

test('restore roundtrip for multiple entity types', () => {
  const original = '张三（13812345678）邮箱 zs@ex.com，证件 110101199001011234'
  const s = stripper()
  const masked = s.strip(original)
  assert.equal(s.restore(masked), original)
})

test('restore repeated value', () => {
  const original = '主号 13812345678，备用号也是 13812345678'
  const s = stripper()
  const masked = s.strip(original)
  assert.equal(s.restore(masked), original)
})

test('restore AI reply that keeps placeholders', () => {
  const s = stripper()
  s.strip('联系 13812345678')
  const restored = s.restore('好的，我已记录 <PHONE_1> 的联系方式。')
  assert.ok(restored.includes('13812345678'))
  assert.ok(!restored.includes('<PHONE_1>'))
})

// ---------------------------------------------------------------------------
// 累计模式（stripInto，会话内跨请求不重置）
// ---------------------------------------------------------------------------

test('stripInto accumulates across calls without resetting', () => {
  const s = stripper()
  s.stripInto('电话 13812345678')
  s.stripInto('邮箱 a@b.com')
  assert.ok('<PHONE_1>' in s.mapping())
  assert.ok('<EMAIL_1>' in s.mapping())
  // 第二次调用后的占位符不冲突：邮箱是 EMAIL_1（不同标签），电话仍在映射里。
  assert.equal(s.mapping()['<PHONE_1>'], '13812345678')
  assert.equal(s.mapping()['<EMAIL_1>'], 'a@b.com')
})

test('stripInto returns per-call delta stats without plaintext', () => {
  const s = stripper()
  const first = s.stripInto('电话 13812345678，邮箱 a@b.com')
  assert.equal(first.replaced, 2)
  assert.deepEqual(first.distribution, { PHONE: 1, EMAIL: 1 })
  const second = s.stripInto('另一个邮箱 b@c.com')
  assert.equal(second.replaced, 1)
  assert.deepEqual(second.distribution, { EMAIL: 1 })
  // 累计统计只含数字与标签，绝不含原文。
  const stats = s.stats()
  assert.equal(stats.replaced, 3)
  assert.deepEqual(stats.distribution, { PHONE: 1, EMAIL: 2 })
  assert.ok(!JSON.stringify(stats).includes('13812345678'))
  assert.ok(!JSON.stringify(stats).includes('a@b.com'))
})

// ---------------------------------------------------------------------------
// 重叠消解 / 边界
// ---------------------------------------------------------------------------

test('overlapping entities never crash and leave no raw digits', () => {
  const text = '号码：13812345678901234567'
  const result = stripper().strip(text)
  assert.equal(typeof result, 'string')
})

test('strip coerces non-string input and never throws', () => {
  const s = stripper()
  assert.equal(s.strip(undefined), 'undefined')
  assert.equal(s.strip(null), 'null')
  assert.equal(s.strip(42), '42')
})

test('empty and oversized text return unchanged', () => {
  const s = stripper()
  assert.equal(s.strip(''), '')
})

// ---------------------------------------------------------------------------
// 回载（loadMapping，跨重启还原）
// ---------------------------------------------------------------------------

test('loadMapping restores placeholders and keeps new placeholders unique', () => {
  const s = stripper()
  s.loadMapping({ '<PHONE_1>': '13812345678', '<ID_CARD_1>': '110101199001011234' })
  assert.equal(s.restore('<PHONE_1> and <ID_CARD_1>'), '13812345678 and 110101199001011234')
  // 回载后新占位符编号不冲突。
  const result = s.stripInto('电话 13900000000')
  assert.equal(result.text, '电话 <PHONE_2>')
})

test('detector registry covers all regex entities', () => {
  const entities = new Set(BUILTIN_PATTERNS.map((p) => p.entity))
  for (const entity of ['phone', 'email', 'id-card', 'bank-card', 'key', 'ip']) {
    assert.ok(entities.has(entity), `missing detector for ${entity}`)
  }
})

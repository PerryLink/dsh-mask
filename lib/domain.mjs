// lib/domain.mjs — 'dsh_mask' 存储领域声明（唯一允许 zod/DSH 包的 lib 模块：
// 领域记录 schema 是持久边界校验器，zod 与 defineDomain 是 harness 自身词汇）。

import { z } from 'zod'
import { defineDomain, domainTable } from '@deepseek-ai/dsh-storage-domain'
import { DOMAIN_NAME, RESTORE_TABLE } from './constants.mjs'

/**
 * 恢复表记录（按 sessionId 键）：占位符 -> 原文的映射 + 更新时间。
 * 注意：entries 是 PII 原文，只落在受控 storageDomain，绝不进会话日志。
 */
export const restoreRecordSchema = z.object({
  sessionId: z.string().min(1).max(128),
  entries: z.record(z.string(), z.string()),
  updatedAt: z.number().int().nonnegative(),
})

/**
 * 'dsh_mask' 领域 spec：一张 'restore' 表，键为会话 id。
 * version 变更即废弃整介质（预发布立场，无迁移）。
 */
export const dshMaskDomainSpec = defineDomain({
  name: DOMAIN_NAME,
  version: 1,
  tables: { [RESTORE_TABLE]: domainTable(restoreRecordSchema) },
})

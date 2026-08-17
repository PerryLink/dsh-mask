// types.d.ts — dsh-mask 类型契约（会话事件声明合并 + 配置类型）。

declare module '@deepseek-ai/dsh-session' {
  interface SessionEventMap {
    /**
     * 一次请求前脱敏的审计记录（log-only）：只记"替换了多少处 + 类型分布"，
     * 绝不携带 PII 原文或占位符映射。注意：当前宿主构建（KNOWN_SESSION_EVENT_TYPES）
     * 尚未收录 mask/*，运行时经自适应门跳过 append；宿主收录后自动开启
     * （见 README「会话事件」）。
     */
    'mask/applied': {
      sessionId: string
      replaced: number
      distribution: Record<string, number>
    }
  }
}

export interface Config {
  /** 总开关；false 时命令、工具与 pre-step 监听器全部卸载。 */
  enabled?: boolean
  /** 检测模式；只有 'regex' 实现，'regex+ner'（姓名/地址识别）预留并响亮失败。 */
  mode?: 'regex' | 'regex+ner'
  /** 启用的实体类型；regex 集为 phone/email/id-card/bank-card/key/ip，person/address 需 NER。 */
  entities?: string[]
  /** 遮罩作用域；只有 'messages'（agent/pre-step 消息）实现，'tools' 预留并响亮失败。 */
  scope?: 'messages' | 'tools'
  /** 注册 /mask 命令（默认 true）。 */
  registerCommand?: boolean
  /** tools 服务存在时注册 mask_test 工具（默认 true）。 */
  registerTools?: boolean
  /** 恢复表持久化到受控 storageDomain（false = 仅内存，重启丢失）。 */
  persistRestoreTable?: boolean
  /** 每会话恢复条目上限（超出逐出最旧）。 */
  maxRestoreEntriesPerSession?: number
  /** 内存会话脱敏器上限（LRU 逐出，映射按需从领域回载）。 */
  maxSessions?: number
}

/** mask_test 工具规范结果。 */
export interface MaskTestValue {
  ok: boolean
  masked: string
  replaced: number
  distribution: { label: string; count: number }[]
  error?: string
}

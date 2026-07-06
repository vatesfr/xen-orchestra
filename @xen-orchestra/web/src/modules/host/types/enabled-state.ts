export const ENABLED_STATE_ACTION = {
  ENABLE: 'enable',
  DISABLE: 'disable',
} as const

export type EnabledStateAction = (typeof ENABLED_STATE_ACTION)[keyof typeof ENABLED_STATE_ACTION]

export const BACKUP_EXPRESSION_CONTEXT = {
  run: {
    dayOfWeek: { type: 'number' },
    dayOfMonth: { type: 'number' },
    hour: { type: 'number' },
    month: { type: 'number' },
    year: { type: 'number' },
  },
  sr: {
    name_label: { type: 'string' },
    type: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'string[]' },
  },
  remote: {
    name: { type: 'string' },
    type: { type: 'string' },
    tags: { type: 'string[]' },
  },
  vm: {
    name_label: { type: 'string' },
    tags: { type: 'string[]' },
    power_state: { type: 'string' },
  },
} as const

export type BACKUP_EXPRESSION_CONTEXT = (typeof BACKUP_EXPRESSION_CONTEXT)[keyof typeof BACKUP_EXPRESSION_CONTEXT]

export const BACKUP_SETTING_CONTEXT = {
  healthCheckVmsWithTags: ['vm', 'run'],
  fullInterval: ['vm', 'run', 'chainLength'],
  vmFilter: ['vm', 'run'],
  srs: ['sr', 'run'],
  remotes: ['remote', 'run'],
} as const

export type BACKUP_SETTING_CONTEXT = (typeof BACKUP_SETTING_CONTEXT)[keyof typeof BACKUP_SETTING_CONTEXT]

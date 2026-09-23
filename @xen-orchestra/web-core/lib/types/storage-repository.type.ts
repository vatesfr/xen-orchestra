export const SR_SCOPE_TYPE = {
  POOL: 'pool',
  HOST: 'host',
} as const

export type SrScope<THostId extends string = string> =
  | { type: typeof SR_SCOPE_TYPE.POOL }
  | { type: typeof SR_SCOPE_TYPE.HOST; hostId: THostId }

export const SR_ACCESS_MODE = {
  LOCAL: 'local',
  SHARED: 'shared',
  MIXED: 'mixed',
} as const

export type SrAccessMode = (typeof SR_ACCESS_MODE)[keyof typeof SR_ACCESS_MODE]

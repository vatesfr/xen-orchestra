import type { XenApiHost } from '@/libs/xen-api/xen-api.types'

export const SR_SCOPE_TYPE = {
  POOL: 'pool',
  HOST: 'host',
} as const

export type SrScope =
  | { type: typeof SR_SCOPE_TYPE.POOL }
  | { type: typeof SR_SCOPE_TYPE.HOST; hostRef: XenApiHost['$ref'] }

export const SR_ACCESS_MODE = {
  LOCAL: 'local',
  SHARED: 'shared',
  MIXED: 'mixed',
} as const

export type SrAccessMode = (typeof SR_ACCESS_MODE)[keyof typeof SR_ACCESS_MODE]

export const CONNECTION_ACTION = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const

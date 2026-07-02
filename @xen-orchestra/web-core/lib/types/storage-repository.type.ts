export const SR_SCOPE_TYPE = {
  POOL: 'pool',
  HOST: 'host',
} as const

export type SrScope = { type: typeof SR_SCOPE_TYPE.POOL } | { type: typeof SR_SCOPE_TYPE.HOST; hostId: string }

export const SR_ACCESS_MODE = {
  LOCAL: 'local',
  SHARED: 'shared',
  MIXED: 'mixed',
} as const

export type SrAccessMode = (typeof SR_ACCESS_MODE)[keyof typeof SR_ACCESS_MODE]

export const SR_CONTENT_GROUP = { VDI: 'vdi', ISO: 'iso' } as const
export type SrContentGroup = (typeof SR_CONTENT_GROUP)[keyof typeof SR_CONTENT_GROUP]

export const SR_CONTENT_TYPE = { USER: 'user', ISO: 'iso' } as const
export type SrContentType = (typeof SR_CONTENT_TYPE)[keyof typeof SR_CONTENT_TYPE]

// Extend when adding SR types
export type SrType = 'lvm' | 'ext' | 'smb' | 'local' | 'smbiso'

export type NewSrPayload = {
  hostId: string
  nameLabel: string
  nameDescription?: string
  xapiType: string
  shared: boolean
  contentType: SrContentType
  deviceConfig: Record<string, string>
}

type NewSrInputBase = { hostId: string; name: string; description: string }

export type NewSrInput =
  | (NewSrInputBase & { type: 'lvm' | 'ext'; device: string })
  | (NewSrInputBase & { type: 'smb' | 'smbiso'; server: string; username?: string; password?: string })
  | (NewSrInputBase & { type: 'local'; path: string })

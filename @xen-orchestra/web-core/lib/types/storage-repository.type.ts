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

/** Extend when adding SR types */
export const SR_TYPE = ['ext', 'local', 'lvm', 'smb', 'smbiso'] as const
export type SrType = (typeof SR_TYPE)[number]

export const SR_PREFERRED_IMAGE_FORMATS = ['vhd', 'vhd, qcow2', 'qcow2, vhd', 'qcow2'] as const
export type SrPreferredImageFormats = (typeof SR_PREFERRED_IMAGE_FORMATS)[number]

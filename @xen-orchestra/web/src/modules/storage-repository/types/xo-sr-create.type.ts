import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { SR_ACCESS_MODE, type SrAccessMode } from '@core/types/storage-repository.type.ts'
import type { XoSr } from '@vates/types'

export type NewSrAccessMode = Exclude<SrAccessMode, typeof SR_ACCESS_MODE.MIXED>

export const SR_CONTENT_GROUP = { VDI: 'vdi', ISO: 'iso' } as const

export type SrContentGroup = (typeof SR_CONTENT_GROUP)[keyof typeof SR_CONTENT_GROUP]

/** The types offered by the create form, not XAPI SR types: `local` and `smbiso` both create an `iso` SR. Extend when adding SR types */
export type NewSrType = 'ext' | 'local' | 'lvm' | 'smb' | 'smbiso'

export const SR_PREFERRED_IMAGE_FORMATS = ['vhd', 'vhd, qcow2', 'qcow2, vhd', 'qcow2'] as const

export type SrPreferredImageFormats = (typeof SR_PREFERRED_IMAGE_FORMATS)[number]

export type SupportedSrType = Extract<XoSr['SR_type'], 'lvm' | 'ext' | 'smb' | 'iso'>

export type NewSrFormData = {
  poolId: FrontXoPool['id'] | undefined
  hostId: FrontXoHost['id'] | undefined
  accessMode: NewSrAccessMode
  type: NewSrType | undefined
  name: string
  description: string
  device: string
  server: string
  path: string
  username: string
  password: string
  useAuth: boolean
  preferredImageFormats: '' | SrPreferredImageFormats
}

type NewSrInputBase = { hostId: FrontXoHost['id']; name: string; description: string }

export type NewSrInput =
  | (NewSrInputBase & { type: 'lvm' | 'ext'; device: string; preferredImageFormats?: SrPreferredImageFormats })
  | (NewSrInputBase & {
      type: 'smb'
      server: string
      username?: string
      password?: string
      preferredImageFormats?: SrPreferredImageFormats
    })
  | (NewSrInputBase & { type: 'smbiso'; server: string; username?: string; password?: string })
  | (NewSrInputBase & { type: 'local'; path: string })

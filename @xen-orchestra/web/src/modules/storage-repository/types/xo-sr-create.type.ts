import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { SR_ACCESS_MODE, type SrAccessMode, type SrPreferredImageFormats } from '@core/types/storage-repository.type.ts'
import type { XoSr } from '@vates/types'

export type NewSrAccessMode = Exclude<SrAccessMode, typeof SR_ACCESS_MODE.MIXED>

export type SupportedSrType = Extract<XoSr['SR_type'], 'lvm' | 'ext' | 'smb' | 'iso'>

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

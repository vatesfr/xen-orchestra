import type { Xapi } from '@vates/types'

type CreateVmParams = Parameters<Xapi['createVm']>
export type CreateVmBody = Omit<CreateVmParams[1], 'nameLabel' | 'existingVdis' | 'vdis'> & {
  templateUuid: CreateVmParams[0]
  // Need to rewrite VDIs type because Unbrand cannot work with Union types
  vdis?: (
    | {
        name_label: string
        size: number
        sr?: string
        name_description?: string
      }
    | {
        userdevice: string
        name_label?: string
        size?: number
        sr?: string
        name_description?: string
      }
    | {
        destroy: true
        userdervice: string
      }
  )[]
}

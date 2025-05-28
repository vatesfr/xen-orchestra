export interface CreateNetworkBody {
  name: string
  description?: string
  pif: string
  /**
   * @default 1500
   */
  mtu?: number
  /**
   * @minimum 0 vlan must be between 0 and 4094
   * @maximum 4094 vlan must be between 0 and 4094
   */
  vlan: number
}
import type { Xapi, XoVdi } from '@vates/types'

type CreateVmParams = Parameters<Xapi['createVm']>
export type CreateVmBody = Omit<
  CreateVmParams[1],
  'nameLabel' | 'existingVdis' | 'vdis' | 'affinityHost' | 'installRepository'
> & {
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
  affinity?: string
  install?: {
    method: 'cdrom' | 'network'
    repository: XoVdi['id'] | ''
  }
}

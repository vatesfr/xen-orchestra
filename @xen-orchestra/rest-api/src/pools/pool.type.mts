import type { Xapi, XoHost, XoVmTemplate } from '@vates/types'

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

export type CreateVmParams = Parameters<Xapi['createVm']>[1]
/**
 * Properties that is applied after the VM creation
 */
export type CreateVmAfterCreateParams = {
  cloud_config?: string
  network_config?: string
  boot?: boolean
  destroy_cloud_config_vdi?: boolean
}
export type CreateVmBody = Omit<
  CreateVmParams,
  'nameLabel' | 'existingVdis' | 'vdis' | 'affinityHost' | 'installRepository'
> & {
  /** template UUID */
  template: XoVmTemplate['uuid']
  affinity?: XoHost['id']
  // Need to rewrite theses type because Unbrand cannot work with Union types
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
  install?: {
    method: 'cdrom' | 'network'
    /** VDI ID for cdrom method. Empty string for network method */
    repository: string | ''
  }
} & CreateVmAfterCreateParams

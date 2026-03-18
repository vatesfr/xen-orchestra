import type {
  BOND_MODE,
  Xapi,
  XcpPatches,
  XoAlarm,
  XoHost,
  XoPif,
  XoSr,
  XoVm,
  XoVmTemplate,
  XsPatches,
} from '@vates/types'
import { Unbrand } from '../open-api/common/response.common.mjs'

type BaseCreateNetworkBody = {
  name: string
  description?: string
  /**
   * @default 1500
   */
  mtu?: number
}

export type CreateNetworkBody = BaseCreateNetworkBody & {
  pif: XoPif['id']

  /**
   * @minimum 0 vlan must be between 0 and 4094
   * @maximum 4094 vlan must be between 0 and 4094
   */
  vlan: number
}

export type CreateBondedNetworkBody = BaseCreateNetworkBody & {
  pifIds: XoPif['id'][]
  bondMode: BOND_MODE
}

export type CreateInternalNetworkBody = BaseCreateNetworkBody

export type CreateVmParams = Parameters<Xapi['createVm']>[1]
/**
 * Properties that is applied after the VM creation
 */
export type CreateVmAfterCreateParams = {
  cloud_config?: string
  network_config?: string
  boot?: boolean
  destroy_cloud_config_vdi?: boolean
  createVtpm?: boolean
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
  install?:
    | {
        method: 'cdrom'
        /** VDI ID */
        repository: string
      }
    | {
        method: 'network'
        repository: ''
      }
} & CreateVmAfterCreateParams

export type PoolDashboard = {
  hosts: {
    status: {
      running: number
      disabled: number
      halted: number
      total: number
    }
    topFiveUsage: {
      ram: { name_label: string; size: number; usage: number; percent: number; id: Unbrand<XoHost>['id'] }[]
      cpu: { name_label: string; percent: number; id: Unbrand<XoHost>['id'] }[]
    }
    missingPatches:
      | {
          hasAuthorization: false
        }
      | { hasAuthorization: true; missingPatches: XcpPatches[] | XsPatches[] }
  }
  vms: {
    status: {
      running: number
      halted: number
      paused: number
      total: number
      suspended: number
    }
    topFiveUsage?: {
      cpu: { id: Unbrand<XoVm>['id']; name_label: string; percent: number }[]
      ram: { id: Unbrand<XoVm>['id']; name_label: string; percent: number; memory: number; memoryFree: number }[]
      isExpired?: boolean
    }
  }
  srs: {
    topFiveUsage: {
      name_label: string
      id: Unbrand<XoSr>['id']
      percent: number
      physical_usage: number
      size: number
    }[]
  }
  alarms: Unbrand<XoAlarm>['id'][]
  cpuProvisioning: {
    total: number
    assigned: number
    percent: number
  }
}

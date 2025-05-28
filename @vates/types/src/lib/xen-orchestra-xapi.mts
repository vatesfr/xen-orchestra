import { WrappedXenApiRecord,XenApiVm, XenApiNetworkWrapped, XenApiRecord } from '../xen-api.mjs'
import type { XoGpuGroup, XoVgpuType, XoHost, XoNetwork, XoPif, XoSr, XoUser, XoVdi, XoVmTemplate } from '../xo.mjs'

type XcpPatches = {
  changelog?: {
    author: string
    date: number
    description: string
  }
  description: string
  license: string
  name: string
  release: string
  size: number
  url: string
  version: string
}
type XsPatches = {
  conflicts?: string[]
  date: string
  description: string
  documentationUrl?: string
  guidances: string
  name: string
  id?: string
  paid?: boolean
  requirements?: string[]
  upgrade?: boolean
  url?: string
  uuid?: string
}

export interface Xapi {
  call: <ReturnType>(...args: unknown[]) => Promise<ReturnType>
  callAsync: <ReturnType>(...args: unknown[]) => Promise<ReturnType>
  createNetwork(
    params:
      | {
          name: string
          description?: string
          mtu?: number
        }
      | {
          name: string
          description?: string
          pifId: XoPif['id']
          mtu?: number
          /* between 0 and 4094 */
          vlan: number
        }
  ): Promise<XenApiNetworkWrapped>
  deleteNetwork(id: XoNetwork['id']): Promise<void>
  listMissingPatches(host: XoHost['id']): Promise<XcpPatches[] | XsPatches[]>
  pool_emergencyShutdown(): Promise<void>
  createVm(
    templateUuid: XoVmTemplate['uuid'],
    metadataVm: {
      name_label: string
      nameLabel?: string
      clone?: boolean
      installRepository?: XoVdi['_xapiRef'] | null
      vdis?: (
        | {
            userdevice?: undefined
            destroy?: undefined
            name_label: string
            size: number
            sr?: XoSr['id']
            name_description?: string
          }
        | {
            userdevice: string
            destroy?: undefined
            name_label?: string
            size?: number
            sr?: XoSr['id']
            name_description?: string
          }
        | { userdevice: string; destroy: true }
      )[]
      // @TODO: improve VIFs types (like for VDIs)
      vifs?: {
        destroy?: boolean
        device?: string
        ipv4_allowed?: string[]
        ipv6_allowed?: string[]
        mac?: string
        network?: string
      }[]
      existingVdis?: {
        $SR: XoSr['id']
        size: number
      }[]
      vgpuType?: XoVgpuType['_xapiRef']
      gpuGroup?: XoGpuGroup['_xapiRef']
      copyHostBiosStrings?: boolean
    },
    checkLimits?: boolean,
    creatorId?: XoUser['id'],
    opts?: { destroyAllVifs: boolean }
  ): Promise<XenApiVm>  
  getField<T extends XenApiRecord, K extends keyof T>(
    type: Extract<WrappedXenApiRecord, T>['$type'],
    ref: T['$ref'],
    field: K
  ): Promise<T[K]>
}

import {
  WrappedXenApiRecord,
  XenApiNetworkWrapped,
  XenApiRecord,
  XenApiSr,
  XenApiVdi,
  XenApiVm,
  XenApiVmWrapped,
} from '../xen-api.mjs'
import type { Readable } from 'node:stream'
import type { XoGpuGroup, XoVgpuType, XoHost, XoNetwork, XoPif, XoSr, XoUser, XoVdi, XoVm, XoVmTemplate } from '../xo.mjs'

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

  getField<T extends XenApiRecord, K extends keyof T>(
    type: Extract<WrappedXenApiRecord, T>['$type'],
    ref: T['$ref'],
    field: K
  ): Promise<T[K]>
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
  resumeVm(id: XoVm['id']): Promise<void>
  unpauseVm(id: XoVm['id']): Promise<void>
  startVm(
    id: XoVm['id'],
    opts?: {
      bypassMacAddressesCheck?: boolean
      force?: boolean
      hostId?: XoHost['id']
      /**
       * if startOnly is true and the VM is not halted, throw VM_BAD_POWER_STATE
       * otherwise, unpause/resume the VM
      *
      * @default false
      */
     startOnly?: boolean
    }
  ): Promise<void>
  VM_import(
    stream: Readable,
    srRef?: XenApiSr['$ref'],
    onVmCreation?: null | ((vm: XenApiVm) => unknown)
  ): Promise<XenApiVm['$ref']>
  createVm(
    templateUuid: XoVmTemplate['uuid'],
    metadataVm: {
      affinityHost?: XoHost['id']
      name_label: string
      nameLabel?: string
      clone?: boolean
      installRepository?: XoVdi['id'] | '' | null
      vdis?: (
        | /** Create VDI */ {
            name_label: string
            size: number
            sr?: XoSr['id']
            name_description?: string
          }
        | /** Update VDI*/ {
            userdevice: string
            name_label?: string
            size?: number
            sr?: XoSr['id']
            name_description?: string
          }
        | /** Destroy VDI*/ { destroy: true; userdevice: string }
      )[]
      vifs?: (
        | /** Create/update VIF */ {
            device?: string
            ipv4_allowed?: string[]
            ipv6_allowed?: string[]
            mac?: string
            mtu?: number
            network: string
          }
        | /** Destroy VIF */ { destroy: true; device: string }
      )[]
      existingVdis?: {
        $SR: XoSr['id']
        size: number
        userdevice: string
      }[]
      vgpuType?: XoVgpuType['id']
      gpuGroup?: XoGpuGroup['id']
      copyHostBiosStrings?: boolean
    },
    checkLimits?: boolean,
    creatorId?: XoUser['id'],
    opts?: { destroyAllVifs: boolean }
  ): Promise<XenApiVmWrapped>
  VDI_destroyCloudInitConfig(vdiRef: XenApiVdi['$ref'], opts?: { timeLimit?: number }): Promise<void>
  VM_createCloudInitConfig(
    vmRef: XenApiVm['$ref'],
    cloudConfig: string,
    opts?: { networkConfig?: string }
  ): Promise<XoVdi['uuid']>
  VM_destroy(
    vmRef: XenApiVm['$ref'],
    opts?: {
      deleteDisks?: boolean
      force?: boolean
      bypassBlockedOperation?: boolean
      forceDeleteDefaultTemplate?: boolean
    }
  ): Promise<void>
}

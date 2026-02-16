import {
  WrappedXenApiRecord,
  XenApiHost,
  XenApiNetwork,
  XenApiNetworkWrapped,
  XenApiRecord,
  XenApiSr,
  XenApiTask,
  XenApiVbd,
  XenApiVdi,
  XenApiVif,
  XenApiVm,
  XenApiVmWrapped,
  XenApiVtpm,
} from '../xen-api.mjs'
import type { OPAQUE_REF_NULL, SUPPORTED_VDI_FORMAT, VBD_MODE, VBD_TYPE, VIF_LOCKING_MODE } from '../common.mjs'
import type { PassThrough, Readable } from 'node:stream'
import type {
  XoGpuGroup,
  XoHost,
  XoNetwork,
  XoPif,
  XoSr,
  XoUser,
  XoVdi,
  XoVgpuType,
  XoVm,
  XoVmTemplate,
  XoVif,
} from '../xo.mjs'

export type XcpPatches = {
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
export type XsPatches = {
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

  barrier<T extends XenApiRecord>(ref: T['$ref']): Promise<Extract<WrappedXenApiRecord, { $ref: T['$ref'] }>>
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
  deleteVif(vifId: XoVif['id']): Promise<void>
  exportVmOva(vmRef: XenApiVm['$ref']): Promise<PassThrough>
  migrateVm(
    vmId: XoVm['id'],
    hostXapi: Xapi,
    hostId: XoHost['id'],
    opts?: {
      force?: boolean
      mapVdisSrs?: Record<XoVdi['id'], XoSr['id']>
      mapVifsNetworks?: Record<XoVif['id'], XoNetwork['id']>
      migrationNetworkId?: XoNetwork['id']
      sr?: XoSr['id']
      bypassAssert?: boolean
    }
  ): Promise<void>
  listMissingPatches(host: XoHost['id']): Promise<XcpPatches[] | XsPatches[]>
  pool_emergencyShutdown(): Promise<void>
  resumeVm(id: XoVm['id']): Promise<void>
  unpauseVm(id: XoVm['id']): Promise<void>
  SR_importVdi(
    ref: XenApiSr['$ref'],
    stream: Readable,
    opts?: {
      format?: SUPPORTED_VDI_FORMAT
      name_description?: XoVdi['name_description']
      name_label?: XoVdi['name_label']
      other_config?: XoVdi['other_config']
      read_only?: boolean
      sharable?: boolean
      SR?: XenApiSr['$ref']
      tags?: XoVdi['tags']
      type?: XoVdi['type']
      virtual_size?: XoVdi['size']
      xenstore_data?: Record<string, string>
    }
  ): Promise<XenApiVdi['$ref']>
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
  VM_export(
    vmRef: XenApiVm['$ref'],
    opts?: { cancelToken?: unknown; compress?: boolean; useSnapshot?: boolean }
  ): ReturnType<Xapi['getResource']>
  VM_import(
    stream: Readable,
    srRef?: XenApiSr['$ref'],
    onVmCreation?: null | ((vm: XenApiVm) => unknown)
  ): Promise<XenApiVm['$ref']>
  createVm(
    templateUuid: XoVmTemplate['uuid'],
    metadataVm: {
      affinityHost?: XoHost['id']
      autoPoweron?: boolean
      memory?: number
      name_description?: string
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
      hvmBootFirmware?: 'uefi' | 'bios'
      secureBoot?: boolean
    },
    checkLimits?: boolean,
    creatorId?: XoUser['id'],
    opts?: { destroyAllVifs: boolean }
  ): Promise<XenApiVmWrapped>
  moveVdi(
    vdiId: XenApiVdi['$ref'] | XoVdi['id'],
    srId: XenApiSr['$ref'] | XoSr['id'],
    opts?: { _failOnCbtError?: boolean }
  ): Promise<XenApiVdi>
  VBD_create(params: {
    bootable?: boolean
    empty?: boolean
    mode?: VBD_MODE
    other_config?: Record<string, string>
    qos_algorithm_params?: Record<string, string>
    qos_algorithm_type?: string
    type?: VBD_TYPE
    unpluggable?: boolean
    userdevice?: string
    VDI: XenApiVdi['$ref'] | OPAQUE_REF_NULL
    VM: XenApiVm['$ref']
  }): Promise<XenApiVbd['$ref']>
  VBD_destroy(vbdRef: XenApiVbd['$ref']): Promise<void>
  VBD_unplug(vbdRef: XenApiVbd['$ref']): Promise<void>
  VDI_destroy(vdiRef: XenApiVdi['$ref']): Promise<void>
  VDI_destroyCloudInitConfig(vdiRef: XenApiVdi['$ref'], opts?: { timeLimit?: number }): Promise<void>
  VDI_exportContent(
    vdiRef: XenApiVdi['$ref'],
    opts: { baseRef?: string; cancelToken?: unknown; format: SUPPORTED_VDI_FORMAT }
  ): Promise<Readable & { length?: number }>
  VDI_importContent(
    vdiRef: XenApiVdi['$ref'],
    stream: Readable,
    opts: { cancelToken?: unknown; format: SUPPORTED_VDI_FORMAT }
  ): Promise<void>
  VIF_create(
    options: {
      currently_attached?: boolean
      device?: string
      ipv4_allowed?: string[]
      ipv6_allowed?: string[]
      locking_mode?: VIF_LOCKING_MODE
      MTU?: number
      network: XenApiNetwork['$ref']
      other_config?: Record<string, string>
      qos_algorithm_params?: Record<string, string>
      qos_algorithm_type?: string
      VM: XenApiVm['$ref']
    },
    extraOptions?: {
      MAC?: string
    }
  ): Promise<XenApiVif['$ref']>
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
  getResource(
    pathname: string,
    params?: { host?: XenApiHost; query?: Record<string, unknown>; task?: boolean | XenApiTask['$ref'] }
  ): Promise<{ body: Readable }>
  isHyperThreadingEnabled(hostId: XoHost['id']): Promise<boolean | null>
  VTPM_create(params: { VM: XenApiVm['$ref']; is_unique?: boolean; contents?: string }): Promise<XenApiVtpm['$ref']>
  forgetSr(id: XoSr['id'] | XenApiSr['$ref']): Promise<void>
}

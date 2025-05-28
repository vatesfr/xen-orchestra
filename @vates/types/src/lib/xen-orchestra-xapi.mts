import { WrappedXenApiRecord, XenApiRecord, XenApiVm } from '../xen-api.mjs'
import { XoGpuGroup, XoSr, XoUser, XoVdi, XoVgpuType, XoVmTemplate } from '../xo.mjs'

export interface Xapi {
  call: <ReturnType>(...args: unknown[]) => Promise<ReturnType>
  callAsync: <ReturnType>(...args: unknown[]) => Promise<ReturnType>
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
            destroy?: boolean
            name_label?: string
            size?: number
            sr?: XoSr['id']
            name_description?: string
          }
      )[]
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
    key: K
  ): Promise<T[K]>
}

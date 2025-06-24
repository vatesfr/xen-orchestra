import { WrappedXenApiRecord, XenApiNetworkWrapped, XenApiRecord, XenApiSr, XenApiVm } from '../xen-api.mjs'
import type { Readable } from 'node:stream'
import type { XoHost, XoNetwork, XoPif, XoVm } from '../xo.mjs'

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
}
